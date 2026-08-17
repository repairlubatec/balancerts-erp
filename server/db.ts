import { createHash } from "node:crypto";
import { validateAuditSnapshotShape } from "./audit-chain";
import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, auditEvents, businessDocuments, chartAccounts, companies, documentSeries, fileAssets, fiscalExercises, fiscalPeriods, journalEntries, journalLines, organizations, platforms, stockMovements, users } from "../drizzle/schema";
import { buildAgingReport, buildBalanceSheet, buildFiscalRegister, buildIncomeStatement, buildJournal, buildLedger, buildTrialBalance, buildVatSummary, type JournalRow } from "./reports";
import { reconcileInventoryToLedger } from "./inventory-posting";
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
  return db.select({ company: companies, organization: organizations, platform: platforms }).from(companies).innerJoin(organizations, eq(companies.organizationId, organizations.id)).leftJoin(platforms, eq(organizations.platformId, platforms.id)).where(eq(organizations.ownerUserId, userId)).orderBy(companies.name);
}

export async function createCompanyForUser(input: {
  userId: number;
  name: string;
  nif: string;
  functionalCurrency: string;
  ivaRegime: "GERAL" | "SIMPLIFICADO" | "EXCLUSAO";
  legalForm?: string;
  address?: string;
  municipality?: string;
  province?: string;
  phone?: string;
  email?: string;
  activity?: string;
  incorporationYear?: number;
  legalRepresentatives?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const organization = await db.select({ id: organizations.id }).from(organizations).where(eq(organizations.ownerUserId, input.userId)).limit(1);
  if (!organization[0]) throw new Error("ORGANIZATION_REQUIRED");
  const result = await db.insert(companies).values({
    organizationId: organization[0].id,
    name: input.name,
    nif: input.nif,
    functionalCurrency: input.functionalCurrency,
    ivaRegime: input.ivaRegime,
    legalForm: input.legalForm,
    address: input.address,
    municipality: input.municipality,
    province: input.province,
    phone: input.phone,
    email: input.email,
    activity: input.activity,
    incorporationYear: input.incorporationYear,
    configurationStatus: "PENDING",
    legalRepresentatives: input.legalRepresentatives,
  });
  await appendAuditEvent({ organizationId: organization[0].id, companyId: Number(result[0].insertId), actorUserId: input.userId, action: "COMPANY_CREATED_PENDING", entityType: "company", entityId: String(result[0].insertId), beforeState: null, afterState: JSON.stringify({ name: input.name, nif: input.nif, configurationStatus: "PENDING" }), correlationId: `company:${result[0].insertId}` });
  const created = await db.select({ company: companies, organization: organizations }).from(companies).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(companies.id, Number(result[0].insertId)), eq(organizations.ownerUserId, input.userId))).limit(1);
  return created[0];
}

export function getCompanyActivationTransition(configurationStatus: "PENDING" | "READY" | "BLOCKED") {
  if (configurationStatus === "READY") throw new Error("COMPANY_ALREADY_READY");
  if (configurationStatus === "BLOCKED") throw new Error("COMPANY_CONFIGURATION_BLOCKED");
  return { before: "PENDING" as const, after: "READY" as const };
}

