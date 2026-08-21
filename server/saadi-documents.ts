import { createHash } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";
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

export async function suggestSaadiDocumentExtraction(input: { userId: number; organizationId: number; studyId: number; documentId: number; extractedText: string }) {
  await assertStudyAccess(input.userId, input.organizationId, input.studyId);
  if (!input.extractedText.trim() || input.extractedText.length > 100_000) throw new Error("SAADI_DOCUMENT_TEXT_INVALID");
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const response = await invokeLLM({ model: "gpt-5-mini", messages: [{ role: "system", content: "És o Balancerts IA. Extrai dados financeiros para um estudo SAADI. Nunca declares que os valores estão validados; devolve apenas sugestões estruturadas." }, { role: "user", content: input.extractedText }], response_format: { type: "json_schema", json_schema: { name: "saadi_document_extraction", strict: true, schema: { type: "object", properties: { documentType: { type: "string" }, periodYear: { type: ["integer", "null"] }, companyName: { type: ["string", "null"] }, nif: { type: ["string", "null"] }, metrics: { type: "array", items: { type: "object", properties: { section: { type: "string" }, metric: { type: "string" }, value: { type: "number" }, page: { type: ["integer", "null"] }, field: { type: ["string", "null"] } }, required: ["section", "metric", "value", "page", "field"], additionalProperties: false } } }, required: ["documentType", "periodYear", "companyName", "nif", "metrics"], additionalProperties: false } } } });
  const content = response.choices[0]?.message?.content;
  const extractionJson = typeof content === "string" ? content : JSON.stringify(content);
  await db.update(saadiStudyDocuments).set({ extractionStatus: "EXTRAIDO", extractionJson }).where(and(eq(saadiStudyDocuments.id, input.documentId), eq(saadiStudyDocuments.studyId, input.studyId), eq(saadiStudyDocuments.organizationId, input.organizationId)));
  return { status: "EXTRAIDO" as const, extractionJson, message: "Extraído por IA — necessita de validação." };
}

export async function reviewSaadiStudyDocument(input: { userId: number; organizationId: number; studyId: number; documentId: number; status: "EM_REVISAO" | "VALIDADO" | "REJEITADO"; notes?: string }) {
  await assertStudyAccess(input.userId, input.organizationId, input.studyId);
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(saadiStudyDocuments).set({ extractionStatus: input.status, validationNotes: input.notes?.trim(), validatedBy: input.status === "VALIDADO" ? input.userId : null, validatedAt: input.status === "VALIDADO" ? new Date() : null }).where(and(eq(saadiStudyDocuments.id, input.documentId), eq(saadiStudyDocuments.studyId, input.studyId), eq(saadiStudyDocuments.organizationId, input.organizationId)));
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: 0, actorUserId: input.userId, action: `SAADI_DOCUMENT_${input.status}`, entityType: "saadiStudyDocument", entityId: String(input.documentId), beforeState: null, afterState: JSON.stringify({ status: input.status, notes: input.notes ?? null }), correlationId: `saadi-document-review:${input.documentId}:${Date.now()}` });
  return { updated: true, status: input.status, message: input.status === "VALIDADO" ? "Validado pelo contabilista." : "Estado do documento actualizado." };
}
