import fs from "node:fs/promises";
import { analysePgcDocument } from "./pgc-document-preflight.mjs";

const ACCOUNT_LINE = /^\s*(\d+(?:\.\d+)*)\s+—\s+(.+?)\s*$/u;

function csv(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export function buildPgcComplianceMatrix(text) {
  const analysis = analysePgcDocument(text);
  const lines = String(text ?? "").split(/\r?\n/u);
  const endIndex = analysis.documentEndLine ? analysis.documentEndLine - 1 : lines.length;
  const accounts = [];
  const duplicateCodes = new Set(analysis.duplicateCodes.map(item => item.code));
  const reservedCodes = new Set(analysis.reservedExtensions.map(item => item.code));
  const prohibitedGenericCodes = new Set(analysis.prohibitedGenericAccounts.map(item => item.code));
  const codeSet = new Set();

  for (let index = 0; index < endIndex; index += 1) {
    const match = lines[index].match(ACCOUNT_LINE);
    if (!match) continue;
    const code = match[1];
    const parts = code.split(".");
    const parentCode = parts.length > 1 ? parts.slice(0, -1).join(".") : "";
    codeSet.add(code);
    accounts.push({ code, name: match[2].trim(), parentCode, level: parts.length, line: index + 1 });
  }

  const rows = accounts.map(account => {
    const parentMissing = Boolean(account.parentCode && !codeSet.has(account.parentCode));
    const duplicate = duplicateCodes.has(account.code);
    const reserved = reservedCodes.has(account.code);
    const prohibitedGeneric = prohibitedGenericCodes.has(account.code);
    const validationStatus = duplicate || parentMissing || prohibitedGeneric ? "REQUIRES_HUMAN_VALIDATION" : "NEEDS_NORMATIVE_VALIDATION";
    return {
      ...account,
      reserved,
      prohibitedGeneric,
      duplicate,
      parentMissing,
      validationStatus,
      sourceStatus: "REQUIRES_PRIMARY_SOURCE_CONFIRMATION",
      implementationDecision: "STAGING_ONLY_NOT_ACTIVATED",
    };
  });

  return { analysis, rows };
}

export function matrixCsv(text) {
  const { rows } = buildPgcComplianceMatrix(text);
  const header = ["codigo", "designacao", "codigo_pai", "nivel", "linha_anexo", "extensao_reservada", "conta_generica_proibida", "codigo_duplicado", "pai_em_falta", "estado_validacao", "estado_fonte", "decisao_implementacao"];
  const body = rows.map(row => [row.code, row.name, row.parentCode, row.level, row.line, row.reserved, row.prohibitedGeneric, row.duplicate, row.parentMissing, row.validationStatus, row.sourceStatus, row.implementationDecision].map(csv).join(","));
  return [header.map(csv).join(","), ...body].join("\n") + "\n";
}

if (process.argv[1] && process.argv[1].endsWith("pgc-document-matrix.mjs")) {
  const inputPath = process.argv[2];
  const outputPath = process.argv[3];
  if (!inputPath || !outputPath) {
    console.error("Utilização: node scripts/pgc-document-matrix.mjs <entrada> <saida.csv>");
    process.exitCode = 2;
  } else {
    const input = await fs.readFile(inputPath, "utf8");
    await fs.writeFile(outputPath, matrixCsv(input), "utf8");
    const { analysis, rows } = buildPgcComplianceMatrix(input);
    process.stdout.write(JSON.stringify({ rows: rows.length, duplicateCodes: analysis.duplicateCodes.length, reservedExtensions: analysis.reservedExtensions.length, safeForActivation: analysis.safeForActivation }) + "\n");
  }
}
