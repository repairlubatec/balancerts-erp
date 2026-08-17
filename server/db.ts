import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, auditEvents, businessDocuments, chartAccounts, companies, documentSeries, fileAssets, fiscalPeriods, journalEntries, journalLines, organizations, users } from "../drizzle/schema";
import { buildTrialBalance } from "./reports";
import { formatDocumentNumber } from "./documents";
import { validateBalancedEntry, validateDocumentTransition, type JournalLineInput } from "./accounting";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  values.lastSignedIn ??= new Date();
  updateSet.lastSignedIn ??= new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getCompaniesForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ company: companies, organization: organizations }).from(companies).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(eq(organizations.ownerUserId, userId)).orderBy(companies.name);
}

export async function getPeriodsForUserCompany(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ period: fiscalPeriods }).from(fiscalPeriods).innerJoin(companies, eq(fiscalPeriods.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(organizations.ownerUserId, userId), eq(companies.id, companyId))).orderBy(desc(fiscalPeriods.year), desc(fiscalPeriods.month));
}

export async function getDocumentsForUserCompany(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ document: businessDocuments }).from(businessDocuments).innerJoin(companies, eq(businessDocuments.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(organizations.ownerUserId, userId), eq(companies.id, companyId))).orderBy(desc(businessDocuments.createdAt));
}

export async function appendAuditEvent(input: typeof auditEvents.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(auditEvents).values(input);
  return result;
}

export async function createFileAsset(input: { userId: number; organizationId: number; companyId: number; storageKey: string; filename: string; mimeType: string; size: number; sha256: string; allowedUserIds?: number[] }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const company = await db.select({ id: companies.id }).from(companies).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(companies.id, input.companyId), eq(companies.organizationId, input.organizationId), eq(organizations.ownerUserId, input.userId))).limit(1);
  if (!company[0]) throw new Error("COMPANY_NOT_FOUND_OR_FORBIDDEN");
  const result = await db.insert(fileAssets).values({ organizationId: input.organizationId, companyId: input.companyId, ownerUserId: input.userId, storageKey: input.storageKey, filename: input.filename, mimeType: input.mimeType, size: input.size, sha256: input.sha256, allowedUserIds: JSON.stringify(input.allowedUserIds ?? []) });
  return { id: result[0].insertId, storageKey: input.storageKey };
}

export async function getFileAssetForUser(input: { userId: number; companyId: number; fileId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ file: fileAssets }).from(fileAssets).innerJoin(companies, eq(fileAssets.companyId, companies.id)).innerJoin(organizations, eq(fileAssets.organizationId, organizations.id)).where(and(eq(fileAssets.id, input.fileId), eq(fileAssets.companyId, input.companyId), eq(organizations.ownerUserId, input.userId))).limit(1);
  const file = rows[0]?.file;
  if (!file) throw new Error("FILE_NOT_FOUND_OR_FORBIDDEN");
  const allowed = JSON.parse(file.allowedUserIds ?? "[]") as number[];
  if (file.ownerUserId !== input.userId && !allowed.includes(input.userId)) throw new Error("FILE_DOWNLOAD_FORBIDDEN");
  return { ...file, allowedUserIds: allowed };
}

