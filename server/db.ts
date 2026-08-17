import { createHash } from "node:crypto";
import { validateAuditSnapshotShape } from "./audit-chain";
import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, auditEvents, businessDocuments, cashAccounts, cashReconciliations, chartAccounts, companies, counterparties, documentItems, documentSeries, documentTaxes, fileAssets, fiscalExercises, fiscalPeriods, journalEntries, journalLines, normativeRules, organizations, payments, platforms, products, stockMovements, treasuryTransactions, users } from "../drizzle/schema";
import { buildAgingReport, buildBalanceSheet, buildCompleteReportReconciliation, buildDocumentOriginReconciliation, buildFiscalRegister, buildIncomeStatement, buildJournal, buildLedger, buildReportReconciliation, buildSaftReadiness, buildTrialBalance, buildVatSummary, type JournalRow } from "./reports";
import { reconcileInventoryToLedger } from "./inventory-posting";
import { assertDocumentMutable, formatDocumentNumber } from "./documents";
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

export async function getCounterpartiesForUserCompany(userId: number, companyId: number, kind?: "CUSTOMER" | "SUPPLIER") {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(counterparties.companyId, companyId), eq(organizations.ownerUserId, userId)];
  if (kind) conditions.push(eq(counterparties.kind, kind));
  return db.select({ counterparty: counterparties }).from(counterparties).innerJoin(companies, eq(counterparties.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(...conditions)).orderBy(counterparties.name);
}

export async function createCounterpartyForUser(input: { userId: number; organizationId: number; companyId: number; kind: "CUSTOMER" | "SUPPLIER"; taxId?: string; name: string; email?: string; phone?: string; address?: string; municipality?: string; province?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertAuditScopeForUser({ actorUserId: input.userId, organizationId: input.organizationId, companyId: input.companyId });
  const result = await db.insert(counterparties).values({ organizationId: input.organizationId, companyId: input.companyId, kind: input.kind, taxId: input.taxId, name: input.name, email: input.email, phone: input.phone, address: input.address, municipality: input.municipality, province: input.province });
  const id = Number(result[0].insertId);
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "COUNTERPARTY_CREATED", entityType: "counterparty", entityId: String(id), beforeState: null, afterState: JSON.stringify({ kind: input.kind, name: input.name, taxId: input.taxId ?? null }), correlationId: `counterparty:${id}` });
  return { id, ...input };
}

export async function getProductsForUserCompany(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ product: products }).from(products).innerJoin(companies, eq(products.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(products.companyId, companyId), eq(organizations.ownerUserId, userId))).orderBy(products.code);
}

export async function createProductForUser(input: { userId: number; companyId: number; code: string; name: string; kind: "GOOD" | "SERVICE"; unitCode?: string; taxCode?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const company = await db.select({ organizationId: companies.organizationId }).from(companies).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(companies.id, input.companyId), eq(organizations.ownerUserId, input.userId))).limit(1);
  if (!company[0]) throw new Error("COMPANY_NOT_FOUND_OR_FORBIDDEN");
  const result = await db.insert(products).values({ companyId: input.companyId, code: input.code, name: input.name, kind: input.kind, unitCode: input.unitCode ?? "UN", taxCode: input.taxCode });
  const id = Number(result[0].insertId);
  await appendAuditEventForUser({ organizationId: company[0].organizationId, companyId: input.companyId, actorUserId: input.userId, action: "PRODUCT_CREATED", entityType: "product", entityId: String(id), beforeState: null, afterState: JSON.stringify({ code: input.code, name: input.name, kind: input.kind }), correlationId: `product:${id}` });
  return { id, ...input };
}

export async function getCashAccountsForUserCompany(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ account: cashAccounts }).from(cashAccounts).innerJoin(companies, eq(cashAccounts.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(cashAccounts.companyId, companyId), eq(organizations.ownerUserId, userId))).orderBy(cashAccounts.name);
}

export async function createCashAccountForUser(input: { userId: number; organizationId: number; companyId: number; name: string; kind: "CASH" | "BANK"; accountNumber?: string; currency?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertAuditScopeForUser({ actorUserId: input.userId, organizationId: input.organizationId, companyId: input.companyId });
  const result = await db.insert(cashAccounts).values({ companyId: input.companyId, name: input.name, kind: input.kind, accountNumber: input.accountNumber, currency: input.currency ?? "AOA" });
  const id = Number(result[0].insertId);
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "CASH_ACCOUNT_CREATED", entityType: "cashAccount", entityId: String(id), beforeState: null, afterState: JSON.stringify({ name: input.name, kind: input.kind, currency: input.currency ?? "AOA" }), correlationId: `cash-account:${id}` });
  return { id, ...input };
}