export async function activateCompanyForUser(input: { userId: number; companyId: number; confirmation: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  if (input.confirmation !== "ACTIVATE_COMPANY") throw new Error("ACTIVATION_CONFIRMATION_REQUIRED");
  const companyContext = await db.select({ company: companies, organization: organizations }).from(companies).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(companies.id, input.companyId), eq(organizations.ownerUserId, input.userId))).limit(1);
  const current = companyContext[0];
  if (!current) throw new Error("COMPANY_NOT_FOUND_OR_FORBIDDEN");
  const transition = getCompanyActivationTransition(current.company.configurationStatus);
  const periods = await db.select({ id: fiscalPeriods.id }).from(fiscalPeriods).where(eq(fiscalPeriods.companyId, input.companyId)).limit(1);
  if (!current.company.nif || !current.company.legalForm || !current.company.address || !current.company.activity || !current.company.primaryLegalRepresentative || !periods[0]) throw new Error("COMPANY_CONFIGURATION_INCOMPLETE");
  await db.update(companies).set({ configurationStatus: "READY" }).where(eq(companies.id, input.companyId));
  await appendAuditEvent({ organizationId: current.organization.id, companyId: input.companyId, actorUserId: input.userId, action: "COMPANY_ACTIVATED", entityType: "company", entityId: String(input.companyId), beforeState: JSON.stringify({ configurationStatus: transition.before }), afterState: JSON.stringify({ configurationStatus: transition.after }), correlationId: `company:${input.companyId}:activation` });
  return { companyId: input.companyId, configurationStatus: "READY" as const };
}

export function assertReadyConfiguration(status: "PENDING" | "READY" | "BLOCKED") {
  if (status !== "READY") throw new Error("COMPANY_CONFIGURATION_PENDING");
  return true as const;
}

async function assertCompanyReady(db: Awaited<ReturnType<typeof getDb>>, userId: number, companyId: number) {
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ company: companies, organization: organizations }).from(companies).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(companies.id, companyId), eq(organizations.ownerUserId, userId))).limit(1);
  if (!rows[0]) throw new Error("COMPANY_NOT_FOUND_OR_FORBIDDEN");
  assertReadyConfiguration(rows[0].company.configurationStatus);
  return rows[0];
}

export async function getExercisesForUserCompany(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ exercise: fiscalExercises }).from(fiscalExercises).innerJoin(companies, eq(fiscalExercises.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(fiscalExercises.companyId, companyId), eq(organizations.ownerUserId, userId))).orderBy(desc(fiscalExercises.year));
}

export async function getPeriodsForUserCompany(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ period: fiscalPeriods }).from(fiscalPeriods).innerJoin(companies, eq(fiscalPeriods.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(organizations.ownerUserId, userId), eq(companies.id, companyId))).orderBy(desc(fiscalPeriods.year), desc(fiscalPeriods.month));
}

export async function getFiscalRegisterForUserCompany(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) return buildFiscalRegister([]);
  const rows = await db.select({ document: businessDocuments }).from(businessDocuments).innerJoin(companies, eq(businessDocuments.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(businessDocuments.companyId, companyId), eq(organizations.ownerUserId, userId))).orderBy(businessDocuments.issuedAt, businessDocuments.id);
  return buildFiscalRegister(rows.map(({ document }) => ({ documentId: document.id, documentNumber: document.documentNumber, issueDate: document.issuedAt ?? document.createdAt, customerNif: null, status: document.status, ivaRegime: document.ivaRegime, netAmount: Number(document.netAmount), taxAmount: Number(document.taxAmount), totalAmount: Number(document.totalAmount) })));
}

export async function getDocumentsForUserCompany(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ document: businessDocuments }).from(businessDocuments).innerJoin(companies, eq(businessDocuments.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(organizations.ownerUserId, userId), eq(companies.id, companyId))).orderBy(desc(businessDocuments.createdAt));
}

export async function appendAuditEvent(input: typeof auditEvents.$inferInsert) {
  validateAuditSnapshotShape({ actorUserId: input.actorUserId, action: input.action, entityType: input.entityType, entityId: input.entityId, correlationId: input.correlationId, beforeState: input.beforeState, afterState: input.afterState });
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const previous = await db.select({ eventHash: auditEvents.eventHash }).from(auditEvents).orderBy(desc(auditEvents.id)).limit(1);
  const previousHash = input.previousHash ?? previous[0]?.eventHash ?? null;
  const eventHash = createHash("sha256").update(JSON.stringify({ ...input, previousHash })).digest("hex");
  const result = await db.insert(auditEvents).values({ ...input, previousHash, eventHash });
  return result;
}

