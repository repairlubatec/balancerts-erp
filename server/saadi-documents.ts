import { createHash } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { appendAuditEventForUser, getDb } from "./db";
import { organizations, saadiStudyDocuments, saadiStudies } from "../drizzle/schema";
import { storageGetSignedUrl } from "./storage";

async function assertStudyAccess(userId: number, organizationId: number, studyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ study: saadiStudies }).from(saadiStudies).innerJoin(organizations, eq(saadiStudies.organizationId, organizations.id)).where(and(eq(saadiStudies.id, studyId), eq(saadiStudies.organizationId, organizationId), eq(organizations.id, organizationId))).limit(1);
  if (!rows[0]) throw new Error("SAADI_STUDY_NOT_FOUND_OR_FORBIDDEN");
}

export async function createSaadiStudyDocument(input: { userId: number; organizationId: number; companyId?: number; studyId: number; filename: string; mimeType: string; size: number; storageKey: string; category: string; sourceLabel?: string; sha256?: string }) {
  await assertStudyAccess(input.userId, input.organizationId, input.studyId);
  if (!input.filename.trim() || input.size <= 0 || input.size > 25 * 1024 * 1024 || !input.storageKey.trim()) throw new Error("SAADI_DOCUMENT_INVALID");
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const sha256 = input.sha256?.trim() || createHash("sha256").update(`${input.storageKey}:${input.filename}:${input.size}`).digest("hex");
  const existing = await db.select().from(saadiStudyDocuments).where(and(eq(saadiStudyDocuments.organizationId, input.organizationId), eq(saadiStudyDocuments.studyId, input.studyId), eq(saadiStudyDocuments.sha256, sha256))).limit(1);
  if (existing[0]) return existing[0];
  await db.insert(saadiStudyDocuments).values({ organizationId: input.organizationId, companyId: input.companyId ?? null, studyId: input.studyId, filename: input.filename.trim(), mimeType: input.mimeType.trim(), size: input.size, storageKey: input.storageKey.trim(), sha256, category: input.category.trim(), sourceLabel: input.sourceLabel?.trim(), createdBy: input.userId });
  const rows = await db.select().from(saadiStudyDocuments).where(and(eq(saadiStudyDocuments.studyId, input.studyId), eq(saadiStudyDocuments.sha256, sha256))).orderBy(desc(saadiStudyDocuments.id)).limit(1);
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId ?? 0, actorUserId: input.userId, action: "SAADI_DOCUMENT_ADDED", entityType: "saadiStudyDocument", entityId: String(rows[0]?.id ?? 0), beforeState: null, afterState: JSON.stringify({ filename: input.filename, category: input.category, sha256 }), correlationId: `saadi-document:${input.studyId}:${sha256}` });
  return rows[0];
}

export async function listSaadiStudyDocuments(input: { userId: number; organizationId: number; studyId: number }) {
  await assertStudyAccess(input.userId, input.organizationId, input.studyId);
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const documents = await db.select().from(saadiStudyDocuments).where(and(eq(saadiStudyDocuments.organizationId, input.organizationId), eq(saadiStudyDocuments.studyId, input.studyId))).orderBy(desc(saadiStudyDocuments.createdAt));
  return Promise.all(documents.map(async (document) => ({ ...document, downloadUrl: await storageGetSignedUrl(document.storageKey) })));
}