export async function getTreasuryTransactionsForUserCompany(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ transaction: treasuryTransactions, account: cashAccounts }).from(treasuryTransactions).innerJoin(cashAccounts, eq(treasuryTransactions.cashAccountId, cashAccounts.id)).innerJoin(companies, eq(treasuryTransactions.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(treasuryTransactions.companyId, companyId), eq(organizations.ownerUserId, userId))).orderBy(treasuryTransactions.valueDate);
}

export async function createPaymentForUser(input: { userId: number; organizationId: number; companyId: number; documentId?: number; cashAccountId?: number; direction: "RECEIPT" | "PAYMENT"; amount: number; currency?: string; paidAt: Date; method: "CASH" | "BANK_TRANSFER" | "CARD" | "OTHER"; idempotencyKey: string; correlationId: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertAuditScopeForUser({ actorUserId: input.userId, organizationId: input.organizationId, companyId: input.companyId });
  if (input.documentId) {
    const document = await db.select({ id: businessDocuments.id }).from(businessDocuments).where(and(eq(businessDocuments.id, input.documentId), eq(businessDocuments.companyId, input.companyId))).limit(1);
    if (!document[0]) throw new Error("DOCUMENT_NOT_FOUND_OR_FORBIDDEN");
  }
  if (input.cashAccountId) {
    const account = await db.select({ id: cashAccounts.id }).from(cashAccounts).innerJoin(companies, eq(cashAccounts.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(cashAccounts.id, input.cashAccountId), eq(cashAccounts.companyId, input.companyId), eq(organizations.ownerUserId, input.userId))).limit(1);
    if (!account[0]) throw new Error("CASH_ACCOUNT_NOT_FOUND_OR_FORBIDDEN");
  }
  const existing = await db.select().from(payments).where(eq(payments.idempotencyKey, input.idempotencyKey)).limit(1);
  if (existing[0]) return { payment: existing[0], idempotent: true };
  const result = await db.insert(payments).values({ organizationId: input.organizationId, companyId: input.companyId, documentId: input.documentId, direction: input.direction, amount: String(input.amount), currency: input.currency ?? "AOA", paidAt: input.paidAt, method: input.method, idempotencyKey: input.idempotencyKey, correlationId: input.correlationId, createdBy: input.userId });
  const id = Number(result[0].insertId);
  let treasuryTransactionId: number | undefined;
  if (input.cashAccountId) {
    const treasury = await db.insert(treasuryTransactions).values({ companyId: input.companyId, cashAccountId: input.cashAccountId, paymentId: id, direction: input.direction === "RECEIPT" ? "IN" : "OUT", amount: String(input.amount), valueDate: input.paidAt, correlationId: input.correlationId });
    treasuryTransactionId = Number(treasury[0].insertId);
    await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "TREASURY_TRANSACTION_CREATED", entityType: "treasuryTransaction", entityId: String(treasuryTransactionId), beforeState: null, afterState: JSON.stringify({ paymentId: id, cashAccountId: input.cashAccountId, direction: input.direction === "RECEIPT" ? "IN" : "OUT", amount: input.amount }), correlationId: input.correlationId });
  }
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "PAYMENT_CREATED", entityType: "payment", entityId: String(id), beforeState: null, afterState: JSON.stringify({ direction: input.direction, amount: input.amount, documentId: input.documentId ?? null, cashAccountId: input.cashAccountId ?? null, status: "PENDING" }), correlationId: input.correlationId });
  return { payment: { id, ...input, status: "PENDING" as const }, treasuryTransactionId, idempotent: false };
}

export async function getNormativeRulesForUserCompany(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ rule: normativeRules }).from(normativeRules).innerJoin(organizations, eq(normativeRules.organizationId, organizations.id)).where(and(eq(organizations.ownerUserId, userId), sql`(${normativeRules.companyId} IS NULL OR ${normativeRules.companyId} = ${companyId})`)).orderBy(desc(normativeRules.effectiveFrom));
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
  await appendAuditEventForUser({ organizationId: organization[0].id, companyId: Number(result[0].insertId), actorUserId: input.userId, action: "COMPANY_CREATED_PENDING", entityType: "company", entityId: String(result[0].insertId), beforeState: null, afterState: JSON.stringify({ name: input.name, nif: input.nif, configurationStatus: "PENDING" }), correlationId: `company:${result[0].insertId}` });
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
  await appendAuditEventForUser({ organizationId: current.organization.id, companyId: input.companyId, actorUserId: input.userId, action: "COMPANY_ACTIVATED", entityType: "company", entityId: String(input.companyId), beforeState: JSON.stringify({ configurationStatus: transition.before }), afterState: JSON.stringify({ configurationStatus: transition.after }), correlationId: `company:${input.companyId}:activation` });
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
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "STOCK_MOVEMENT_RECORDED", entityType: "stockMovement", entityId: String(movementId), beforeState: null, afterState: JSON.stringify({ type: input.type, productCode: input.productCode, quantity: input.quantity, unitCost: input.unitCost }), correlationId: input.correlationId });
  return { id: movementId, ...input };
}

