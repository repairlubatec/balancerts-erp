import { createHash } from "node:crypto";
import { createFileAsset, createBalancertsIaLogForUser, getBalancertsIaConfigForUserCompany } from "../db";
import { storagePut } from "../storage";
import { buildDocumentIntelligenceWorkbook, extractStructuredDocument } from "./document-intelligence";

function safeExtension(filename: string) { return filename.toLowerCase().match(/\.[a-z0-9]{1,8}$/)?.[0] ?? ""; }

export async function importAndAnalyzeBalancertsDocument(input: { userId: number; companyId: number; filename: string; mimeType: string; contentBase64: string }) {
  const filename = input.filename.trim().replace(/[^a-zA-Z0-9._-]/g, "_");
  const buffer = Buffer.from(input.contentBase64, "base64");
  if (!filename || buffer.length === 0 || buffer.length > 15 * 1024 * 1024) throw new Error("DOCUMENTO_IMPORTACAO_INVALIDO");
  const sha256 = createHash("sha256").update(buffer).digest("hex");
  const config = await getBalancertsIaConfigForUserCompany({ userId: input.userId, companyId: input.companyId });
  if (!config.enabled) throw new Error("IA_DESACTIVADA");
  const analysis = extractStructuredDocument({ filename, mimeType: input.mimeType, spreadsheetBuffer: /spreadsheet|excel/.test(input.mimeType) || /\.(xlsx|xls)$/i.test(filename) ? buffer : undefined, text: /text\/|json/.test(input.mimeType) ? buffer.toString("utf8") : undefined });
  const uploaded = await storagePut(`balancerts-ia/${input.companyId}/${sha256}${safeExtension(filename)}`, buffer, input.mimeType || "application/octet-stream");
  const file = await createFileAsset({ userId: input.userId, organizationId: config.organizationId, companyId: input.companyId, storageKey: uploaded.key, filename, mimeType: input.mimeType, size: buffer.length, sha256, category: "OUTRO", description: `Importação Document Intelligence — ${analysis.documentType}`, reference: `ia-import:${sha256}` });
  const resultSummary = JSON.stringify({ fileId: file.id, filename, sha256, category: analysis.documentType, confidence: analysis.confidence, fields: { companyName: analysis.companyName, nif: analysis.nif, periodYear: analysis.periodYear }, metrics: analysis.metrics, requiresHumanValidation: true, onlineCalls: false });
  await createBalancertsIaLogForUser({ userId: input.userId, companyId: input.companyId, operation: "IMPORTAR_ANALISAR_DOCUMENTO", provider: analysis.source === "EXCEL_LOCAL" || analysis.source === "TEXTO_LOCAL" ? "EXTRACAO_HEURISTICA_LOCAL" : "EXTRACAO_HEURISTICA_LOCAL", model: "document-intelligence-local-v1", confidence: analysis.confidence * 100, requestSummary: JSON.stringify({ filename, mimeType: input.mimeType, size: buffer.length, sha256 }), resultSummary });
  return { fileId: file.id, filename, sha256, category: analysis.documentType, analysis, reviewRequired: true, storageKey: uploaded.key, exportWorkbookBase64: buildDocumentIntelligenceWorkbook(Object.entries({ companyName: analysis.companyName, nif: analysis.nif, periodYear: analysis.periodYear }).map(([field, value]) => ({ field, value: value == null ? "" : String(value), confidence: analysis.confidence, source: "EXTRACAO_HEURISTICA_LOCAL" }))).toString("base64") };
}