export async function reserveDocumentNumber(input: { userId: number; companyId: number; series: string; documentType: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.transaction(async (tx) => {
    const rows = await tx.select({ series: documentSeries, organization: organizations }).from(documentSeries).innerJoin(companies, eq(documentSeries.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(documentSeries.companyId, input.companyId), eq(documentSeries.code, input.series), eq(documentSeries.documentType, input.documentType), eq(documentSeries.active, 1), eq(organizations.ownerUserId, input.userId))).limit(1);
    const current = rows[0];
    if (!current) throw new Error("DOCUMENT_SERIES_NOT_FOUND_OR_FORBIDDEN");
    const number = current.series.nextNumber;
    await tx.update(documentSeries).set({ nextNumber: sql`${documentSeries.nextNumber} + 1` }).where(eq(documentSeries.id, current.series.id));
    return { series: input.series, documentType: input.documentType, number, formatted: formatDocumentNumber(input.series, number) };
  });
}

export async function getTrialBalanceForUserCompany(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) return buildTrialBalance([]);
  const rows = await db.select({ code: chartAccounts.code, name: chartAccounts.name, debit: journalLines.debit, credit: journalLines.credit }).from(journalLines).innerJoin(journalEntries, eq(journalLines.entryId, journalEntries.id)).innerJoin(chartAccounts, eq(journalLines.accountId, chartAccounts.id)).innerJoin(companies, eq(journalEntries.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(organizations.ownerUserId, userId), eq(companies.id, companyId), eq(journalEntries.status, "POSTED")));
  return buildTrialBalance(rows.map((row) => ({ accountCode: row.code, accountName: row.name, debit: Number(row.debit), credit: Number(row.credit) })));
}

export async function transitionBusinessDocument(input: { userId: number; companyId: number; documentId: number; to: "DRAFT" | "VALIDATED" | "ISSUED" | "ACCOUNTED" | "CANCELLED" }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const document = await db.select({ document: businessDocuments, organization: organizations }).from(businessDocuments).innerJoin(companies, eq(businessDocuments.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(businessDocuments.id, input.documentId), eq(businessDocuments.companyId, input.companyId), eq(organizations.ownerUserId, input.userId))).limit(1);
  const current = document[0];
  if (!current) throw new Error("DOCUMENT_NOT_FOUND_OR_FORBIDDEN");
  if (!validateDocumentTransition(current.document.status, input.to)) throw new Error("INVALID_DOCUMENT_TRANSITION");
  const issuedAt = input.to === "ISSUED" ? new Date() : current.document.issuedAt;
  await db.update(businessDocuments).set({ status: input.to, issuedAt }).where(eq(businessDocuments.id, input.documentId));
  await appendAuditEvent({ organizationId: current.organization.id, companyId: input.companyId, actorUserId: input.userId, action: `DOCUMENT_${input.to}`, entityType: "businessDocument", entityId: String(input.documentId), beforeState: JSON.stringify({ status: current.document.status }), afterState: JSON.stringify({ status: input.to }), correlationId: crypto.randomUUID() });
  return { id: input.documentId, from: current.document.status, to: input.to };
}

export async function postJournalEntry(input: { companyId: number; periodId: number; sourceDocumentId?: number; idempotencyKey: string; description: string; createdBy: number; lines: (JournalLineInput & { currency?: string; exchangeRate?: number })[] }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const validation = validateBalancedEntry(input.lines);
  if (!validation.ok) throw new Error(validation.reason);
  return db.transaction(async (tx) => {
    const existing = await tx.select().from(journalEntries).where(eq(journalEntries.idempotencyKey, input.idempotencyKey)).limit(1);
    if (existing[0]) return { entry: existing[0], idempotent: true };
    const period = await tx.select().from(fiscalPeriods).where(and(eq(fiscalPeriods.id, input.periodId), eq(fiscalPeriods.companyId, input.companyId))).limit(1);
    if (!period[0] || period[0].status === "CLOSED") throw new Error("PERIOD_NOT_OPEN");
    const inserted = await tx.insert(journalEntries).values({ companyId: input.companyId, periodId: input.periodId, sourceDocumentId: input.sourceDocumentId, idempotencyKey: input.idempotencyKey, description: input.description, createdBy: input.createdBy, status: "POSTED" });
    const entryId = Number(inserted[0].insertId);
    await tx.insert(journalLines).values(input.lines.map((line) => ({ entryId, accountId: line.accountId, debit: line.debit.toFixed(2), credit: line.credit.toFixed(2), currency: line.currency ?? "AOA", exchangeRate: (line.exchangeRate ?? 1).toFixed(8) })));
    return { entryId, idempotent: false };
  });
}