export async function createFileAsset(input: { userId: number; organizationId: number; companyId: number; storageKey: string; filename: string; mimeType: string; size: number; sha256: string; allowedUserIds?: number[] }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertCompanyReady(db, input.userId, input.companyId);
  await assertAuditScopeForUser({ actorUserId: input.userId, organizationId: input.organizationId, companyId: input.companyId });
  const result = await db.insert(fileAssets).values({ organizationId: input.organizationId, companyId: input.companyId, ownerUserId: input.userId, storageKey: input.storageKey, filename: input.filename, mimeType: input.mimeType, size: input.size, sha256: input.sha256, allowedUserIds: JSON.stringify(input.allowedUserIds ?? []) });
  const fileId = Number(result[0].insertId);
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "FILE_ASSET_REGISTERED", entityType: "fileAsset", entityId: String(fileId), beforeState: null, afterState: JSON.stringify({ filename: input.filename, mimeType: input.mimeType, sha256: input.sha256, size: input.size }), correlationId: input.storageKey });
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
  await appendAuditEventForUser({ organizationId: reserved.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "DOCUMENT_NUMBER_RESERVED", entityType: "documentSeries", entityId: `${reserved.series}:${reserved.documentType}`, beforeState: JSON.stringify({ nextNumber: reserved.previousNextNumber }), afterState: JSON.stringify({ nextNumber: reserved.nextNumber, number: reserved.number, formatted: reserved.formatted }), correlationId: `${input.companyId}:${reserved.series}:${reserved.number}` });
  const { organizationId: _organizationId, ...result } = reserved;
  return result;
}