function normaliseNumber(value: string) {
  const cleaned = value.replace(/\s/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(/,/g, ".");
  const number = Number(cleaned.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(number) ? number : null;
}

export function extractDocumentFieldsOffline(extractedText: string) {
  const text = extractedText.replace(/\r/g, "");
  const upper = text.toUpperCase();
  const documentType = /\bFACTURA\b|\bFATURA\b/.test(upper) ? "FACTURA" : /\bRECIBO\b/.test(upper) ? "RECIBO" : /\bBALANCETE\b/.test(upper) ? "BALANCETE" : /\bBALAN[CÇ]O\b/.test(upper) ? "BALANCO" : /\bDEMONSTRA[CÇ][AÃ]O DE RESULTADOS\b|\bDRE\b/.test(upper) ? "DRE" : /\bEXTRACTO\b|\bEXTRATO\b/.test(upper) ? "EXTRACTO_BANCARIO" : "OUTRO";
  const yearMatch = text.match(/\b(20\d{2})\b/);
  const nifMatch = text.match(/\b(?:NIF|N\.I\.F\.?)[\s:.-]*([0-9]{9,14})\b/i);
  const companyMatch = text.match(/(?:Fornecedor|Cliente|Empresa|Denomina[cç][aã]o social)[\s:]+([^\n]{2,120})/i);
  const metrics: Array<{ section: string; metric: string; value: number; page: number | null; field: string | null }> = [];
  const patterns: Array<[string, RegExp]> = [["total", /(?:Total|Valor total|Total geral)[\s:€KzA-Z]*([0-9][0-9 .]*[,\.]?[0-9]*)/i], ["iva", /(?:IVA|Imposto)[\s:%KzA-Z]*([0-9][0-9 .]*[,\.]?[0-9]*)/i], ["receita", /(?:Receita|Vendas|Proveitos)[\s:KzA-Z]*([0-9][0-9 .]*[,\.]?[0-9]*)/i], ["despesas", /(?:Despesas|Custos|Gastos)[\s:KzA-Z]*([0-9][0-9 .]*[,\.]?[0-9]*)/i]];
  for (const [metric, pattern] of patterns) { const match = text.match(pattern); const value = match?.[1] ? normaliseNumber(match[1]) : null; if (value !== null) metrics.push({ section: documentType, metric, value, page: null, field: metric }); }
  return { documentType, periodYear: yearMatch ? Number(yearMatch[1]) : null, companyName: companyMatch?.[1]?.trim() ?? null, nif: nifMatch?.[1] ?? null, metrics, provider: "EXTRACAO_HEURISTICA_LOCAL", model: "parser-offline-v1", confidence: metrics.length > 0 ? 0.72 : 0.35 };
}

async function tryLocalModelSuggestion(text: string) {
  const baseUrl = process.env.BALANCERTS_IA_LOCAL_BASE_URL ?? "http://127.0.0.1:11434";
  const model = process.env.BALANCERTS_IA_LOCAL_MODEL ?? "qwen2.5:3b";
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/generate`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ model, prompt: `Extrai apenas JSON com documentType, periodYear, companyName, nif e metrics de: ${text.slice(0, 20000)}`, stream: false, options: { temperature: 0 } }), signal: AbortSignal.timeout(1500) });
    if (!response.ok) return null;
    const body = await response.json() as { response?: string };
    if (!body.response) return null;
    const parsed = JSON.parse(body.response) as Record<string, unknown>;
    return { ...parsed, provider: "RUNTIME_LOCAL", model, confidence: 0.8 };
  } catch { return null; }
}

export async function suggestSaadiDocumentExtraction(input: { userId: number; organizationId: number; studyId: number; documentId: number; extractedText: string }) {
  await assertStudyAccess(input.userId, input.organizationId, input.studyId);
  if (!input.extractedText.trim() || input.extractedText.length > 100_000) throw new Error("SAADI_DOCUMENT_TEXT_INVALID");
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const localSuggestion = await tryLocalModelSuggestion(input.extractedText);
  const extraction = localSuggestion ?? extractDocumentFieldsOffline(input.extractedText);
  const extractionJson = JSON.stringify({ ...extraction, requiresHumanValidation: true, onlineCalls: false });
  await db.update(saadiStudyDocuments).set({ extractionStatus: "EXTRAIDO", extractionJson }).where(and(eq(saadiStudyDocuments.id, input.documentId), eq(saadiStudyDocuments.studyId, input.studyId), eq(saadiStudyDocuments.organizationId, input.organizationId)));
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: 0, actorUserId: input.userId, action: "BALANCERTS_IA_DOCUMENT_EXTRACTED_OFFLINE", entityType: "saadiStudyDocument", entityId: String(input.documentId), beforeState: null, afterState: extractionJson, correlationId: `balancerts-ia-extraction:${input.documentId}:${Date.now()}` });
  return { status: "EXTRAIDO" as const, extractionJson, provider: localSuggestion ? "RUNTIME_LOCAL" : "EXTRACAO_HEURISTICA_LOCAL", message: "Extraído localmente — necessita de validação humana." };
}

export async function reprocessSaadiStudyDocument(input: { userId: number; organizationId: number; studyId: number; documentId: number; extractedText: string }) {
  await assertStudyAccess(input.userId, input.organizationId, input.studyId);
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(saadiStudyDocuments).set({ extractionStatus: "NAO_INICIADA", validationNotes: "Reprocessamento solicitado; revisão humana continua obrigatória." }).where(and(eq(saadiStudyDocuments.id, input.documentId), eq(saadiStudyDocuments.studyId, input.studyId), eq(saadiStudyDocuments.organizationId, input.organizationId)));
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: 0, actorUserId: input.userId, action: "BALANCERTS_IA_DOCUMENT_REPROCESS_REQUESTED", entityType: "saadiStudyDocument", entityId: String(input.documentId), beforeState: null, afterState: JSON.stringify({ status: "NAO_INICIADA" }), correlationId: `balancerts-ia-reprocess:${input.documentId}:${Date.now()}` });
  return suggestSaadiDocumentExtraction(input);
}

export async function reviewSaadiStudyDocument(input: { userId: number; organizationId: number; studyId: number; documentId: number; status: "EM_REVISAO" | "VALIDADO" | "REJEITADO"; notes?: string }) {
  await assertStudyAccess(input.userId, input.organizationId, input.studyId);
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(saadiStudyDocuments).set({ extractionStatus: input.status, validationNotes: input.notes?.trim(), validatedBy: input.status === "VALIDADO" ? input.userId : null, validatedAt: input.status === "VALIDADO" ? new Date() : null }).where(and(eq(saadiStudyDocuments.id, input.documentId), eq(saadiStudyDocuments.studyId, input.studyId), eq(saadiStudyDocuments.organizationId, input.organizationId)));
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: 0, actorUserId: input.userId, action: `SAADI_DOCUMENT_${input.status}`, entityType: "saadiStudyDocument", entityId: String(input.documentId), beforeState: null, afterState: JSON.stringify({ status: input.status, notes: input.notes ?? null }), correlationId: `saadi-document-review:${input.documentId}:${Date.now()}` });
  return { updated: true, status: input.status, message: input.status === "VALIDADO" ? "Validado pelo contabilista." : "Estado do documento actualizado." };
}