export async function assertFiscalPeriodForUserCompany(input: { actorUserId: number; companyId: number; periodId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const period = await db.select({ id: fiscalPeriods.id }).from(fiscalPeriods).innerJoin(companies, eq(fiscalPeriods.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(fiscalPeriods.id, input.periodId), eq(fiscalPeriods.companyId, input.companyId), eq(organizations.ownerUserId, input.actorUserId))).limit(1);
  if (!period[0]) throw new Error("FISCAL_PERIOD_NOT_FOUND_OR_FORBIDDEN");
  return true as const;
}

export async function assertClosedFiscalPeriodForUserCompany(input: { actorUserId: number; companyId: number; periodId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const period = await db.select({ id: fiscalPeriods.id, status: fiscalPeriods.status }).from(fiscalPeriods).innerJoin(companies, eq(fiscalPeriods.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(fiscalPeriods.id, input.periodId), eq(fiscalPeriods.companyId, input.companyId), eq(fiscalPeriods.status, "CLOSED"), eq(organizations.ownerUserId, input.actorUserId))).limit(1);
  if (!period[0]) throw new Error("FISCAL_PERIOD_NOT_CLOSED_OR_FORBIDDEN");
  return true as const;
}

export async function assertAuditScopeForUser(input: { actorUserId: number; organizationId: number; companyId?: number | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  if (input.companyId !== null && input.companyId !== undefined) {
    const scope = await db.select({ organizationId: organizations.id }).from(companies).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(companies.id, input.companyId), eq(organizations.id, input.organizationId), eq(organizations.ownerUserId, input.actorUserId))).limit(1);
    if (!scope[0]) throw new Error("AUDIT_SCOPE_FORBIDDEN");
  } else {
    const scope = await db.select({ id: organizations.id }).from(organizations).where(and(eq(organizations.id, input.organizationId), eq(organizations.ownerUserId, input.actorUserId))).limit(1);
    if (!scope[0]) throw new Error("AUDIT_SCOPE_FORBIDDEN");
  }
  return true as const;
}

export async function appendAuditEventForUser(input: Omit<typeof auditEvents.$inferInsert, "actorUserId"> & { actorUserId: number }) {
  await assertAuditScopeForUser({ actorUserId: input.actorUserId, organizationId: input.organizationId, companyId: input.companyId });
  return appendAuditEvent(input);
}

export async function getAuditEventsForUserCompany(userId: number, companyId: number, entityType?: string, entityId?: string) {
  const db = await getDb();
  if (!db) return [];
  const filters = [eq(auditEvents.companyId, companyId), eq(organizations.ownerUserId, userId)];
  if (entityType) filters.push(eq(auditEvents.entityType, entityType));
  if (entityId) filters.push(eq(auditEvents.entityId, entityId));
  return db.select({ event: auditEvents }).from(auditEvents).innerJoin(organizations, eq(auditEvents.organizationId, organizations.id)).where(and(...filters)).orderBy(auditEvents.id);
}

export async function reconcileStockForUserCompany(input: { userId: number; companyId: number; inventoryAccountId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const movements = await db.select({ movement: stockMovements }).from(stockMovements).innerJoin(companies, eq(stockMovements.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(stockMovements.companyId, input.companyId), eq(organizations.ownerUserId, input.userId)));
  const ledger = await db.select({ line: journalLines }).from(journalLines).innerJoin(journalEntries, eq(journalLines.entryId, journalEntries.id)).innerJoin(companies, eq(journalEntries.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(journalEntries.companyId, input.companyId), eq(journalLines.accountId, input.inventoryAccountId), eq(organizations.ownerUserId, input.userId)));
  const normalized = movements.map(({ movement }) => ({ type: movement.type, quantity: Number(movement.quantity), unitCost: Number(movement.unitCost) }));
  const ledgerValue = ledger.reduce((total, { line }) => total + Number(line.debit) - Number(line.credit), 0);
  return reconcileInventoryToLedger(normalized, ledgerValue);
}

export async function recordStockMovement(input: { userId: number; organizationId: number; companyId: number; periodId: number; productCode: string; type: "IN" | "OUT"; quantity: number; unitCost: number; sourceDocumentId?: number; journalEntryId?: number; correlationId: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertCompanyReady(db, input.userId, input.companyId);
  await assertAuditScopeForUser({ actorUserId: input.userId, organizationId: input.organizationId, companyId: input.companyId });
  const result = await db.insert(stockMovements).values({ organizationId: input.organizationId, companyId: input.companyId, periodId: input.periodId, productCode: input.productCode, type: input.type, quantity: String(input.quantity), unitCost: String(input.unitCost), sourceDocumentId: input.sourceDocumentId, journalEntryId: input.journalEntryId, correlationId: input.correlationId });
  const movementId = Number(result[0].insertId);
  await appendAuditEvent({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "STOCK_MOVEMENT_RECORDED", entityType: "stockMovement", entityId: String(movementId), beforeState: null, afterState: JSON.stringify({ type: input.type, productCode: input.productCode, quantity: input.quantity, unitCost: input.unitCost }), correlationId: input.correlationId });
  return { id: movementId, ...input };
}

export async function createFileAsset(input: { userId: number; organizationId: number; companyId: number; storageKey: string; filename: string; mimeType: string; size: number; sha256: string; allowedUserIds?: number[] }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertCompanyReady(db, input.userId, input.companyId);
  await assertAuditScopeForUser({ actorUserId: input.userId, organizationId: input.organizationId, companyId: input.companyId });
  const result = await db.insert(fileAssets).values({ organizationId: input.organizationId, companyId: input.companyId, ownerUserId: input.userId, storageKey: input.storageKey, filename: input.filename, mimeType: input.mimeType, size: input.size, sha256: input.sha256, allowedUserIds: JSON.stringify(input.allowedUserIds ?? []) });
  const fileId = Number(result[0].insertId);
  await appendAuditEvent({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "FILE_ASSET_REGISTERED", entityType: "fileAsset", entityId: String(fileId), beforeState: null, afterState: JSON.stringify({ filename: input.filename, mimeType: input.mimeType, sha256: input.sha256, size: input.size }), correlationId: input.storageKey });
  return { id: fileId, storageKey: input.storageKey };
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
  await assertCompanyReady(db, input.userId, input.companyId);
  const reserved = await db.transaction(async (tx) => {
    const rows = await tx.select({ series: documentSeries, organization: organizations }).from(documentSeries).innerJoin(companies, eq(documentSeries.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(documentSeries.companyId, input.companyId), eq(documentSeries.code, input.series), eq(documentSeries.documentType, input.documentType), eq(documentSeries.active, 1), eq(organizations.ownerUserId, input.userId))).limit(1);
    const current = rows[0];
    if (!current) throw new Error("DOCUMENT_SERIES_NOT_FOUND_OR_FORBIDDEN");
    const number = current.series.nextNumber;
    await tx.update(documentSeries).set({ nextNumber: sql`${documentSeries.nextNumber} + 1` }).where(eq(documentSeries.id, current.series.id));
    return { organizationId: current.organization.id, series: input.series, documentType: input.documentType, number, previousNextNumber: number, nextNumber: number + 1, formatted: formatDocumentNumber(input.series, number) };
  });
  await appendAuditEvent({ organizationId: reserved.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "DOCUMENT_NUMBER_RESERVED", entityType: "documentSeries", entityId: `${reserved.series}:${reserved.documentType}`, beforeState: JSON.stringify({ nextNumber: reserved.previousNextNumber }), afterState: JSON.stringify({ nextNumber: reserved.nextNumber, number: reserved.number, formatted: reserved.formatted }), correlationId: `${input.companyId}:${reserved.series}:${reserved.number}` });
  const { organizationId: _organizationId, ...result } = reserved;
  return result;
}

export async function getJournalDocumentChainForUserCompany(userId: number, companyId: number, entryId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select({ entry: journalEntries, document: businessDocuments, line: journalLines, account: chartAccounts }).from(journalEntries).innerJoin(companies, eq(journalEntries.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).leftJoin(businessDocuments, eq(journalEntries.sourceDocumentId, businessDocuments.id)).innerJoin(journalLines, eq(journalLines.entryId, journalEntries.id)).innerJoin(chartAccounts, eq(journalLines.accountId, chartAccounts.id)).where(and(eq(journalEntries.id, entryId), eq(journalEntries.companyId, companyId), eq(organizations.ownerUserId, userId), eq(journalEntries.status, "POSTED")));
  const first = rows[0];
  if (!first) return null;
  return { entry: first.entry, document: first.document, lines: rows.map((row) => ({ lineId: row.line.id, accountId: row.account.id, accountCode: row.account.code, accountName: row.account.name, debit: Number(row.line.debit), credit: Number(row.line.credit) })) };
}

export async function getDocumentAccountingChainForUserCompany(userId: number, companyId: number, documentId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select({ document: businessDocuments, entry: journalEntries, line: journalLines, account: chartAccounts }).from(businessDocuments).innerJoin(companies, eq(businessDocuments.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).leftJoin(journalEntries, and(eq(journalEntries.sourceDocumentId, businessDocuments.id), eq(journalEntries.status, "POSTED"))).leftJoin(journalLines, eq(journalLines.entryId, journalEntries.id)).leftJoin(chartAccounts, eq(journalLines.accountId, chartAccounts.id)).where(and(eq(businessDocuments.id, documentId), eq(businessDocuments.companyId, companyId), eq(organizations.ownerUserId, userId)));
  const first = rows[0];
  if (!first) return null;
  const entries = new Map<number, { entryId: number; description: string; lines: Array<{ lineId: number; accountId: number; accountCode: string; accountName: string; debit: number; credit: number }> }>();
  for (const row of rows) {
    if (!row.entry) continue;
    const entry = entries.get(row.entry.id) ?? { entryId: row.entry.id, description: row.entry.description, lines: [] };
    if (row.line && row.account) entry.lines.push({ lineId: row.line.id, accountId: row.account.id, accountCode: row.account.code, accountName: row.account.name, debit: Number(row.line.debit), credit: Number(row.line.credit) });
    entries.set(row.entry.id, entry);
  }
  return { document: first.document, entries: Array.from(entries.values()) };
}

export async function getJournalRowsForUserCompany(userId: number, companyId: number): Promise<JournalRow[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ entryId: journalEntries.id, description: journalEntries.description, createdAt: journalEntries.createdAt, sourceDocumentId: journalEntries.sourceDocumentId, accountCode: chartAccounts.code, accountName: chartAccounts.name, debit: journalLines.debit, credit: journalLines.credit }).from(journalLines).innerJoin(journalEntries, eq(journalLines.entryId, journalEntries.id)).innerJoin(chartAccounts, eq(journalLines.accountId, chartAccounts.id)).innerJoin(companies, eq(journalEntries.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(organizations.ownerUserId, userId), eq(companies.id, companyId), eq(journalEntries.status, "POSTED")));
  return rows.map((row) => ({ ...row, debit: Number(row.debit), credit: Number(row.credit) }));
}

export async function getTrialBalanceForUserCompany(userId: number, companyId: number) {
  const rows = await getJournalRowsForUserCompany(userId, companyId);
  return buildTrialBalance(rows.map(({ accountCode, accountName, debit, credit }) => ({ accountCode, accountName, debit, credit })));
}

export async function getJournalForUserCompany(userId: number, companyId: number) {
  return buildJournal(await getJournalRowsForUserCompany(userId, companyId));
}

export async function getLedgerForUserCompany(userId: number, companyId: number, accountCode?: string) {
  return buildLedger(await getJournalRowsForUserCompany(userId, companyId), accountCode);
}

export async function getIncomeStatementForUserCompany(userId: number, companyId: number) {
  const rows = await getJournalRowsForUserCompany(userId, companyId);
  return buildIncomeStatement(rows.map(({ accountCode, accountName, debit, credit }) => ({ accountCode, accountName, debit, credit })));
}

export async function getBalanceSheetForUserCompany(userId: number, companyId: number) {
  const rows = await getJournalRowsForUserCompany(userId, companyId);
  return buildBalanceSheet(rows.map(({ accountCode, accountName, debit, credit }) => ({ accountCode, accountName, debit, credit })));
}

export async function getReportTraceForUserCompany(userId: number, companyId: number, report: "TRIAL_BALANCE" | "INCOME_STATEMENT" | "BALANCE_SHEET", accountCode?: string) {
  const rows = await getJournalRowsForUserCompany(userId, companyId);
  const scopedRows = accountCode ? rows.filter((row) => row.accountCode === accountCode) : rows;
  const reportRows = report === "TRIAL_BALANCE" ? buildTrialBalance(scopedRows) : report === "INCOME_STATEMENT" ? buildIncomeStatement(scopedRows) : buildBalanceSheet(scopedRows);
  const documentIds = Array.from(new Set(scopedRows.map((row) => row.sourceDocumentId).filter((id): id is number => id !== null)));
  const documents = new Map<number, unknown>();
  for (const documentId of documentIds) documents.set(documentId, await getDocumentAccountingChainForUserCompany(userId, companyId, documentId));
  const origins = scopedRows.map((row) => ({ entryId: row.entryId, account: { code: row.accountCode, name: row.accountName }, document: row.sourceDocumentId ? documents.get(row.sourceDocumentId) : null, sourceDocumentId: row.sourceDocumentId, description: row.description, debit: row.debit, credit: row.credit, createdAt: row.createdAt }));
  return { report, companyId, accountCode: accountCode ?? null, summary: reportRows, origins };
}

export async function getAgingForUserCompany(userId: number, companyId: number, counterpartyType: "CUSTOMER" | "SUPPLIER", asOf: Date) {
  const documents = await getDocumentsForUserCompany(userId, companyId);
  const items = documents
    .map(({ document }) => document)
    .filter((document) => document.counterpartyType === counterpartyType && (document.status === "ISSUED" || document.status === "ACCOUNTED") && document.dueDate !== null)
    .map((document) => ({ id: document.id, partyName: document.customerName ?? "Contraparte não identificada", documentNumber: document.documentNumber, issuedAt: document.issuedAt ?? document.createdAt, dueDate: document.dueDate!, amount: Number(document.totalAmount), settledAmount: Number(document.settledAmount) }));
  return buildAgingReport(items, asOf);
}

export async function getVatSummaryForUserCompany(userId: number, companyId: number) {
  const documents = await getDocumentsForUserCompany(userId, companyId);
  return buildVatSummary(documents.map(({ document }) => ({ status: document.status, ivaRegime: document.ivaRegime, netAmount: Number(document.netAmount), taxAmount: Number(document.taxAmount), totalAmount: Number(document.totalAmount) })));
}

export async function transitionBusinessDocument(input: { userId: number; companyId: number; documentId: number; to: "DRAFT" | "VALIDATED" | "ISSUED" | "ACCOUNTED" | "CANCELLED"; correlationId?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertCompanyReady(db, input.userId, input.companyId);
  const document = await db.select({ document: businessDocuments, organization: organizations }).from(businessDocuments).innerJoin(companies, eq(businessDocuments.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(businessDocuments.id, input.documentId), eq(businessDocuments.companyId, input.companyId), eq(organizations.ownerUserId, input.userId))).limit(1);
  const current = document[0];
  if (!current) throw new Error("DOCUMENT_NOT_FOUND_OR_FORBIDDEN");
  if (!validateDocumentTransition(current.document.status, input.to)) throw new Error("INVALID_DOCUMENT_TRANSITION");
  if (input.to === "ACCOUNTED") {
    const linkedEntry = await db.select({ id: journalEntries.id }).from(journalEntries).where(and(eq(journalEntries.sourceDocumentId, input.documentId), eq(journalEntries.companyId, input.companyId), eq(journalEntries.status, "POSTED"))).limit(1);
    if (!linkedEntry[0]) throw new Error("DOCUMENT_REQUIRES_POSTED_ENTRY");
  }
  const issuedAt = input.to === "ISSUED" ? new Date() : current.document.issuedAt;
  await db.update(businessDocuments).set({ status: input.to, issuedAt }).where(eq(businessDocuments.id, input.documentId));
  await appendAuditEvent({ organizationId: current.organization.id, companyId: input.companyId, actorUserId: input.userId, action: `DOCUMENT_${input.to}`, entityType: "businessDocument", entityId: String(input.documentId), beforeState: JSON.stringify({ status: current.document.status }), afterState: JSON.stringify({ status: input.to }), correlationId: input.correlationId ?? `document:${input.documentId}:${input.to}` });
  return { id: input.documentId, from: current.document.status, to: input.to };
}

export async function postJournalEntry(input: { companyId: number; periodId: number; sourceDocumentId?: number; reversalOfEntryId?: number; idempotencyKey: string; description: string; createdBy: number; lines: (JournalLineInput & { currency?: string; exchangeRate?: number })[] }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const companyContext = await db.select({ company: companies, organization: organizations }).from(companies).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(companies.id, input.companyId), eq(organizations.ownerUserId, input.createdBy))).limit(1);
  if (!companyContext[0]) throw new Error("COMPANY_NOT_FOUND_OR_FORBIDDEN");
  if (companyContext[0].company.configurationStatus !== "READY") throw new Error("COMPANY_CONFIGURATION_PENDING");
  const validation = validateBalancedEntry(input.lines);
  if (!validation.ok) throw new Error(validation.reason);
  const result = await db.transaction(async (tx) => {
    const existing = await tx.select().from(journalEntries).where(eq(journalEntries.idempotencyKey, input.idempotencyKey)).limit(1);
    if (existing[0]) return { entry: existing[0], idempotent: true };
    const period = await tx.select().from(fiscalPeriods).where(and(eq(fiscalPeriods.id, input.periodId), eq(fiscalPeriods.companyId, input.companyId))).limit(1);
    if (!period[0] || period[0].status === "CLOSED") throw new Error("PERIOD_NOT_OPEN");
    const inserted = await tx.insert(journalEntries).values({ companyId: input.companyId, periodId: input.periodId, sourceDocumentId: input.sourceDocumentId, reversalOfEntryId: input.reversalOfEntryId, idempotencyKey: input.idempotencyKey, description: input.description, createdBy: input.createdBy, status: "POSTED" });
    const entryId = Number(inserted[0].insertId);
    await tx.insert(journalLines).values(input.lines.map((line) => ({ entryId, accountId: line.accountId, debit: line.debit.toFixed(2), credit: line.credit.toFixed(2), currency: line.currency ?? "AOA", exchangeRate: (line.exchangeRate ?? 1).toFixed(8) })));
    return { entryId, idempotent: false };
  });
  if (!result.idempotent) {
    await appendAuditEvent({ organizationId: companyContext[0].organization.id, companyId: input.companyId, actorUserId: input.createdBy, action: input.reversalOfEntryId ? "JOURNAL_ENTRY_REVERSED" : "JOURNAL_ENTRY_POSTED", entityType: "journalEntry", entityId: String(result.entryId), beforeState: input.reversalOfEntryId ? JSON.stringify({ reversalOfEntryId: input.reversalOfEntryId }) : null, afterState: JSON.stringify({ description: input.description, sourceDocumentId: input.sourceDocumentId, reversalOfEntryId: input.reversalOfEntryId, lineCount: input.lines.length }), correlationId: input.idempotencyKey });
  }
  return result;
}
