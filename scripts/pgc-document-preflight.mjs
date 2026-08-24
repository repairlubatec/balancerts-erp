import fs from "node:fs/promises";

const ACCOUNT_LINE = /^\s*(\d+(?:\.\d+)*)\s+—\s+(.+?)\s*$/u;
const RESERVED_NAME = "RESERVED_PGC_EXTENSION";
const DOCUMENT_END = /^FIM DO DOCUMENTO\s*$/u;
const PROHIBITED_GENERIC_CODES = new Set(["999", "9999"]);
const PROHIBITED_GENERIC_NAMES = new Set(["OUTROS", "CONTABILIDADE"]);

function parentCodeOf(code) {
  const parts = code.split(".");
  return parts.length > 1 ? parts.slice(0, -1).join(".") : null;
}

export function analysePgcDocument(text) {
  const lines = String(text ?? "").split(/\r?\n/u);
  const endIndex = lines.findIndex(line => DOCUMENT_END.test(line.trim()));
  const principalLines = endIndex >= 0 ? lines.slice(0, endIndex) : lines;
  const trailingLines = endIndex >= 0 ? lines.slice(endIndex + 1) : [];
  const accounts = [];

  principalLines.forEach((line, index) => {
    const match = line.match(ACCOUNT_LINE);
    if (!match) return;
    accounts.push({ code: match[1], name: match[2].trim(), line: index + 1 });
  });

  const byCode = new Map();
  for (const account of accounts) {
    const existing = byCode.get(account.code) ?? [];
    existing.push(account);
    byCode.set(account.code, existing);
  }

  const duplicateCodes = [...byCode.entries()]
    .filter(([, occurrences]) => occurrences.length > 1)
    .map(([code, occurrences]) => ({ code, lines: occurrences.map(item => item.line), names: occurrences.map(item => item.name) }));
  const codeSet = new Set(accounts.map(account => account.code));
  const missingParents = accounts
    .map(account => ({ ...account, parentCode: parentCodeOf(account.code) }))
    .filter(account => account.parentCode && !codeSet.has(account.parentCode));
  const reservedExtensions = accounts.filter(account => account.name === RESERVED_NAME);
  const prohibitedGenericAccounts = accounts.filter(account => PROHIBITED_GENERIC_CODES.has(account.code) || PROHIBITED_GENERIC_NAMES.has(account.name.toUpperCase()));
  const trailingContent = trailingLines.map(line => line.trim()).filter(Boolean);
  const hasConcatenatedContent = trailingContent.length > 0;

  return {
    accountCount: accounts.length,
    duplicateCodes,
    missingParents,
    reservedExtensions,
    prohibitedGenericAccounts,
    hasConcatenatedContent,
    documentEndLine: endIndex >= 0 ? endIndex + 1 : null,
    sourceShape: endIndex >= 0 && hasConcatenatedContent ? "CONCATENATED_DOCUMENTS" : "SINGLE_DOCUMENT",
    safeForNormativeImport: duplicateCodes.length === 0 && !hasConcatenatedContent && prohibitedGenericAccounts.length === 0,
    safeForActivation: false,
    activationBlockers: [
      "MATRIZ_JURIDICA_E_VALIDACAO_HUMANA_NECESSARIAS",
      ...(duplicateCodes.length ? ["CODIGOS_DUPLICADOS"] : []),
      ...(hasConcatenatedContent ? ["DOCUMENTOS_CONCATENADOS"] : []),
      ...(reservedExtensions.length ? ["EXTENSOES_RESERVADAS_NAO_MOVIMENTAVEIS"] : []),
      ...(prohibitedGenericAccounts.length ? ["CONTAS_GENERICAS_PROIBIDAS"] : []),
    ],
  };
}

export async function analysePgcDocumentFile(path) {
  return analysePgcDocument(await fs.readFile(path, "utf8"));
}

if (process.argv[1] && process.argv[1].endsWith("pgc-document-preflight.mjs")) {
  const path = process.argv[2];
  if (!path) {
    console.error("Utilização: node scripts/pgc-document-preflight.mjs <ficheiro>");
    process.exitCode = 2;
  } else {
    const result = await analysePgcDocumentFile(path);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }
}