export async function createDraftBusinessDocumentForUser(input: { userId: number; companyId: number; series: string; documentType: string; counterpartyId: number; counterpartyType: "CUSTOMER" | "SUPPLIER"; ivaRegime: "GERAL" | "SIMPLIFICADO" | "EXCLUSAO"; currency?: string; dueDate?: Date; correctsDocumentId?: number; items: Array<{ productId?: number; description: string; quantity: number; unitPrice: number; netAmount: number; taxAmount: number; totalAmount: number; taxType?: string; taxRate?: number }>; normativeRuleId?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertCompanyReady(db, input.userId, input.companyId);
  const companyContext = await db.select({ organizationId: companies.organizationId, functionalCurrency: companies.functionalCurrency }).from(companies).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(companies.id, input.companyId), eq(organizations.ownerUserId, input.userId))).limit(1);
  if (!companyContext[0]) throw new Error("COMPANY_NOT_FOUND_OR_FORBIDDEN");
  const counterparty = await db.select({ id: counterparties.id, name: counterparties.name, kind: counterparties.kind }).from(counterparties).where(and(eq(counterparties.id, input.counterpartyId), eq(counterparties.companyId, input.companyId), eq(counterparties.kind, input.counterpartyType))).limit(1);
  if (!counterparty[0]) throw new Error("COUNTERPARTY_NOT_FOUND_OR_FORBIDDEN");
  if (["NC", "ND"].includes(input.documentType) && !input.correctsDocumentId) throw new Error("CORRECTION_ORIGIN_REQUIRED");
  if (input.correctsDocumentId) {
    const original = await db.select({ id: businessDocuments.id, status: businessDocuments.status }).from(businessDocuments).where(and(eq(businessDocuments.id, input.correctsDocumentId), eq(businessDocuments.companyId, input.companyId))).limit(1);
    if (!original[0]) throw new Error("CORRECTION_ORIGIN_NOT_FOUND_OR_FORBIDDEN");
    if (!["ISSUED", "ACCOUNTED", "CANCELLED"].includes(original[0].status)) throw new Error("CORRECTION_ORIGIN_NOT_EMITTED");
  }
  if (!input.items.length) throw new Error("DOCUMENT_ITEMS_REQUIRED");
  const totals = input.items.reduce((sum, item) => ({ net: sum.net + item.netAmount, tax: sum.tax + item.taxAmount, total: sum.total + item.totalAmount }), { net: 0, tax: 0, total: 0 });
  if (Math.abs(totals.net + totals.tax - totals.total) > 0.01) throw new Error("DOCUMENT_TOTALS_UNBALANCED");
  const reserved = await reserveDocumentNumber({ userId: input.userId, companyId: input.companyId, series: input.series, documentType: input.documentType });
  const inserted = await db.transaction(async (tx) => {
    const documentResult = await tx.insert(businessDocuments).values({ companyId: input.companyId, documentNumber: reserved.formatted, series: input.series, status: "DRAFT", documentType: input.documentType, customerName: counterparty[0].name, counterpartyId: input.counterpartyId, counterpartyType: input.counterpartyType, correctsDocumentId: input.correctsDocumentId, currency: input.currency ?? companyContext[0].functionalCurrency, ivaRegime: input.ivaRegime, netAmount: totals.net.toFixed(2), taxAmount: totals.tax.toFixed(2), totalAmount: totals.total.toFixed(2), dueDate: input.dueDate, createdBy: input.userId });
    const documentId = Number(documentResult[0].insertId);
    for (let index = 0; index < input.items.length; index += 1) {
      const item = input.items[index];
      const itemResult = await tx.insert(documentItems).values({ companyId: input.companyId, documentId, lineNumber: index + 1, productId: item.productId, description: item.description, quantity: item.quantity.toFixed(4), unitPrice: item.unitPrice.toFixed(4), netAmount: item.netAmount.toFixed(2), taxAmount: item.taxAmount.toFixed(2), totalAmount: item.totalAmount.toFixed(2) });
      const itemId = Number(itemResult[0].insertId);
      if (item.taxAmount > 0 || item.taxType) await tx.insert(documentTaxes).values({ companyId: input.companyId, documentId, itemId, taxType: item.taxType ?? "IVA", regime: input.ivaRegime, rate: (item.taxRate ?? 0).toFixed(4), baseAmount: item.netAmount.toFixed(2), taxAmount: item.taxAmount.toFixed(2), normativeRuleId: input.normativeRuleId });
    }
    return { documentId };
  });
  await appendAuditEventForUser({ organizationId: companyContext[0].organizationId, companyId: input.companyId, actorUserId: input.userId, action: "BUSINESS_DOCUMENT_CREATED", entityType: "businessDocument", entityId: String(inserted.documentId), beforeState: null, afterState: JSON.stringify({ documentNumber: reserved.formatted, status: "DRAFT", counterpartyId: input.counterpartyId, correctsDocumentId: input.correctsDocumentId ?? null, itemCount: input.items.length, netAmount: totals.net, taxAmount: totals.tax, totalAmount: totals.total }), correlationId: `${input.companyId}:${reserved.series}:${reserved.number}` });
  return { id: inserted.documentId, documentNumber: reserved.formatted, status: "DRAFT" as const, counterpartyId: input.counterpartyId, totals };
}

async function assertCommercialDocumentMutable(input: { userId: number; companyId: number; documentId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const row = await db.select({ document: businessDocuments, organizationId: companies.organizationId }).from(businessDocuments).innerJoin(companies, eq(businessDocuments.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(businessDocuments.id, input.documentId), eq(businessDocuments.companyId, input.companyId), eq(organizations.ownerUserId, input.userId))).limit(1);
  if (!row[0]) throw new Error("DOCUMENT_NOT_FOUND_OR_FORBIDDEN");
  assertDocumentMutable(row[0].document.status);
  return row[0];
}

export async function updateProductForUser(input: { userId: number; companyId: number; productId: number; name?: string; taxCode?: string; unitCode?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const row = await db.select({ product: products, organizationId: companies.organizationId }).from(products).innerJoin(companies, eq(products.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(products.id, input.productId), eq(products.companyId, input.companyId), eq(organizations.ownerUserId, input.userId))).limit(1);
  if (!row[0]) throw new Error("PRODUCT_NOT_FOUND_OR_FORBIDDEN");
  const linked = await db.select({ id: documentItems.id }).from(documentItems).innerJoin(businessDocuments, eq(documentItems.documentId, businessDocuments.id)).where(and(eq(documentItems.companyId, input.companyId), eq(documentItems.productId, input.productId), sql`${businessDocuments.status} IN ('ISSUED','ACCOUNTED','CANCELLED')`)).limit(1);
  if (linked[0]) throw new Error("PRODUCT_IMMUTABLE_AFTER_DOCUMENT_ISSUANCE");
  await db.update(products).set({ name: input.name, taxCode: input.taxCode, unitCode: input.unitCode }).where(eq(products.id, input.productId));
  await appendAuditEventForUser({ organizationId: row[0].organizationId, companyId: input.companyId, actorUserId: input.userId, action: "PRODUCT_UPDATED", entityType: "product", entityId: String(input.productId), beforeState: JSON.stringify(row[0].product), afterState: JSON.stringify({ ...row[0].product, ...input }), correlationId: `product:${input.productId}` });
  return { id: input.productId };
}

export async function getPaymentsForUserCompany(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ payment: payments }).from(payments).innerJoin(companies, eq(payments.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(payments.companyId, companyId), eq(organizations.ownerUserId, userId))).orderBy(desc(payments.createdAt));
}

export async function reconcileCashAccountForUser(input: { userId: number; companyId: number; cashAccountId: number; statementDate: Date; openingBalance: number; closingBalance: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const account = await db.select({ account: cashAccounts, organizationId: companies.organizationId }).from(cashAccounts).innerJoin(companies, eq(cashAccounts.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(cashAccounts.id, input.cashAccountId), eq(cashAccounts.companyId, input.companyId), eq(organizations.ownerUserId, input.userId))).limit(1);
  if (!account[0]) throw new Error("CASH_ACCOUNT_NOT_FOUND_OR_FORBIDDEN");
  const movements = await db.select({ direction: treasuryTransactions.direction, amount: treasuryTransactions.amount }).from(treasuryTransactions).where(and(eq(treasuryTransactions.companyId, input.companyId), eq(treasuryTransactions.cashAccountId, input.cashAccountId)));
  const netMovement = movements.reduce((sum, movement) => sum + (movement.direction === "IN" ? Number(movement.amount) : -Number(movement.amount)), 0);
  const systemBalance = input.openingBalance + netMovement;
  const difference = Number((input.closingBalance - systemBalance).toFixed(2));
  const status = Math.abs(difference) <= 0.01 ? "RECONCILED" as const : "OPEN" as const;
  const inserted = await db.insert(cashReconciliations).values({ companyId: input.companyId, cashAccountId: input.cashAccountId, statementDate: input.statementDate, openingBalance: input.openingBalance.toFixed(2), closingBalance: input.closingBalance.toFixed(2), systemBalance: systemBalance.toFixed(2), difference: difference.toFixed(2), status, createdBy: input.userId });
  const id = Number(inserted[0].insertId);
  await appendAuditEventForUser({ organizationId: account[0].organizationId, companyId: input.companyId, actorUserId: input.userId, action: "CASH_ACCOUNT_RECONCILED", entityType: "cashReconciliation", entityId: String(id), beforeState: null, afterState: JSON.stringify({ cashAccountId: input.cashAccountId, closingBalance: input.closingBalance, systemBalance, difference, status }), correlationId: `cash-reconciliation:${input.cashAccountId}:${input.statementDate.toISOString()}` });
  return { id, cashAccountId: input.cashAccountId, systemBalance, difference, status };
}

export async function updateCounterpartyForUser(input: { userId: number; companyId: number; counterpartyId: number; name?: string; email?: string; phone?: string; address?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const row = await db.select({ counterparty: counterparties, organizationId: companies.organizationId }).from(counterparties).innerJoin(companies, eq(counterparties.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(counterparties.id, input.counterpartyId), eq(counterparties.companyId, input.companyId), eq(organizations.ownerUserId, input.userId))).limit(1);
  if (!row[0]) throw new Error("COUNTERPARTY_NOT_FOUND_OR_FORBIDDEN");
  const linked = await db.select({ id: businessDocuments.id, status: businessDocuments.status }).from(businessDocuments).where(and(eq(businessDocuments.companyId, input.companyId), eq(businessDocuments.counterpartyId, input.counterpartyId))).limit(20);
  if (linked.some((document) => ["ISSUED", "ACCOUNTED", "CANCELLED"].includes(document.status))) throw new Error("COUNTERPARTY_IMMUTABLE_AFTER_DOCUMENT_ISSUANCE");
  await db.update(counterparties).set({ name: input.name, email: input.email, phone: input.phone, address: input.address }).where(eq(counterparties.id, input.counterpartyId));
  await appendAuditEventForUser({ organizationId: row[0].organizationId, companyId: input.companyId, actorUserId: input.userId, action: "COUNTERPARTY_UPDATED", entityType: "counterparty", entityId: String(input.counterpartyId), beforeState: JSON.stringify(row[0].counterparty), afterState: JSON.stringify({ ...row[0].counterparty, ...input }), correlationId: `counterparty:${input.counterpartyId}` });
  return { id: input.counterpartyId };
}

export async function updateDocumentItemForUser(input: { userId: number; companyId: number; itemId: number; description?: string; quantity?: number; unitPrice?: number; netAmount?: number; taxAmount?: number; totalAmount?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const item = await db.select({ item: documentItems }).from(documentItems).where(and(eq(documentItems.id, input.itemId), eq(documentItems.companyId, input.companyId))).limit(1);
  if (!item[0]) throw new Error("DOCUMENT_ITEM_NOT_FOUND_OR_FORBIDDEN");
  const document = await assertCommercialDocumentMutable({ userId: input.userId, companyId: input.companyId, documentId: item[0].item.documentId });
  await db.update(documentItems).set({ description: input.description, quantity: input.quantity === undefined ? undefined : input.quantity.toFixed(4), unitPrice: input.unitPrice === undefined ? undefined : input.unitPrice.toFixed(4), netAmount: input.netAmount === undefined ? undefined : input.netAmount.toFixed(2), taxAmount: input.taxAmount === undefined ? undefined : input.taxAmount.toFixed(2), totalAmount: input.totalAmount === undefined ? undefined : input.totalAmount.toFixed(2) }).where(eq(documentItems.id, input.itemId));
  await appendAuditEventForUser({ organizationId: document.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "DOCUMENT_ITEM_UPDATED", entityType: "documentItem", entityId: String(input.itemId), beforeState: JSON.stringify(item[0].item), afterState: JSON.stringify({ ...item[0].item, ...input }), correlationId: `document-item:${input.itemId}` });
  return { id: input.itemId, documentId: item[0].item.documentId };
}

export async function updateDocumentTaxForUser(input: { userId: number; companyId: number; taxId: number; rate?: number; baseAmount?: number; taxAmount?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const tax = await db.select({ tax: documentTaxes }).from(documentTaxes).where(and(eq(documentTaxes.id, input.taxId), eq(documentTaxes.companyId, input.companyId))).limit(1);
  if (!tax[0]) throw new Error("DOCUMENT_TAX_NOT_FOUND_OR_FORBIDDEN");
  const document = await assertCommercialDocumentMutable({ userId: input.userId, companyId: input.companyId, documentId: tax[0].tax.documentId });
  await db.update(documentTaxes).set({ rate: input.rate === undefined ? undefined : input.rate.toFixed(4), baseAmount: input.baseAmount === undefined ? undefined : input.baseAmount.toFixed(2), taxAmount: input.taxAmount === undefined ? undefined : input.taxAmount.toFixed(2) }).where(eq(documentTaxes.id, input.taxId));
  await appendAuditEventForUser({ organizationId: document.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "DOCUMENT_TAX_UPDATED", entityType: "documentTax", entityId: String(input.taxId), beforeState: JSON.stringify(tax[0].tax), afterState: JSON.stringify({ ...tax[0].tax, ...input }), correlationId: `document-tax:${input.taxId}` });
  return { id: input.taxId, documentId: tax[0].tax.documentId };
}

export async function archiveBusinessDocumentForUser(input: { userId: number; companyId: number; documentId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const row = await db.select({ document: businessDocuments, organizationId: companies.organizationId }).from(businessDocuments).innerJoin(companies, eq(businessDocuments.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(businessDocuments.id, input.documentId), eq(businessDocuments.companyId, input.companyId), eq(organizations.ownerUserId, input.userId))).limit(1);
  if (!row[0]) throw new Error("DOCUMENT_NOT_FOUND_OR_FORBIDDEN");
  if (row[0].document.status !== "CANCELLED") throw new Error("DOCUMENT_ARCHIVE_REQUIRES_CANCELLED");
  if (row[0].document.archivedAt) return { id: input.documentId, archivedAt: row[0].document.archivedAt, idempotent: true };
  const archivedAt = new Date();
  await db.update(businessDocuments).set({ archivedAt }).where(eq(businessDocuments.id, input.documentId));
  await appendAuditEventForUser({ organizationId: row[0].organizationId, companyId: input.companyId, actorUserId: input.userId, action: "DOCUMENT_ARCHIVED", entityType: "businessDocument", entityId: String(input.documentId), beforeState: JSON.stringify({ status: row[0].document.status, archivedAt: null }), afterState: JSON.stringify({ status: row[0].document.status, archivedAt }), correlationId: `document:${input.documentId}:archive` });
  return { id: input.documentId, archivedAt, idempotent: false };
}

export async function updatePaymentForUser(input: { userId: number; companyId: number; paymentId: number; amount?: number; method?: "CASH" | "BANK_TRANSFER" | "CARD" | "OTHER"; status?: "PENDING" | "CONFIRMED" | "CANCELLED" }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const payment = await db.select({ payment: payments, organizationId: companies.organizationId }).from(payments).innerJoin(companies, eq(payments.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(payments.id, input.paymentId), eq(payments.companyId, input.companyId), eq(organizations.ownerUserId, input.userId))).limit(1);
  if (!payment[0]) throw new Error("PAYMENT_NOT_FOUND_OR_FORBIDDEN");
  if (payment[0].payment.documentId) await assertCommercialDocumentMutable({ userId: input.userId, companyId: input.companyId, documentId: payment[0].payment.documentId });
  await db.update(payments).set({ amount: input.amount === undefined ? undefined : input.amount.toFixed(2), method: input.method, status: input.status }).where(eq(payments.id, input.paymentId));
  await appendAuditEventForUser({ organizationId: payment[0].organizationId, companyId: input.companyId, actorUserId: input.userId, action: "PAYMENT_UPDATED", entityType: "payment", entityId: String(input.paymentId), beforeState: JSON.stringify(payment[0].payment), afterState: JSON.stringify({ ...payment[0].payment, ...input }), correlationId: `payment-update:${input.paymentId}` });
  return { id: input.paymentId };
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

export async function getDocumentOriginReconciliationForUserCompany(userId: number, companyId: number) {
  const [documents, journal] = await Promise.all([getDocumentsForUserCompany(userId, companyId), getJournalForUserCompany(userId, companyId)]);
  return { companyId, ...buildDocumentOriginReconciliation(documents.map(({ document }) => ({ id: document.id, status: document.status })), journal.entries.map((entry) => ({ entryId: entry.entryId, sourceDocumentId: entry.sourceDocumentId }))) };
}

export async function getReportsReconciliationForUserCompany(userId: number, companyId: number) {
  const [trialBalance, journal, balanceSheet, vatSummary, fiscalRegister, documentOrigin] = await Promise.all([
    getTrialBalanceForUserCompany(userId, companyId),
    getJournalForUserCompany(userId, companyId),
    getBalanceSheetForUserCompany(userId, companyId),
    getVatSummaryForUserCompany(userId, companyId),
    getFiscalRegisterForUserCompany(userId, companyId),
    getDocumentOriginReconciliationForUserCompany(userId, companyId),
  ]);
  return { companyId, ...buildCompleteReportReconciliation({ trialBalance, journal, balanceSheet, vatSummary, fiscalRegister, documentOrigin }) };

}

export async function getSaftReadinessForUserCompany(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const companyContext = await db.select({ company: companies }).from(companies).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(companies.id, companyId), eq(organizations.ownerUserId, userId))).limit(1);
  const company = companyContext[0]?.company;
  if (!company) throw new Error("COMPANY_NOT_FOUND_OR_FORBIDDEN");
  const [periodRows, accountRows, journal, documents] = await Promise.all([
    getPeriodsForUserCompany(userId, companyId),
    db.select({ id: chartAccounts.id }).from(chartAccounts).where(eq(chartAccounts.companyId, companyId)),
    getJournalForUserCompany(userId, companyId),
    getDocumentsForUserCompany(userId, companyId),
  ]);
  const period = periodRows[0]?.period;
  return buildSaftReadiness({
    companyName: company.name,
    nif: company.nif,
    functionalCurrency: company.functionalCurrency,
    periodStart: period ? new Date(Date.UTC(period.year, period.month - 1, 1)) : null,
    periodEnd: period ? new Date(Date.UTC(period.year, period.month, 0, 23, 59, 59, 999)) : null,
    accountCount: accountRows.length,
    journalEntryCount: journal.entries.length,
    documentCount: documents.length,
    customerCount: 0,
    supplierCount: 0,
    productCount: 0,
    taxRuleCount: 0,
  });
}

export async function transitionBusinessDocument(input: { userId: number; companyId: number; documentId: number; to: "DRAFT" | "VALIDATED" | "ISSUED" | "ACCOUNTED" | "CANCELLED"; cancellationReason?: string; correlationId?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertCompanyReady(db, input.userId, input.companyId);
  const document = await db.select({ document: businessDocuments, organization: organizations }).from(businessDocuments).innerJoin(companies, eq(businessDocuments.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(businessDocuments.id, input.documentId), eq(businessDocuments.companyId, input.companyId), eq(organizations.ownerUserId, input.userId))).limit(1);
  const current = document[0];
  if (!current) throw new Error("DOCUMENT_NOT_FOUND_OR_FORBIDDEN");
  if (!validateDocumentTransition(current.document.status, input.to)) throw new Error("INVALID_DOCUMENT_TRANSITION");
  if (input.to === "CANCELLED" && !input.cancellationReason?.trim()) throw new Error("CANCELLATION_REASON_REQUIRED");
  if (input.to === "ACCOUNTED") {
    const linkedEntry = await db.select({ id: journalEntries.id }).from(journalEntries).where(and(eq(journalEntries.sourceDocumentId, input.documentId), eq(journalEntries.companyId, input.companyId), eq(journalEntries.status, "POSTED"))).limit(1);
    if (!linkedEntry[0]) throw new Error("DOCUMENT_REQUIRES_POSTED_ENTRY");
  }
  const issuedAt = input.to === "ISSUED" ? new Date() : current.document.issuedAt;
  const immutableHash = input.to === "ISSUED" ? createHash("sha256").update(JSON.stringify({ companyId: input.companyId, documentId: input.documentId, documentNumber: current.document.documentNumber, documentType: current.document.documentType, counterpartyId: current.document.counterpartyId, counterpartyType: current.document.counterpartyType, currency: current.document.currency, ivaRegime: current.document.ivaRegime, netAmount: current.document.netAmount, taxAmount: current.document.taxAmount, totalAmount: current.document.totalAmount, issuedAt: issuedAt?.toISOString() ?? null })).digest("hex") : current.document.immutableHash;
  const cancellationReason = input.to === "CANCELLED" ? input.cancellationReason!.trim() : current.document.cancellationReason;
  await db.update(businessDocuments).set({ status: input.to, issuedAt, immutableHash, cancellationReason }).where(eq(businessDocuments.id, input.documentId));
  await appendAuditEventForUser({ organizationId: current.organization.id, companyId: input.companyId, actorUserId: input.userId, action: `DOCUMENT_${input.to}`, entityType: "businessDocument", entityId: String(input.documentId), beforeState: JSON.stringify({ status: current.document.status, cancellationReason: current.document.cancellationReason }), afterState: JSON.stringify({ status: input.to, cancellationReason }), correlationId: input.correlationId ?? `document:${input.documentId}:${input.to}` });
  return { id: input.documentId, from: current.document.status, to: input.to };
}

export async function postJournalEntry(input: { companyId: number; periodId: number; sourceDocumentId?: number; reversalOfEntryId?: number; idempotencyKey: string; description: string; createdBy: number; lines: (JournalLineInput & { currency?: string; exchangeRate?: number })[] }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const companyContext = await db.select({ company: companies, organization: organizations }).from(companies).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(companies.id, input.companyId), eq(organizations.ownerUserId, input.createdBy))).limit(1);
  if (!companyContext[0]) throw new Error("COMPANY_NOT_FOUND_OR_FORBIDDEN");
  if (companyContext[0].company.configurationStatus !== "READY") throw new Error("COMPANY_CONFIGURATION_PENDING");
  await assertFiscalPeriodForUserCompany({ actorUserId: input.createdBy, companyId: input.companyId, periodId: input.periodId });
  if (input.sourceDocumentId !== undefined) {
    const source = await db.select({ id: businessDocuments.id }).from(businessDocuments).where(and(eq(businessDocuments.id, input.sourceDocumentId), eq(businessDocuments.companyId, input.companyId))).limit(1);
    if (!source[0]) throw new Error("SOURCE_DOCUMENT_NOT_FOUND_OR_FORBIDDEN");
  }
  if (input.reversalOfEntryId !== undefined) {
    const original = await db.select({ id: journalEntries.id, status: journalEntries.status }).from(journalEntries).where(and(eq(journalEntries.id, input.reversalOfEntryId), eq(journalEntries.companyId, input.companyId))).limit(1);
    if (!original[0]) throw new Error("REVERSAL_ENTRY_NOT_FOUND_OR_FORBIDDEN");
    if (original[0].status === "REVERSED") throw new Error("REVERSAL_ALREADY_EXISTS");
  }
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
    if (input.reversalOfEntryId !== undefined) await tx.update(journalEntries).set({ status: "REVERSED" }).where(and(eq(journalEntries.id, input.reversalOfEntryId), eq(journalEntries.companyId, input.companyId), eq(journalEntries.status, "POSTED")));
    return { entryId, idempotent: false };
  });
  if (!result.idempotent) {
    await appendAuditEventForUser({ organizationId: companyContext[0].organization.id, companyId: input.companyId, actorUserId: input.createdBy, action: input.reversalOfEntryId ? "JOURNAL_ENTRY_REVERSED" : "JOURNAL_ENTRY_POSTED", entityType: "journalEntry", entityId: String(result.entryId), beforeState: input.reversalOfEntryId ? JSON.stringify({ reversalOfEntryId: input.reversalOfEntryId }) : null, afterState: JSON.stringify({ description: input.description, sourceDocumentId: input.sourceDocumentId, reversalOfEntryId: input.reversalOfEntryId, lineCount: input.lines.length }), correlationId: input.idempotencyKey });
  }
  return result;
}
