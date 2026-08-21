import { createHash } from "node:crypto";
import { validateAuditSnapshotShape } from "./audit-chain";
import { and, desc, eq, gte, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser,   agtIntegrationConfigs, agtEstablishments, agtSeries, agtSubmissions, agtSubmissionDocuments, agtSignatureKeys, documentImportBatches, documentImportRows,
  auditEvents, accountingRules, pgcAccounts, pgcVersions, balancertsIaConfigs, organizationMemberships, balancertsIaLogs, balancertsIaSuggestions, businessDocuments, cashAccounts, cashReconciliations, bankStatementImports, bankStatementLines, fiscalTaxRecords, openingBalances, accountingAdjustments, chartAccounts, companies, employees, employmentContracts, payrollItems, payrollRuleSets, payrollRuns, humanResourcesTasks, costCenters, counterparties, documentItems, documentSeries, documentTaxes, fileAssets, fileAssetVersions, fixedAssets, fiscalExercises, fiscalPeriods, journalEntries, journalLines, normativeRules, organizations, payments, platforms, products, purchaseOrderItems, purchaseOrders, purchaseReceiptItems, purchaseReceipts, stockCountItems, stockCounts, stockMovements, treasuryTransactions, users, warehouses } from "../drizzle/schema";
import { buildAgingReport, buildBalanceSheet, buildCompleteReportReconciliation, buildDocumentOriginReconciliation, buildFiscalRegister, buildIncomeStatement, buildJournal, buildLedger, buildReportReconciliation, buildSaftReadiness, buildTrialBalance, buildVatSummary, type JournalRow } from "./reports";
import { reconcileInventoryToLedger } from "./inventory-posting";
import { buildStockTransfer, normalizeWarehouseCode, validateStockCountLine, validateStockMovement } from "./operations";
import { applyReconciliationAdjustment } from "./reconciliation";
import { assertDocumentMutable, formatDocumentNumber } from "./documents";
import { validateBalancedEntry, validateDocumentTransition, type JournalLineInput } from "./accounting";
import { assertSecondApprover, calculatePayrollAmounts, parseIrtBrackets } from "./payroll";
import { ENV } from "./_core/env";
import { AIRouter, LocalAIProvider, type IAConfig, type IARequest } from "./balancerts-ia/providers";

const organizationAccessCondition = (userId: number) => or(eq(organizations.ownerUserId, userId), sql`EXISTS (SELECT 1 FROM organizationMemberships AS om_access WHERE om_access.organizationId = ${organizations.id} AND om_access.userId = ${userId} AND om_access.status = 'ACTIVE')`);

let _db: ReturnType<typeof drizzle> | null = null;

export async function testBalancertsIaLocalProviderForUser(input: { userId: number; companyId: number }) {
  const config = await getBalancertsIaConfigForUserCompany(input);
  if (!config.enabled || !config.localEnabled) throw new Error("IA_LOCAL_DESACTIVADA");
  const started = Date.now();
  const provider = new LocalAIProvider({ localBaseUrl: config.localBaseUrl, localPort: config.localPort, localModel: config.localModel });
  const available = await provider.isAvailable();
  const responseMs = Date.now() - started;
  await createBalancertsIaLogForUser({ userId: input.userId, companyId: input.companyId, operation: "TESTE_IA_LOCAL", provider: "local", model: provider.model, responseMs, resultSummary: JSON.stringify({ available, endpoint: `${config.localBaseUrl}:${config.localPort}` }) });
  return { provider: "local", model: provider.model, available, responseMs };
}

export async function createBalancertsIaDocumentSuggestionForUser(input: { userId: number; companyId: number; documentId: number; task?: "CLASSIFICAR_DOCUMENTO" | "PREENCHER_RASCUNHO" }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ document: businessDocuments, company: companies, organization: organizations }).from(businessDocuments).innerJoin(companies, eq(businessDocuments.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(businessDocuments.id, input.documentId), eq(businessDocuments.companyId, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  const row = rows[0];
  if (!row) throw new Error("DOCUMENT_NOT_FOUND_OR_FORBIDDEN");
  const config = await getBalancertsIaConfigForUserCompany({ userId: input.userId, companyId: input.companyId });
  if (!config.enabled) throw new Error("IA_DESACTIVADA");
  const task = input.task ?? "CLASSIFICAR_DOCUMENTO";
  if (task === "PREENCHER_RASCUNHO" && row.document.status !== "DRAFT") throw new Error("IA_RASCUNHO_REQUER_DOCUMENTO_EM_RASCUNHO");
  const idempotencyKey = `document-${task.toLowerCase()}:${input.companyId}:${input.documentId}:${row.document.immutableHash ?? row.document.createdAt.getTime()}`;
  const existing = await db.select().from(balancertsIaSuggestions).where(eq(balancertsIaSuggestions.idempotencyKey, idempotencyKey)).limit(1);
  if (existing[0]) return { suggestion: existing[0], alreadyExists: true };
  const iaConfig: IAConfig = { localEnabled: Boolean(config.localEnabled), localBaseUrl: config.localBaseUrl, localPort: config.localPort, localModel: config.localModel, azureEnabled: Boolean(config.azureEnabled), azureEndpoint: config.azureEndpoint, azureDeployment: config.azureDeployment, openaiEnabled: Boolean(config.openaiEnabled), openaiModel: config.openaiModel };
  const safeInput = { documentType: row.document.documentType, status: row.document.status, counterpartyType: row.document.counterpartyType, ivaRegime: row.document.ivaRegime, currency: row.document.currency, netAmount: row.document.netAmount, taxAmount: row.document.taxAmount, totalAmount: row.document.totalAmount };
  let result;
  try { result = await new AIRouter(iaConfig).execute({ task: task === "PREENCHER_RASCUNHO" ? "preencher_rascunho" : "classificar", input: task === "PREENCHER_RASCUNHO" ? "Sugere o preenchimento deste rascunho apenas para revisão humana. Não alteres dados nem executes operações." : "Classifica este documento apenas para revisão humana. Não alteres dados nem executes operações.", context: safeInput }); } catch (error) { await createBalancertsIaLogForUser({ userId: input.userId, companyId: input.companyId, operation: task, provider: "router", requestSummary: JSON.stringify(safeInput), error: error instanceof Error ? error.message : "IA_ERROR" }); throw error; }
  const suggestionPayload = JSON.stringify({ proposta: result.content, aplicaçãoAutomática: false, revisãoObrigatória: true });
  await db.insert(balancertsIaSuggestions).values({ organizationId: row.company.organizationId, companyId: input.companyId, createdBy: input.userId, targetType: "DOCUMENT", targetId: input.documentId, task, status: "PROPOSED", provider: result.provider, model: result.model, confidence: "50.00", idempotencyKey, inputSummary: JSON.stringify(safeInput), beforeState: JSON.stringify({ status: row.document.status, documentType: row.document.documentType, ivaRegime: row.document.ivaRegime }), suggestion: suggestionPayload });
  await createBalancertsIaLogForUser({ userId: input.userId, companyId: input.companyId, operation: task, provider: result.provider, model: result.model, confidence: 50, requestSummary: JSON.stringify(safeInput), resultSummary: suggestionPayload, responseMs: result.responseMs });
  const created = await db.select().from(balancertsIaSuggestions).where(eq(balancertsIaSuggestions.idempotencyKey, idempotencyKey)).limit(1);
  return { suggestion: created[0], alreadyExists: false };
}

export async function getBalancertsIaSuggestionsForUserCompany(input: { userId: number; companyId: number; status?: "PROPOSED" | "APPROVED" | "REJECTED" | "EXPIRED" }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const owner = await db.select({ company: companies }).from(companies).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(companies.id, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  if (!owner[0]) throw new Error("COMPANY_NOT_FOUND_OR_FORBIDDEN");
  return db.select().from(balancertsIaSuggestions).where(and(eq(balancertsIaSuggestions.companyId, input.companyId), eq(balancertsIaSuggestions.organizationId, owner[0].company.organizationId), ...(input.status ? [eq(balancertsIaSuggestions.status, input.status)] : []))).orderBy(desc(balancertsIaSuggestions.id)).limit(100);
}

export async function reviewBalancertsIaSuggestionForUser(input: { userId: number; companyId: number; suggestionId: number; decision: "APPROVED" | "REJECTED"; reviewNote?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ suggestion: balancertsIaSuggestions, company: companies }).from(balancertsIaSuggestions).innerJoin(companies, eq(balancertsIaSuggestions.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(balancertsIaSuggestions.id, input.suggestionId), eq(balancertsIaSuggestions.companyId, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  const row = rows[0];
  if (!row) throw new Error("IA_SUGGESTION_NOT_FOUND_OR_FORBIDDEN");
  if (row.suggestion.status !== "PROPOSED") throw new Error("IA_SUGGESTION_ALREADY_REVIEWED");
  await db.update(balancertsIaSuggestions).set({ status: input.decision, reviewedBy: input.userId, reviewedAt: new Date(), reviewNote: input.reviewNote?.trim() || null }).where(eq(balancertsIaSuggestions.id, input.suggestionId));
  await appendAuditEventForUser({ organizationId: row.company.organizationId, companyId: input.companyId, actorUserId: input.userId, action: input.decision === "APPROVED" ? "BALANCERTS_IA_SUGGESTION_APPROVED" : "BALANCERTS_IA_SUGGESTION_REJECTED", entityType: "balancertsIaSuggestion", entityId: String(input.suggestionId), beforeState: JSON.stringify({ status: row.suggestion.status, targetId: row.suggestion.targetId }), afterState: JSON.stringify({ status: input.decision, applied: false }), correlationId: `balancerts-ia-suggestion:${input.suggestionId}` });
  return { id: input.suggestionId, status: input.decision, applied: false } as const;
}

export async function getBalancertsIaConfigForUserCompany(input: { userId: number; companyId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ config: balancertsIaConfigs, company: companies }).from(companies).innerJoin(organizations, eq(companies.organizationId, organizations.id)).leftJoin(balancertsIaConfigs, eq(balancertsIaConfigs.companyId, companies.id)).where(and(eq(companies.id, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  const row = rows[0];
  if (!row) throw new Error("COMPANY_NOT_FOUND_OR_FORBIDDEN");
  return row.config ?? { id: 0, organizationId: row.company.organizationId, companyId: row.company.id, enabled: 1, localEnabled: 1, localBaseUrl: "http://127.0.0.1", localPort: 11434, localModel: "qwen2.5:3b", azureEnabled: 0, azureEndpoint: null, azureDeployment: null, azureSecretRef: null, openaiEnabled: 0, openaiModel: "gpt-5-mini", openaiSecretRef: null, createdAt: new Date(), updatedAt: new Date() };
}

export async function updateBalancertsIaConfigForUser(input: { userId: number; companyId: number; enabled: boolean; localEnabled: boolean; localBaseUrl: string; localPort: number; localModel: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const companyRows = await db.select({ company: companies, organization: organizations }).from(companies).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(companies.id, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  const company = companyRows[0];
  if (!company) throw new Error("COMPANY_NOT_FOUND_OR_FORBIDDEN");
  await db.insert(balancertsIaConfigs).values({ organizationId: company.company.organizationId, companyId: input.companyId, enabled: input.enabled ? 1 : 0, localEnabled: input.localEnabled ? 1 : 0, localBaseUrl: input.localBaseUrl, localPort: input.localPort, localModel: input.localModel, azureEnabled: 0, azureEndpoint: null, azureDeployment: null, azureSecretRef: null, openaiEnabled: 0, openaiModel: "", openaiSecretRef: null }).onDuplicateKeyUpdate({ set: { enabled: input.enabled ? 1 : 0, localEnabled: input.localEnabled ? 1 : 0, localBaseUrl: input.localBaseUrl, localPort: input.localPort, localModel: input.localModel, azureEnabled: 0, azureEndpoint: null, azureDeployment: null, azureSecretRef: null, openaiEnabled: 0, openaiModel: "", openaiSecretRef: null } });
  await appendAuditEventForUser({ organizationId: company.company.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "BALANCERTS_IA_CONFIG_UPDATED", entityType: "balancertsIaConfig", entityId: String(input.companyId), beforeState: null, afterState: JSON.stringify({ enabled: input.enabled, localEnabled: input.localEnabled, paidProviders: false, offline: true }), correlationId: `balancerts-ia-config:${input.companyId}` });
  return getBalancertsIaConfigForUserCompany({ userId: input.userId, companyId: input.companyId });
}

export async function getBalancertsIaStatusForUserCompany(input: { userId: number; companyId: number }) {
  const config = await getBalancertsIaConfigForUserCompany(input);
  const iaConfig: IAConfig = { localEnabled: Boolean(config.localEnabled), localBaseUrl: config.localBaseUrl, localPort: config.localPort, localModel: config.localModel, azureEnabled: Boolean(config.azureEnabled), azureEndpoint: config.azureEndpoint, azureDeployment: config.azureDeployment, openaiEnabled: Boolean(config.openaiEnabled), openaiModel: config.openaiModel };
  if (!config.enabled) return { enabled: false, local: false, azure: false, openai: false, internet: false, mode: "DESACTIVADO" as const };
  const status = await new AIRouter(iaConfig).status();
  return { enabled: true, ...status };
}

export async function createBalancertsIaLogForUser(input: { userId: number; companyId: number; operation: string; provider: string; model?: string; confidence?: number; requestSummary?: string; resultSummary?: string; responseMs?: number; error?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ company: companies }).from(companies).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(companies.id, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  const company = rows[0]?.company;
  if (!company) throw new Error("COMPANY_NOT_FOUND_OR_FORBIDDEN");
  await db.insert(balancertsIaLogs).values({ organizationId: company.organizationId, companyId: input.companyId, userId: input.userId, operation: input.operation, provider: input.provider, model: input.model, confidence: input.confidence?.toFixed(2), requestSummary: input.requestSummary?.slice(0, 2000), resultSummary: input.resultSummary?.slice(0, 2000), responseMs: input.responseMs, error: input.error?.slice(0, 1000) });
  return { recorded: true };
}

export async function getBalancertsIaLogsForUserCompany(input: { userId: number; companyId: number; limit?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const owner = await db.select({ company: companies }).from(companies).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(companies.id, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  if (!owner[0]) throw new Error("COMPANY_NOT_FOUND_OR_FORBIDDEN");
  return db.select().from(balancertsIaLogs).where(and(eq(balancertsIaLogs.companyId, input.companyId), eq(balancertsIaLogs.organizationId, owner[0].company.organizationId))).orderBy(desc(balancertsIaLogs.id)).limit(Math.min(input.limit ?? 50, 100));
}

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
  const conditions = [eq(counterparties.companyId, companyId), organizationAccessCondition(userId)];
  if (kind) conditions.push(eq(counterparties.kind, kind));
  return db.select({ counterparty: counterparties }).from(counterparties).innerJoin(companies, eq(counterparties.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(...conditions)).orderBy(counterparties.name);
}

export async function createCounterpartyForUser(input: { userId: number; organizationId: number; companyId: number; kind: "CUSTOMER" | "SUPPLIER"; taxId?: string; name: string; email?: string; phone?: string; address?: string; municipality?: string; province?: string; paymentTermsDays?: number; creditLimit?: number; preferredCurrency?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertAuditScopeForUser({ actorUserId: input.userId, organizationId: input.organizationId, companyId: input.companyId });
  const result = await db.insert(counterparties).values({ organizationId: input.organizationId, companyId: input.companyId, kind: input.kind, taxId: input.taxId, name: input.name, email: input.email, phone: input.phone, address: input.address, municipality: input.municipality, province: input.province, paymentTermsDays: input.paymentTermsDays ?? 0, creditLimit: (input.creditLimit ?? 0).toFixed(2), preferredCurrency: input.preferredCurrency ?? "AOA" });
  const id = Number(result[0].insertId);
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "COUNTERPARTY_CREATED", entityType: "counterparty", entityId: String(id), beforeState: null, afterState: JSON.stringify({ kind: input.kind, name: input.name, taxId: input.taxId ?? null }), correlationId: `counterparty:${id}` });
  return { id, ...input };
}

export async function getProductsForUserCompany(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ product: products }).from(products).innerJoin(companies, eq(products.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(products.companyId, companyId), organizationAccessCondition(userId))).orderBy(products.code);
}

export async function createProductForUser(input: { userId: number; companyId: number; code: string; name: string; kind: "GOOD" | "SERVICE"; unitCode?: string; taxCode?: string; salePrice?: number; purchasePrice?: number; stockManaged?: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const company = await db.select({ organizationId: companies.organizationId }).from(companies).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(companies.id, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  if (!company[0]) throw new Error("COMPANY_NOT_FOUND_OR_FORBIDDEN");
  const result = await db.insert(products).values({ companyId: input.companyId, code: input.code, name: input.name, kind: input.kind, unitCode: input.unitCode ?? "UN", taxCode: input.taxCode, salePrice: (input.salePrice ?? 0).toFixed(4), purchasePrice: (input.purchasePrice ?? 0).toFixed(4), stockManaged: input.stockManaged === false ? 0 : 1 });
  const id = Number(result[0].insertId);
  await appendAuditEventForUser({ organizationId: company[0].organizationId, companyId: input.companyId, actorUserId: input.userId, action: "PRODUCT_CREATED", entityType: "product", entityId: String(id), beforeState: null, afterState: JSON.stringify({ code: input.code, name: input.name, kind: input.kind }), correlationId: `product:${id}` });
  return { id, ...input };
}

export async function updateCashAccountForUser(input: { userId: number; companyId: number; cashAccountId: number; name?: string; accountNumber?: string; bankName?: string; bankCode?: string; branchName?: string; iban?: string; accountingAccountId?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ account: cashAccounts, organizationId: companies.organizationId }).from(cashAccounts).innerJoin(companies, eq(cashAccounts.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(cashAccounts.id, input.cashAccountId), eq(cashAccounts.companyId, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  if (!rows[0]) throw new Error("CASH_ACCOUNT_NOT_FOUND_OR_FORBIDDEN");
  const before = rows[0].account;
  await db.update(cashAccounts).set({ ...(input.name === undefined ? {} : { name: input.name }), ...(input.accountNumber === undefined ? {} : { accountNumber: input.accountNumber }), ...(input.bankName === undefined ? {} : { bankName: input.bankName }), ...(input.bankCode === undefined ? {} : { bankCode: input.bankCode }), ...(input.branchName === undefined ? {} : { branchName: input.branchName }), ...(input.iban === undefined ? {} : { iban: input.iban }), ...(input.accountingAccountId === undefined ? {} : { accountingAccountId: input.accountingAccountId }) }).where(eq(cashAccounts.id, input.cashAccountId));
  await appendAuditEventForUser({ organizationId: rows[0].organizationId, companyId: input.companyId, actorUserId: input.userId, action: "CASH_ACCOUNT_UPDATED", entityType: "cashAccount", entityId: String(input.cashAccountId), beforeState: JSON.stringify(before), afterState: JSON.stringify({ ...before, ...input }), correlationId: `cash-account:${input.cashAccountId}` });
  return { id: input.cashAccountId };
}

export async function getCashAccountsForUserCompany(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ account: cashAccounts }).from(cashAccounts).innerJoin(companies, eq(cashAccounts.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(cashAccounts.companyId, companyId), organizationAccessCondition(userId))).orderBy(cashAccounts.name);
}

export async function createCashAccountForUser(input: { userId: number; organizationId: number; companyId: number; name: string; kind: "CASH" | "BANK"; bankName?: string; bankCode?: string; branchName?: string; accountNumber?: string; iban?: string; accountingAccountId?: number; currency?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertAuditScopeForUser({ actorUserId: input.userId, organizationId: input.organizationId, companyId: input.companyId });
  const result = await db.insert(cashAccounts).values({ companyId: input.companyId, name: input.name, kind: input.kind, bankName: input.bankName, bankCode: input.bankCode, branchName: input.branchName, accountNumber: input.accountNumber, iban: input.iban, accountingAccountId: input.accountingAccountId, currency: input.currency ?? "AOA" });
  const id = Number(result[0].insertId);
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "CASH_ACCOUNT_CREATED", entityType: "cashAccount", entityId: String(id), beforeState: null, afterState: JSON.stringify({ name: input.name, kind: input.kind, currency: input.currency ?? "AOA" }), correlationId: `cash-account:${id}` });
  return { id, ...input };
}

export async function getTreasuryTransactionsForUserCompany(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ transaction: treasuryTransactions, account: cashAccounts }).from(treasuryTransactions).innerJoin(cashAccounts, eq(treasuryTransactions.cashAccountId, cashAccounts.id)).innerJoin(companies, eq(treasuryTransactions.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(treasuryTransactions.companyId, companyId), organizationAccessCondition(userId))).orderBy(treasuryTransactions.valueDate);
}

export async function createPaymentForUser(input: { userId: number; organizationId: number; companyId: number; periodId?: number; documentId?: number; cashAccountId?: number; direction: "RECEIPT" | "PAYMENT"; amount: number; currency?: string; paidAt: Date; method: "CASH" | "BANK_TRANSFER" | "CARD" | "OTHER"; approvalRequired?: boolean; idempotencyKey: string; correlationId: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertAuditScopeForUser({ actorUserId: input.userId, organizationId: input.organizationId, companyId: input.companyId });
  if (input.periodId) {
    const period = await db.select({ id: fiscalPeriods.id }).from(fiscalPeriods).where(and(eq(fiscalPeriods.id, input.periodId), eq(fiscalPeriods.companyId, input.companyId))).limit(1);
    if (!period[0]) throw new Error("FISCAL_PERIOD_NOT_FOUND_OR_FORBIDDEN");
  }
  if (input.documentId) {
    const document = await db.select({ id: businessDocuments.id }).from(businessDocuments).where(and(eq(businessDocuments.id, input.documentId), eq(businessDocuments.companyId, input.companyId))).limit(1);
    if (!document[0]) throw new Error("DOCUMENT_NOT_FOUND_OR_FORBIDDEN");
  }
  if (input.cashAccountId) {
    const account = await db.select({ id: cashAccounts.id }).from(cashAccounts).innerJoin(companies, eq(cashAccounts.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(cashAccounts.id, input.cashAccountId), eq(cashAccounts.companyId, input.companyId), organizationAccessCondition(input.userId))).limit(1);
    if (!account[0]) throw new Error("CASH_ACCOUNT_NOT_FOUND_OR_FORBIDDEN");
  }
  const existing = await db.select().from(payments).where(eq(payments.idempotencyKey, input.idempotencyKey)).limit(1);
  if (existing[0]) return { payment: existing[0], idempotent: true };
  const result = await db.insert(payments).values({ organizationId: input.organizationId, companyId: input.companyId, periodId: input.periodId, documentId: input.documentId, cashAccountId: input.cashAccountId, direction: input.direction, amount: String(input.amount), currency: input.currency ?? "AOA", paidAt: input.paidAt, method: input.method, approvalStatus: input.approvalRequired ? "PENDING" : "APPROVED", approvedBy: input.approvalRequired ? undefined : input.userId, approvedAt: input.approvalRequired ? undefined : new Date(), idempotencyKey: input.idempotencyKey, correlationId: input.correlationId, createdBy: input.userId });
  const id = Number(result[0].insertId);
  let treasuryTransactionId: number | undefined;
  if (input.cashAccountId && !input.approvalRequired) {
    const treasury = await db.insert(treasuryTransactions).values({ companyId: input.companyId, periodId: input.periodId, cashAccountId: input.cashAccountId, paymentId: id, direction: input.direction === "RECEIPT" ? "IN" : "OUT", amount: String(input.amount), valueDate: input.paidAt, correlationId: input.correlationId });
    treasuryTransactionId = Number(treasury[0].insertId);
    await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "TREASURY_TRANSACTION_CREATED", entityType: "treasuryTransaction", entityId: String(treasuryTransactionId), beforeState: null, afterState: JSON.stringify({ paymentId: id, periodId: input.periodId ?? null, cashAccountId: input.cashAccountId, direction: input.direction === "RECEIPT" ? "IN" : "OUT", amount: input.amount }), correlationId: input.correlationId });
  }
  if (input.documentId && !input.approvalRequired) await db.update(businessDocuments).set({ settledAmount: sql`LEAST(${businessDocuments.totalAmount}, ${businessDocuments.settledAmount} + ${input.amount.toFixed(2)})` }).where(and(eq(businessDocuments.id, input.documentId), eq(businessDocuments.companyId, input.companyId), sql`${businessDocuments.status} IN ('ISSUED','ACCOUNTED')`));
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "PAYMENT_CREATED", entityType: "payment", entityId: String(id), beforeState: null, afterState: JSON.stringify({ direction: input.direction, amount: input.amount, periodId: input.periodId ?? null, documentId: input.documentId ?? null, cashAccountId: input.cashAccountId ?? null, status: "PENDING", approvalStatus: input.approvalRequired ? "PENDING" : "APPROVED" }), correlationId: input.correlationId });
  return { payment: { id, ...input, status: "PENDING" as const }, treasuryTransactionId, idempotent: false };
}

export async function getAgtIntegrationConfigForUserCompany(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ config: agtIntegrationConfigs }).from(agtIntegrationConfigs).innerJoin(companies, eq(agtIntegrationConfigs.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(agtIntegrationConfigs.companyId, companyId), organizationAccessCondition(userId), eq(agtIntegrationConfigs.active, 1))).orderBy(desc(agtIntegrationConfigs.createdAt));
}

export async function configureAgtIntegrationForUser(input: { userId: number; organizationId: number; companyId: number; version: string; productId?: string; productVersion?: string; softwareValidationNumber?: string; serviceNamespace?: string; xsdVersion?: string; xsdReference?: string; endpointReference?: string; authReference?: string; officialCodes?: Record<string, string>; homologationStatus?: "NOT_AVAILABLE" | "INTERNAL_READY" | "TECHNICAL_PENDING" }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const context = await db.select({ company: companies, organization: organizations }).from(companies).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(companies.id, input.companyId), eq(companies.organizationId, input.organizationId), organizationAccessCondition(input.userId))).limit(1);
  if (!context[0]) throw new Error("COMPANY_NOT_FOUND_OR_FORBIDDEN");
  const inserted = await db.insert(agtIntegrationConfigs).values({ organizationId: input.organizationId, companyId: input.companyId, version: input.version, productId: input.productId, productVersion: input.productVersion, softwareValidationNumber: input.softwareValidationNumber, serviceNamespace: input.serviceNamespace, xsdVersion: input.xsdVersion, xsdReference: input.xsdReference, endpointReference: input.endpointReference, authReference: input.authReference, officialCodes: input.officialCodes, homologationStatus: input.homologationStatus ?? "INTERNAL_READY", active: 1 });
  const id = Number(inserted[0].insertId);
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "AGT_CONFIGURED", entityType: "agtIntegrationConfig", entityId: String(id), beforeState: null, afterState: JSON.stringify({ ...input, userId: undefined, id }), correlationId: `agt-config:${input.companyId}:${input.version}` });
  return { id, homologationStatus: input.homologationStatus ?? "INTERNAL_READY" };
}

export async function getAgtEstablishmentsForUserCompany(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ establishment: agtEstablishments }).from(agtEstablishments).innerJoin(companies, eq(agtEstablishments.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(agtEstablishments.companyId, companyId), organizationAccessCondition(userId), eq(agtEstablishments.active, 1))).orderBy(agtEstablishments.establishmentNumber);
}

export async function createAgtEstablishmentForUser(input: { userId: number; organizationId: number; companyId: number; establishmentNumber: string; name: string; address?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertAuditScopeForUser({ actorUserId: input.userId, organizationId: input.organizationId, companyId: input.companyId });
  const result = await db.insert(agtEstablishments).values({ organizationId: input.organizationId, companyId: input.companyId, establishmentNumber: input.establishmentNumber.trim(), name: input.name.trim(), address: input.address?.trim() });
  const id = Number(result[0].insertId);
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "AGT_ESTABLISHMENT_CREATED", entityType: "agtEstablishment", entityId: String(id), beforeState: null, afterState: JSON.stringify({ ...input, userId: undefined, id }), correlationId: `agt-establishment:${id}` });
  return { id };
}

export async function getAgtSeriesForUserCompany(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ series: agtSeries, establishment: agtEstablishments }).from(agtSeries).innerJoin(agtEstablishments, eq(agtSeries.establishmentId, agtEstablishments.id)).innerJoin(companies, eq(agtSeries.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(agtSeries.companyId, companyId), organizationAccessCondition(userId))).orderBy(desc(agtSeries.seriesYear), agtSeries.seriesCode);
}

export async function createAgtSeriesForUser(input: { userId: number; organizationId: number; companyId: number; establishmentId: number; seriesCode: string; seriesYear: number; documentType: string; contingencyIndicator?: "N" | "C"; invoicingMethod?: string; firstDocumentApproved?: string; lastDocumentApproved?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertAuditScopeForUser({ actorUserId: input.userId, organizationId: input.organizationId, companyId: input.companyId });
  const establishment = await db.select({ id: agtEstablishments.id }).from(agtEstablishments).where(and(eq(agtEstablishments.id, input.establishmentId), eq(agtEstablishments.companyId, input.companyId), eq(agtEstablishments.organizationId, input.organizationId))).limit(1);
  if (!establishment[0]) throw new Error("AGT_ESTABLISHMENT_NOT_FOUND_OR_FORBIDDEN");
  const result = await db.insert(agtSeries).values({ organizationId: input.organizationId, companyId: input.companyId, establishmentId: input.establishmentId, seriesCode: input.seriesCode.trim(), seriesYear: input.seriesYear, documentType: input.documentType.trim().toUpperCase(), contingencyIndicator: input.contingencyIndicator ?? "N", invoicingMethod: input.invoicingMethod ?? "FESF", firstDocumentApproved: input.firstDocumentApproved, lastDocumentApproved: input.lastDocumentApproved, seriesCreationDate: new Date() });
  const id = Number(result[0].insertId);
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "AGT_SERIES_CREATED", entityType: "agtSeries", entityId: String(id), beforeState: null, afterState: JSON.stringify({ ...input, userId: undefined, id }), correlationId: `agt-series:${id}` });
  return { id };
}

export async function getAgtSubmissionsForUserCompany(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ submission: agtSubmissions, documents: agtSubmissionDocuments }).from(agtSubmissions).leftJoin(agtSubmissionDocuments, eq(agtSubmissions.id, agtSubmissionDocuments.submissionId)).innerJoin(companies, eq(agtSubmissions.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(agtSubmissions.companyId, companyId), organizationAccessCondition(userId))).orderBy(desc(agtSubmissions.createdAt));
}

export async function createAgtSubmissionForUser(input: { userId: number; organizationId: number; companyId: number; operation: string; submissionUUID: string; payload: Record<string, unknown>; requestID?: string; documentIds?: Array<{ documentId?: number; documentNo: string }> }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertAuditScopeForUser({ actorUserId: input.userId, organizationId: input.organizationId, companyId: input.companyId });
  const existing = await db.select({ id: agtSubmissions.id }).from(agtSubmissions).where(and(eq(agtSubmissions.companyId, input.companyId), eq(agtSubmissions.submissionUUID, input.submissionUUID))).limit(1);
  if (existing[0]) return { id: existing[0].id, idempotent: true };
  const inserted = await db.insert(agtSubmissions).values({ organizationId: input.organizationId, companyId: input.companyId, operation: input.operation, submissionUUID: input.submissionUUID, requestID: input.requestID, payload: JSON.stringify(input.payload), createdBy: input.userId, nextPollAt: new Date() });
  const id = Number(inserted[0].insertId);
  for (const document of input.documentIds ?? []) {
    await db.insert(agtSubmissionDocuments).values({ submissionId: id, companyId: input.companyId, documentId: document.documentId, documentNo: document.documentNo });
  }
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "AGT_SUBMISSION_CREATED", entityType: "agtSubmission", entityId: String(id), beforeState: null, afterState: JSON.stringify({ operation: input.operation, submissionUUID: input.submissionUUID, documentCount: input.documentIds?.length ?? 0 }), correlationId: `agt-submission:${input.submissionUUID}` });
  return { id, idempotent: false };
}

export async function updateAgtSubmissionResultForUser(input: { userId: number; companyId: number; submissionId: number; state: "PENDING" | "PROCESSING" | "COMPLETED" | "PARTIAL" | "FAILED" | "CANCELLED"; resultCode?: string; responsePayload?: Record<string, unknown>; requestID?: string; lastError?: string; documents?: Array<{ documentNo: string; documentStatus: "PENDING" | "VALID" | "INVALID" | "REJECTED" | "CANCELLED"; errorCode?: string; errorDescription?: string }> }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const row = await db.select({ submission: agtSubmissions, organizationId: companies.organizationId }).from(agtSubmissions).innerJoin(companies, eq(agtSubmissions.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(agtSubmissions.id, input.submissionId), eq(agtSubmissions.companyId, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  if (!row[0]) throw new Error("AGT_SUBMISSION_NOT_FOUND_OR_FORBIDDEN");
  await db.update(agtSubmissions).set({ state: input.state, resultCode: input.resultCode, requestID: input.requestID, responsePayload: input.responsePayload ? JSON.stringify(input.responsePayload) : undefined, lastError: input.lastError, lastPolledAt: new Date(), nextPollAt: input.state === "PROCESSING" ? new Date(Date.now() + 60_000) : null }).where(eq(agtSubmissions.id, input.submissionId));
  for (const document of input.documents ?? []) {
    await db.update(agtSubmissionDocuments).set({ documentStatus: document.documentStatus, errorCode: document.errorCode, errorDescription: document.errorDescription }).where(and(eq(agtSubmissionDocuments.submissionId, input.submissionId), eq(agtSubmissionDocuments.documentNo, document.documentNo)));
  }
  await appendAuditEventForUser({ organizationId: row[0].organizationId, companyId: input.companyId, actorUserId: input.userId, action: "AGT_SUBMISSION_UPDATED", entityType: "agtSubmission", entityId: String(input.submissionId), beforeState: JSON.stringify(row[0].submission), afterState: JSON.stringify(input), correlationId: `agt-submission:${input.submissionId}` });
  return { id: input.submissionId, state: input.state };
}

export async function createAgtSignatureKeyReferenceForUser(input: { userId: number; organizationId: number; companyId: number; keyType: "SOFTWARE" | "ISSUER"; signatureVersion: number; publicKeyReference: string; privateKeyReference?: string; effectiveFrom?: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertAuditScopeForUser({ actorUserId: input.userId, organizationId: input.organizationId, companyId: input.companyId });
  if (/BEGIN (RSA |EC )?PRIVATE KEY/.test(input.privateKeyReference ?? "")) throw new Error("AGT_PRIVATE_KEY_MATERIAL_FORBIDDEN");
  const inserted = await db.insert(agtSignatureKeys).values({ organizationId: input.organizationId, companyId: input.companyId, keyType: input.keyType, signatureVersion: input.signatureVersion, publicKeyReference: input.publicKeyReference.trim(), privateKeyReference: input.privateKeyReference?.trim(), effectiveFrom: input.effectiveFrom, createdBy: input.userId });
  const id = Number(inserted[0].insertId);
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "AGT_SIGNATURE_KEY_REGISTERED", entityType: "agtSignatureKey", entityId: String(id), beforeState: null, afterState: JSON.stringify({ ...input, userId: undefined, privateKeyReference: input.privateKeyReference ? "configured-reference" : null, id }), correlationId: `agt-key:${input.companyId}:${input.signatureVersion}` });
  return { id, status: "PENDING" as const };
}

export async function changeAgtSignatureKeyStatusForUser(input: { userId: number; companyId: number; keyId: number; status: "ACTIVE" | "ROTATING" | "REVOKED" }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const row = await db.select({ key: agtSignatureKeys, organizationId: companies.organizationId }).from(agtSignatureKeys).innerJoin(companies, eq(agtSignatureKeys.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(agtSignatureKeys.id, input.keyId), eq(agtSignatureKeys.companyId, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  if (!row[0]) throw new Error("AGT_SIGNATURE_KEY_NOT_FOUND_OR_FORBIDDEN");
  await db.update(agtSignatureKeys).set({ status: input.status, ...(input.status === "REVOKED" ? { revokedAt: new Date() } : {}) }).where(eq(agtSignatureKeys.id, input.keyId));
  await appendAuditEventForUser({ organizationId: row[0].organizationId, companyId: input.companyId, actorUserId: input.userId, action: "AGT_SIGNATURE_KEY_STATUS_CHANGED", entityType: "agtSignatureKey", entityId: String(input.keyId), beforeState: JSON.stringify(row[0].key), afterState: JSON.stringify({ status: input.status }), correlationId: `agt-key-status:${input.keyId}:${input.status}` });
  return { id: input.keyId, status: input.status };
}

export async function getAgtSignatureKeysForUserCompany(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ key: agtSignatureKeys }).from(agtSignatureKeys).innerJoin(companies, eq(agtSignatureKeys.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(agtSignatureKeys.companyId, companyId), organizationAccessCondition(userId))).orderBy(desc(agtSignatureKeys.createdAt));
}

export async function getNormativeRulesForUserCompany(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ rule: normativeRules }).from(normativeRules).innerJoin(organizations, eq(normativeRules.organizationId, organizations.id)).where(and(organizationAccessCondition(userId), sql`(${normativeRules.companyId} IS NULL OR ${normativeRules.companyId} = ${companyId})`)).orderBy(desc(normativeRules.effectiveFrom));
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
  return db.selectDistinct({ company: companies, organization: organizations, platform: platforms }).from(companies).innerJoin(organizations, eq(companies.organizationId, organizations.id)).leftJoin(platforms, eq(organizations.platformId, platforms.id)).leftJoin(organizationMemberships, eq(organizationMemberships.organizationId, organizations.id)).where(or(organizationAccessCondition(userId), and(eq(organizationMemberships.userId, userId), eq(organizationMemberships.status, "ACTIVE")))).orderBy(companies.name);
}

export async function assertOrganizationAccessForUser(userId: number, organizationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ id: organizations.id, ownerUserId: organizations.ownerUserId }).from(organizations).leftJoin(organizationMemberships, eq(organizationMemberships.organizationId, organizations.id)).where(and(eq(organizations.id, organizationId), or(organizationAccessCondition(userId), and(eq(organizationMemberships.userId, userId), eq(organizationMemberships.status, "ACTIVE"))))).limit(1);
  if (!rows[0]) throw new Error("ORGANIZATION_ACCESS_FORBIDDEN");
  return rows[0].id;
}

export async function assertCompanyAccessForUser(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ companyId: companies.id, organizationId: organizations.id }).from(companies).innerJoin(organizations, eq(companies.organizationId, organizations.id)).leftJoin(organizationMemberships, eq(organizationMemberships.organizationId, organizations.id)).where(and(eq(companies.id, companyId), or(organizationAccessCondition(userId), and(eq(organizationMemberships.userId, userId), eq(organizationMemberships.status, "ACTIVE"))))).limit(1);
  if (!rows[0]) throw new Error("COMPANY_ACCESS_FORBIDDEN");
  return rows[0];
}

export async function getEffectiveRoleForUserCompany(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select({ role: organizationMemberships.role }).from(companies).innerJoin(organizations, eq(companies.organizationId, organizations.id)).innerJoin(organizationMemberships, eq(organizationMemberships.organizationId, organizations.id)).where(and(eq(companies.id, companyId), eq(organizationMemberships.userId, userId), eq(organizationMemberships.status, "ACTIVE"))).limit(1);
  return rows[0]?.role ?? null;
}
export async function getEffectivePermissionsForUserCompany(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) return [] as string[];
  const rows = await db.select({ permissions: organizationMemberships.permissions }).from(companies).innerJoin(organizations, eq(companies.organizationId, organizations.id)).innerJoin(organizationMemberships, eq(organizationMemberships.organizationId, organizations.id)).where(and(eq(companies.id, companyId), eq(organizationMemberships.userId, userId), eq(organizationMemberships.status, "ACTIVE"))).limit(1);
  return Array.isArray(rows[0]?.permissions) ? rows[0].permissions : [];
}

export async function getOrganizationMembershipsForUser(userId: number, organizationId?: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ membership: organizationMemberships, organization: organizations }).from(organizationMemberships).innerJoin(organizations, eq(organizationMemberships.organizationId, organizations.id)).where(and(eq(organizationMemberships.userId, userId), ...(organizationId ? [eq(organizationMemberships.organizationId, organizationId)] : []))).orderBy(desc(organizationMemberships.id));
}

export async function listOrganizationMembershipsForUser(input: { actorUserId: number; organizationId: number }) {
  const db = await getDb();
  if (!db) return [];
  const organization = await db.select({ id: organizations.id, ownerUserId: organizations.ownerUserId }).from(organizations).where(eq(organizations.id, input.organizationId)).limit(1);
  if (!organization[0]) throw new Error("ORGANIZATION_NOT_FOUND");
  if (organization[0].ownerUserId !== input.actorUserId) {
    const active = await db.select({ id: organizationMemberships.id }).from(organizationMemberships).where(and(eq(organizationMemberships.organizationId, input.organizationId), eq(organizationMemberships.userId, input.actorUserId), eq(organizationMemberships.status, "ACTIVE"))).limit(1);
    if (!active[0]) throw new Error("ORGANIZATION_MEMBERSHIP_FORBIDDEN");
  }
  return db.select({ membership: organizationMemberships, organization: organizations, user: { id: users.id, name: users.name, email: users.email } }).from(organizationMemberships).innerJoin(organizations, eq(organizationMemberships.organizationId, organizations.id)).innerJoin(users, eq(organizationMemberships.userId, users.id)).where(eq(organizationMemberships.organizationId, input.organizationId)).orderBy(desc(organizationMemberships.id));
}

export async function createOrganizationMembershipForUser(input: { actorUserId: number; organizationId: number; userId: number; role: "user" | "admin" | "contabilista" | "financeiro" | "operador" | "auditor" }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const organization = await db.select().from(organizations).where(and(eq(organizations.id, input.organizationId), organizationAccessCondition(input.actorUserId))).limit(1);
  if (!organization[0]) throw new Error("ORGANIZATION_MEMBERSHIP_FORBIDDEN");
  await db.insert(organizationMemberships).values({ organizationId: input.organizationId, userId: input.userId, role: input.role, status: "ACTIVE", invitedBy: input.actorUserId, joinedAt: new Date() }).onDuplicateKeyUpdate({ set: { role: input.role, status: "ACTIVE", invitedBy: input.actorUserId, joinedAt: new Date() } });
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: null, actorUserId: input.actorUserId, action: "ORGANIZATION_MEMBERSHIP_ASSIGNED", entityType: "organizationMembership", entityId: `${input.organizationId}:${input.userId}`, beforeState: null, afterState: JSON.stringify({ userId: input.userId, role: input.role, status: "ACTIVE" }), correlationId: `organization-membership:${input.organizationId}:${input.userId}` });
  return getOrganizationMembershipsForUser(input.userId, input.organizationId);
}

export async function updateOrganizationMembershipForUser(input: { actorUserId: number; membershipId: number; status?: "INVITED" | "ACTIVE" | "SUSPENDED" | "REMOVED"; role?: "user" | "admin" | "contabilista" | "financeiro" | "operador" | "auditor"; permissions?: string[] }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const row = await db.select({ membership: organizationMemberships, organization: organizations }).from(organizationMemberships).innerJoin(organizations, eq(organizationMemberships.organizationId, organizations.id)).where(and(eq(organizationMemberships.id, input.membershipId), organizationAccessCondition(input.actorUserId))).limit(1);
  if (!row[0]) throw new Error("ORGANIZATION_MEMBERSHIP_FORBIDDEN");
  const permissions = input.permissions ? Array.from(new Set(input.permissions.map((value) => value.trim().toLowerCase()).filter(Boolean))) : undefined;
  await db.update(organizationMemberships).set({ ...(input.status ? { status: input.status, joinedAt: input.status === "ACTIVE" ? new Date() : row[0].membership.joinedAt } : {}), ...(input.role ? { role: input.role } : {}), ...(permissions ? { permissions } : {}) }).where(eq(organizationMemberships.id, input.membershipId));
  await appendAuditEventForUser({ organizationId: row[0].membership.organizationId, companyId: null, actorUserId: input.actorUserId, action: "ORGANIZATION_MEMBERSHIP_UPDATED", entityType: "organizationMembership", entityId: String(input.membershipId), beforeState: JSON.stringify({ userId: row[0].membership.userId, role: row[0].membership.role, status: row[0].membership.status }), afterState: JSON.stringify({ userId: row[0].membership.userId, role: input.role ?? row[0].membership.role, permissions: permissions ?? row[0].membership.permissions, status: input.status ?? row[0].membership.status }), correlationId: `organization-membership:${input.membershipId}` });
  return getOrganizationMembershipsForUser(row[0].membership.userId, row[0].membership.organizationId);
}

export async function getEmployeesForUserCompany(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ employee: employees }).from(employees).innerJoin(companies, eq(employees.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(employees.companyId, companyId), organizationAccessCondition(userId))).orderBy(desc(employees.id));
}
export async function createEmployeeForUser(input: { userId: number; organizationId: number; companyId: number; employeeNumber: string; fullName: string; taxId?: string; socialSecurityNumber?: string; birthDate?: Date; hireDate: Date; email?: string; phone?: string; address?: string; bankName?: string; bankAccount?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertCompanyReady(db, input.userId, input.companyId);
  const company = await db.select({ organizationId: companies.organizationId }).from(companies).where(and(eq(companies.id, input.companyId), eq(companies.organizationId, input.organizationId), organizationAccessCondition(input.userId))).limit(1);
  if (!company[0]) throw new Error("COMPANY_ACCESS_FORBIDDEN");
  const result = await db.insert(employees).values({ ...input, createdBy: input.userId }).$returningId();
  const employeeId = result[0]?.id;
  if (!employeeId) throw new Error("EMPLOYEE_CREATE_FAILED");
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "EMPLOYEE_CREATED", entityType: "employee", entityId: String(employeeId), beforeState: null, afterState: JSON.stringify({ employeeNumber: input.employeeNumber, fullName: input.fullName, status: "ACTIVE" }), correlationId: `employee:${employeeId}` });
  return db.select({ employee: employees }).from(employees).where(eq(employees.id, employeeId)).limit(1);
}
export async function updateEmployeeForUser(input: { userId: number; companyId: number; employeeId: number; fullName?: string; taxId?: string; socialSecurityNumber?: string; email?: string; phone?: string; address?: string; bankName?: string; bankAccount?: string; status?: "ACTIVE" | "INACTIVE" | "SUSPENDED" }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const row = await db.select({ employee: employees, organizationId: companies.organizationId }).from(employees).innerJoin(companies, eq(employees.companyId, companies.id)).where(and(eq(employees.id, input.employeeId), eq(employees.companyId, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  if (!row[0]) throw new Error("EMPLOYEE_NOT_FOUND_OR_FORBIDDEN");
  const changes = { ...(input.fullName !== undefined ? { fullName: input.fullName } : {}), ...(input.taxId !== undefined ? { taxId: input.taxId } : {}), ...(input.socialSecurityNumber !== undefined ? { socialSecurityNumber: input.socialSecurityNumber } : {}), ...(input.email !== undefined ? { email: input.email } : {}), ...(input.phone !== undefined ? { phone: input.phone } : {}), ...(input.address !== undefined ? { address: input.address } : {}), ...(input.bankName !== undefined ? { bankName: input.bankName } : {}), ...(input.bankAccount !== undefined ? { bankAccount: input.bankAccount } : {}), ...(input.status !== undefined ? { status: input.status } : {}) };
  if (!Object.keys(changes).length) return row[0];
  await db.update(employees).set(changes).where(eq(employees.id, input.employeeId));
  await appendAuditEventForUser({ organizationId: row[0].organizationId, companyId: input.companyId, actorUserId: input.userId, action: "EMPLOYEE_UPDATED", entityType: "employee", entityId: String(input.employeeId), beforeState: JSON.stringify(row[0].employee), afterState: JSON.stringify({ ...row[0].employee, ...changes }), correlationId: `employee:${input.employeeId}:update` });
  return db.select({ employee: employees }).from(employees).where(eq(employees.id, input.employeeId)).limit(1);
}
export async function getEmploymentContractsForUserCompany(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ contract: employmentContracts, employee: employees }).from(employmentContracts).innerJoin(employees, eq(employmentContracts.employeeId, employees.id)).innerJoin(companies, eq(employmentContracts.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(employmentContracts.companyId, companyId), organizationAccessCondition(userId))).orderBy(desc(employmentContracts.id));
}
export async function createEmploymentContractForUser(input: { userId: number; organizationId: number; companyId: number; employeeId: number; contractNumber: string; contractType: "INDETERMINADO" | "TERMO" | "TEMPO_PARCIAL" | "ESTAGIO" | "PRESTACAO_SERVICOS"; position: string; department?: string; startDate: Date; endDate?: Date; baseSalary: number; salaryCurrency?: string; weeklyHours?: number; workSchedule?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertCompanyReady(db, input.userId, input.companyId);
  const employee = await db.select({ employee: employees }).from(employees).where(and(eq(employees.id, input.employeeId), eq(employees.companyId, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  if (!employee[0]) throw new Error("EMPLOYEE_NOT_FOUND_OR_FORBIDDEN");
  if (input.baseSalary < 0) throw new Error("BASE_SALARY_INVALID");
  if (input.endDate && input.endDate < input.startDate) throw new Error("CONTRACT_DATES_INVALID");
  const result = await db.insert(employmentContracts).values({ ...input, salaryCurrency: input.salaryCurrency ?? "AOA", weeklyHours: String(input.weeklyHours ?? 44), baseSalary: String(input.baseSalary), createdBy: input.userId, status: "DRAFT" }).$returningId();
  const contractId = result[0]?.id;
  if (!contractId) throw new Error("CONTRACT_CREATE_FAILED");
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "EMPLOYMENT_CONTRACT_CREATED", entityType: "employmentContract", entityId: String(contractId), beforeState: null, afterState: JSON.stringify({ employeeId: input.employeeId, contractNumber: input.contractNumber, status: "DRAFT" }), correlationId: `employment-contract:${contractId}` });
  return db.select({ contract: employmentContracts, employee: employees }).from(employmentContracts).innerJoin(employees, eq(employmentContracts.employeeId, employees.id)).where(eq(employmentContracts.id, contractId)).limit(1);
}
export async function transitionEmploymentContractForUser(input: { userId: number; companyId: number; contractId: number; to: "ACTIVE" | "ENDED" | "CANCELLED"; terminationReason?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const row = await db.select({ contract: employmentContracts, organizationId: companies.organizationId }).from(employmentContracts).innerJoin(companies, eq(employmentContracts.companyId, companies.id)).where(and(eq(employmentContracts.id, input.contractId), eq(employmentContracts.companyId, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  if (!row[0]) throw new Error("CONTRACT_NOT_FOUND_OR_FORBIDDEN");
  if (row[0].contract.status === "CANCELLED" || row[0].contract.status === "ENDED") throw new Error("CONTRACT_IMMUTABLE");
  if (input.to === "ENDED" && !input.terminationReason?.trim()) throw new Error("TERMINATION_REASON_REQUIRED");
  await db.update(employmentContracts).set({ status: input.to, terminationReason: input.terminationReason?.trim() || row[0].contract.terminationReason }).where(eq(employmentContracts.id, input.contractId));
  await appendAuditEventForUser({ organizationId: row[0].organizationId, companyId: input.companyId, actorUserId: input.userId, action: `EMPLOYMENT_CONTRACT_${input.to}`, entityType: "employmentContract", entityId: String(input.contractId), beforeState: JSON.stringify(row[0].contract), afterState: JSON.stringify({ ...row[0].contract, status: input.to, terminationReason: input.terminationReason?.trim() || row[0].contract.terminationReason }), correlationId: `employment-contract:${input.contractId}:${input.to.toLowerCase()}` });
  return db.select({ contract: employmentContracts, employee: employees }).from(employmentContracts).innerJoin(employees, eq(employmentContracts.employeeId, employees.id)).where(eq(employmentContracts.id, input.contractId)).limit(1);
}

export async function getPayrollRuleSetsForUserCompany(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ ruleSet: payrollRuleSets }).from(payrollRuleSets).innerJoin(companies, eq(payrollRuleSets.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(payrollRuleSets.companyId, companyId), organizationAccessCondition(userId))).orderBy(desc(payrollRuleSets.effectiveFrom));
}
export async function createPayrollRuleSetForUser(input: { userId: number; organizationId: number; companyId: number; version: string; effectiveFrom: Date; effectiveTo?: Date; socialEmployeeRate: number; socialEmployerRate: number; irtBrackets: string; sourceUrl?: string; salaryAccountCode?: string; socialExpenseAccountCode?: string; socialPayableAccountCode?: string; irtPayableAccountCode?: string; netPayableAccountCode?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertCompanyReady(db, input.userId, input.companyId);
  parseIrtBrackets(input.irtBrackets);
  if (![input.socialEmployeeRate, input.socialEmployerRate].every((rate) => Number.isFinite(rate) && rate >= 0 && rate <= 100)) throw new Error("SOCIAL_RATE_INVALID");
  const result = await db.insert(payrollRuleSets).values({ ...input, createdBy: input.userId, socialEmployeeRate: String(input.socialEmployeeRate), socialEmployerRate: String(input.socialEmployerRate), verificationStatus: "INTERNAL_REVIEW" }).$returningId();
  const ruleSetId = result[0]?.id;
  if (!ruleSetId) throw new Error("PAYROLL_RULE_SET_CREATE_FAILED");
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "PAYROLL_RULE_SET_CREATED", entityType: "payrollRuleSet", entityId: String(ruleSetId), beforeState: null, afterState: JSON.stringify({ version: input.version, verificationStatus: "INTERNAL_REVIEW" }), correlationId: `payroll-rule-set:${ruleSetId}` });
  return db.select({ ruleSet: payrollRuleSets }).from(payrollRuleSets).where(eq(payrollRuleSets.id, ruleSetId)).limit(1);
}
export async function getPayrollRunsForUserCompany(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ run: payrollRuns, ruleSet: payrollRuleSets }).from(payrollRuns).innerJoin(payrollRuleSets, eq(payrollRuns.ruleSetId, payrollRuleSets.id)).innerJoin(companies, eq(payrollRuns.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(payrollRuns.companyId, companyId), organizationAccessCondition(userId))).orderBy(desc(payrollRuns.year), desc(payrollRuns.month));
  const actorIds = Array.from(new Set(rows.flatMap(({ run }) => [run.createdBy, run.reviewedBy, run.approvedBy, run.accountingPreparedBy, run.accountingApprovedBy].filter((id): id is number => Boolean(id)))));
  const actorRows = actorIds.length ? await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, actorIds)) : [];
  const actorById = new Map(actorRows.map((actor) => [actor.id, actor]));
  return rows.map(({ run, ruleSet }) => ({ run, ruleSet, actors: { creator: run.createdBy ? actorById.get(run.createdBy) ?? null : null, reviewer: run.reviewedBy ? actorById.get(run.reviewedBy) ?? null : null, approver: run.approvedBy ? actorById.get(run.approvedBy) ?? null : null, accountingPreparer: run.accountingPreparedBy ? actorById.get(run.accountingPreparedBy) ?? null : null, accountingApprover: run.accountingApprovedBy ? actorById.get(run.accountingApprovedBy) ?? null : null } }));
}
export async function createHumanResourcesTaskForUser(input: { userId: number; organizationId: number; companyId: number; title: string; description?: string; priority: "LOW" | "NORMAL" | "HIGH" | "URGENT"; assigneeUserId?: number; dueDate?: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const company = await db.select({ organizationId: companies.organizationId }).from(companies).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(companies.id, input.companyId), eq(companies.organizationId, input.organizationId), organizationAccessCondition(input.userId))).limit(1);
  if (!company[0]) throw new Error("COMPANY_NOT_FOUND_OR_FORBIDDEN");
  if (input.assigneeUserId) {
    const member = await db.select({ id: organizationMemberships.id }).from(organizationMemberships).where(and(eq(organizationMemberships.organizationId, input.organizationId), eq(organizationMemberships.userId, input.assigneeUserId), eq(organizationMemberships.status, "ACTIVE"))).limit(1);
    if (!member[0]) throw new Error("HR_TASK_ASSIGNEE_NOT_IN_ORGANIZATION");
  }
  const inserted = await db.insert(humanResourcesTasks).values({ organizationId: input.organizationId, companyId: input.companyId, title: input.title.trim(), description: input.description?.trim() || null, priority: input.priority, assigneeUserId: input.assigneeUserId, dueDate: input.dueDate, createdBy: input.userId });
  const taskId = Number(inserted[0].insertId);
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "HR_TASK_CREATED", entityType: "humanResourcesTask", entityId: String(taskId), beforeState: null, afterState: JSON.stringify({ title: input.title.trim(), description: input.description?.trim() || null, priority: input.priority, assigneeUserId: input.assigneeUserId ?? null, dueDate: input.dueDate ?? null }), correlationId: `hr-task:${taskId}:create` });
  const task = await db.select({ task: humanResourcesTasks }).from(humanResourcesTasks).where(eq(humanResourcesTasks.id, taskId)).limit(1);
  return task[0];
}

export async function getHumanResourcesTasksForUserCompany(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ task: humanResourcesTasks, organizationId: companies.organizationId }).from(humanResourcesTasks).innerJoin(companies, eq(humanResourcesTasks.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(humanResourcesTasks.companyId, companyId), or(eq(humanResourcesTasks.status, "PENDING"), eq(humanResourcesTasks.status, "IN_PROGRESS"), eq(humanResourcesTasks.status, "COMPLETED")), organizationAccessCondition(userId))).orderBy(humanResourcesTasks.dueDate);
  const actorIds = Array.from(new Set(rows.flatMap(({ task }) => [task.assigneeUserId, task.createdBy, task.completedBy].filter((id): id is number => Boolean(id)))));
  const actorRows = actorIds.length ? await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, actorIds)) : [];
  const actorById = new Map(actorRows.map((actor) => [actor.id, actor]));
  return rows.map(({ task }) => ({ task, actors: { assignee: task.assigneeUserId ? actorById.get(task.assigneeUserId) ?? null : null, creator: actorById.get(task.createdBy) ?? null, completer: task.completedBy ? actorById.get(task.completedBy) ?? null : null } }));
}
export async function updateHumanResourcesTaskForUser(input: { userId: number; companyId: number; taskId: number; status?: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"; assigneeUserId?: number | null; dueDate?: Date | null; priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT" }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ task: humanResourcesTasks, organizationId: companies.organizationId }).from(humanResourcesTasks).innerJoin(companies, eq(humanResourcesTasks.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(humanResourcesTasks.id, input.taskId), eq(humanResourcesTasks.companyId, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  const row = rows[0];
  if (!row) throw new Error("HR_TASK_NOT_FOUND_OR_FORBIDDEN");
  if (input.assigneeUserId) {
    const member = await db.select({ id: organizationMemberships.id }).from(organizationMemberships).where(and(eq(organizationMemberships.organizationId, row.organizationId), eq(organizationMemberships.userId, input.assigneeUserId), eq(organizationMemberships.status, "ACTIVE"))).limit(1);
    if (!member[0]) throw new Error("HR_TASK_ASSIGNEE_NOT_IN_ORGANIZATION");
  }
  const changes = { ...(input.status !== undefined ? { status: input.status, ...(input.status === "COMPLETED" ? { completedBy: input.userId, completedAt: new Date() } : {}) } : {}), ...(input.assigneeUserId !== undefined ? { assigneeUserId: input.assigneeUserId } : {}), ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}), ...(input.priority !== undefined ? { priority: input.priority } : {}) };
  if (!Object.keys(changes).length) return { task: row.task };
  await db.update(humanResourcesTasks).set(changes).where(eq(humanResourcesTasks.id, input.taskId));
  await appendAuditEventForUser({ organizationId: row.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "HR_TASK_UPDATED", entityType: "humanResourcesTask", entityId: String(input.taskId), beforeState: JSON.stringify(row.task), afterState: JSON.stringify({ ...row.task, ...changes }), correlationId: `hr-task:${input.taskId}:update` });
  const updated = await db.select({ task: humanResourcesTasks }).from(humanResourcesTasks).where(eq(humanResourcesTasks.id, input.taskId)).limit(1);
  return updated[0];
}
export async function updateHumanResourcesTasksPriorityForUser(input: { userId: number; companyId: number; taskIds: number[]; priority: "LOW" | "NORMAL" | "HIGH" | "URGENT" }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const uniqueTaskIds = Array.from(new Set(input.taskIds));
  if (!uniqueTaskIds.length || uniqueTaskIds.length > 100) throw new Error("HR_TASKS_EMPTY_SELECTION");
  const rows = await db.select({ task: humanResourcesTasks, organizationId: companies.organizationId }).from(humanResourcesTasks).innerJoin(companies, eq(humanResourcesTasks.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(inArray(humanResourcesTasks.id, uniqueTaskIds), eq(humanResourcesTasks.companyId, input.companyId), organizationAccessCondition(input.userId)));
  if (rows.length !== uniqueTaskIds.length) throw new Error("HR_TASKS_NOT_FOUND_OR_FORBIDDEN");
  for (const row of rows) {
    await db.update(humanResourcesTasks).set({ priority: input.priority }).where(and(eq(humanResourcesTasks.id, row.task.id), eq(humanResourcesTasks.companyId, input.companyId)));
    await appendAuditEventForUser({ organizationId: row.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "HR_TASK_PRIORITY_UPDATED", entityType: "humanResourcesTask", entityId: String(row.task.id), beforeState: JSON.stringify(row.task), afterState: JSON.stringify({ ...row.task, priority: input.priority }), correlationId: `hr-task:${row.task.id}:bulk-priority` });
  }
  return { updatedCount: rows.length, taskIds: rows.map(({ task }) => task.id), appliedPriority: input.priority, previousStates: rows.map(({ task }) => ({ taskId: task.id, appliedPriority: input.priority, previousPriority: task.priority })) };
}
export async function undoHumanResourcesTasksPriorityForUser(input: { userId: number; companyId: number; changes: Array<{ taskId: number; appliedPriority: "LOW" | "NORMAL" | "HIGH" | "URGENT"; previousPriority: "LOW" | "NORMAL" | "HIGH" | "URGENT" }> }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const uniqueChanges = Array.from(new Map(input.changes.map((change) => [change.taskId, change])).values());
  if (!uniqueChanges.length || uniqueChanges.length > 100) throw new Error("HR_TASKS_EMPTY_SELECTION");
  const taskIds = uniqueChanges.map((change) => change.taskId);
  const rows = await db.select({ task: humanResourcesTasks, organizationId: companies.organizationId }).from(humanResourcesTasks).innerJoin(companies, eq(humanResourcesTasks.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(inArray(humanResourcesTasks.id, taskIds), eq(humanResourcesTasks.companyId, input.companyId), organizationAccessCondition(input.userId)));
  if (rows.length !== uniqueChanges.length) throw new Error("HR_TASKS_NOT_FOUND_OR_FORBIDDEN");
  const changesById = new Map(uniqueChanges.map((change) => [change.taskId, change]));
  for (const row of rows) { const previous = changesById.get(row.task.id)!; if (row.task.priority !== previous.appliedPriority) throw new Error("HR_TASK_PRIORITY_CHANGED_SINCE_BULK_UPDATE"); }
  for (const row of rows) { const previous = changesById.get(row.task.id)!; await db.update(humanResourcesTasks).set({ priority: previous.previousPriority }).where(and(eq(humanResourcesTasks.id, row.task.id), eq(humanResourcesTasks.companyId, input.companyId), eq(humanResourcesTasks.priority, previous.appliedPriority))); await appendAuditEventForUser({ organizationId: row.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "HR_TASK_BULK_PRIORITY_UNDONE", entityType: "humanResourcesTask", entityId: String(row.task.id), beforeState: JSON.stringify(row.task), afterState: JSON.stringify({ ...row.task, priority: previous.previousPriority }), correlationId: `hr-task:${row.task.id}:bulk-priority-undo` }); }
  return { revertedCount: rows.length, taskIds: rows.map(({ task }) => task.id) };
}
export async function updateHumanResourcesTasksDueDateForUser(input: { userId: number; companyId: number; taskIds: number[]; dueDate: Date | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const uniqueTaskIds = Array.from(new Set(input.taskIds));
  if (!uniqueTaskIds.length || uniqueTaskIds.length > 100) throw new Error("HR_TASKS_EMPTY_SELECTION");
  const rows = await db.select({ task: humanResourcesTasks, organizationId: companies.organizationId }).from(humanResourcesTasks).innerJoin(companies, eq(humanResourcesTasks.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(inArray(humanResourcesTasks.id, uniqueTaskIds), eq(humanResourcesTasks.companyId, input.companyId), organizationAccessCondition(input.userId)));
  if (rows.length !== uniqueTaskIds.length) throw new Error("HR_TASKS_NOT_FOUND_OR_FORBIDDEN");
  for (const row of rows) {
    await db.update(humanResourcesTasks).set({ dueDate: input.dueDate }).where(and(eq(humanResourcesTasks.id, row.task.id), eq(humanResourcesTasks.companyId, input.companyId)));
    await appendAuditEventForUser({ organizationId: row.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "HR_TASK_DUE_DATE_UPDATED", entityType: "humanResourcesTask", entityId: String(row.task.id), beforeState: JSON.stringify(row.task), afterState: JSON.stringify({ ...row.task, dueDate: input.dueDate }), correlationId: `hr-task:${row.task.id}:bulk-due-date` });
  }
  return { updatedCount: rows.length, taskIds: rows.map(({ task }) => task.id), appliedDueDate: input.dueDate, previousStates: rows.map(({ task }) => ({ taskId: task.id, appliedDueDate: input.dueDate, previousDueDate: task.dueDate })) };
}
export async function undoHumanResourcesTasksDueDateForUser(input: { userId: number; companyId: number; changes: Array<{ taskId: number; appliedDueDate: Date | null; previousDueDate: Date | null }> }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const uniqueChanges = Array.from(new Map(input.changes.map((change) => [change.taskId, change])).values());
  if (!uniqueChanges.length || uniqueChanges.length > 100) throw new Error("HR_TASKS_EMPTY_SELECTION");
  const taskIds = uniqueChanges.map((change) => change.taskId);
  const rows = await db.select({ task: humanResourcesTasks, organizationId: companies.organizationId }).from(humanResourcesTasks).innerJoin(companies, eq(humanResourcesTasks.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(inArray(humanResourcesTasks.id, taskIds), eq(humanResourcesTasks.companyId, input.companyId), organizationAccessCondition(input.userId)));
  if (rows.length !== uniqueChanges.length) throw new Error("HR_TASKS_NOT_FOUND_OR_FORBIDDEN");
  const changesById = new Map(uniqueChanges.map((change) => [change.taskId, change]));
  for (const row of rows) {
    const previous = changesById.get(row.task.id)!;
    const currentDueDate = row.task.dueDate ? new Date(row.task.dueDate).getTime() : null;
    const appliedDueDate = previous.appliedDueDate ? new Date(previous.appliedDueDate).getTime() : null;
    if (currentDueDate !== appliedDueDate) throw new Error("HR_TASK_DUE_DATE_CHANGED_SINCE_BULK_UPDATE");
  }
  for (const row of rows) {
    const previous = changesById.get(row.task.id)!;
    const currentPredicate = previous.appliedDueDate ? eq(humanResourcesTasks.dueDate, previous.appliedDueDate) : isNull(humanResourcesTasks.dueDate);
    await db.update(humanResourcesTasks).set({ dueDate: previous.previousDueDate }).where(and(eq(humanResourcesTasks.id, row.task.id), eq(humanResourcesTasks.companyId, input.companyId), currentPredicate));
    await appendAuditEventForUser({ organizationId: row.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "HR_TASK_BULK_DUE_DATE_UNDONE", entityType: "humanResourcesTask", entityId: String(row.task.id), beforeState: JSON.stringify(row.task), afterState: JSON.stringify({ ...row.task, dueDate: previous.previousDueDate }), correlationId: `hr-task:${row.task.id}:bulk-due-date-undo` });
  }
  return { revertedCount: rows.length, taskIds: rows.map(({ task }) => task.id) };
}
export async function undoHumanResourcesTaskDueDateForUser(input: { userId: number; companyId: number; taskId: number; appliedDueDate: Date | null; previousDueDate: Date | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ task: humanResourcesTasks, organizationId: companies.organizationId }).from(humanResourcesTasks).innerJoin(companies, eq(humanResourcesTasks.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(humanResourcesTasks.id, input.taskId), eq(humanResourcesTasks.companyId, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  const row = rows[0];
  if (!row) throw new Error("HR_TASK_NOT_FOUND_OR_FORBIDDEN");
  const currentDueDate = row.task.dueDate ? new Date(row.task.dueDate).getTime() : null;
  const appliedDueDate = input.appliedDueDate ? new Date(input.appliedDueDate).getTime() : null;
  if (currentDueDate !== appliedDueDate) throw new Error("HR_TASK_DUE_DATE_CHANGED_SINCE_UPDATE");
  const currentPredicate = input.appliedDueDate ? eq(humanResourcesTasks.dueDate, input.appliedDueDate) : isNull(humanResourcesTasks.dueDate);
  const result = await db.update(humanResourcesTasks).set({ dueDate: input.previousDueDate }).where(and(eq(humanResourcesTasks.id, input.taskId), eq(humanResourcesTasks.companyId, input.companyId), currentPredicate));
  if (!result) throw new Error("HR_TASK_DUE_DATE_UNDO_FAILED");
  await appendAuditEventForUser({ organizationId: row.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "HR_TASK_DUE_DATE_UNDONE", entityType: "humanResourcesTask", entityId: String(input.taskId), beforeState: JSON.stringify(row.task), afterState: JSON.stringify({ ...row.task, dueDate: input.previousDueDate }), correlationId: `hr-task:${input.taskId}:due-date-undo` });
  return { taskId: input.taskId, dueDate: input.previousDueDate };
}
export async function updateHumanResourcesTasksStatusForUser(input: { userId: number; companyId: number; taskIds: number[]; status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const uniqueTaskIds = Array.from(new Set(input.taskIds));
  if (!uniqueTaskIds.length) throw new Error("HR_TASKS_EMPTY_SELECTION");
  const rows = await db.select({ task: humanResourcesTasks, organizationId: companies.organizationId }).from(humanResourcesTasks).innerJoin(companies, eq(humanResourcesTasks.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(inArray(humanResourcesTasks.id, uniqueTaskIds), eq(humanResourcesTasks.companyId, input.companyId), organizationAccessCondition(input.userId)));
  if (rows.length !== uniqueTaskIds.length) throw new Error("HR_TASKS_NOT_FOUND_OR_FORBIDDEN");
  const completedAt = input.status === "COMPLETED" ? new Date() : null;
  for (const row of rows) {
    const changes = input.status === "COMPLETED" ? { status: input.status, completedBy: input.userId, completedAt } : { status: input.status, completedBy: null, completedAt: null };
    await db.update(humanResourcesTasks).set(changes).where(and(eq(humanResourcesTasks.id, row.task.id), eq(humanResourcesTasks.companyId, input.companyId)));
    await appendAuditEventForUser({ organizationId: row.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "HR_TASK_UPDATED", entityType: "humanResourcesTask", entityId: String(row.task.id), beforeState: JSON.stringify(row.task), afterState: JSON.stringify({ ...row.task, ...changes }), correlationId: `hr-task:${row.task.id}:bulk-status` });
  }
    return { updatedCount: rows.length, taskIds: rows.map(({ task }) => task.id), status: input.status, previousStates: rows.map(({ task }) => ({ taskId: task.id, appliedStatus: input.status, previousStatus: task.status, previousCompletedBy: task.completedBy, previousCompletedAt: task.completedAt })) };
}
export async function undoHumanResourcesTasksStatusForUser(input: { userId: number; companyId: number; changes: Array<{ taskId: number; appliedStatus: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"; previousStatus: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"; previousCompletedBy: number | null; previousCompletedAt: Date | null }> }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const uniqueChanges = Array.from(new Map(input.changes.map((change) => [change.taskId, change])).values());
  if (!uniqueChanges.length || uniqueChanges.length > 100) throw new Error("HR_TASKS_EMPTY_SELECTION");
  const taskIds = uniqueChanges.map((change) => change.taskId);
  const rows = await db.select({ task: humanResourcesTasks, organizationId: companies.organizationId }).from(humanResourcesTasks).innerJoin(companies, eq(humanResourcesTasks.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(inArray(humanResourcesTasks.id, taskIds), eq(humanResourcesTasks.companyId, input.companyId), organizationAccessCondition(input.userId)));
  if (rows.length !== uniqueChanges.length) throw new Error("HR_TASKS_NOT_FOUND_OR_FORBIDDEN");
  const changesById = new Map(uniqueChanges.map((change) => [change.taskId, change]));
  if (rows.some(({ task }) => task.status !== changesById.get(task.id)?.appliedStatus)) throw new Error("HR_TASKS_CHANGED_SINCE_BULK_UPDATE");
  for (const row of rows) {
    const previous = changesById.get(row.task.id)!;
    await db.update(humanResourcesTasks).set({ status: previous.previousStatus, completedBy: previous.previousCompletedBy, completedAt: previous.previousCompletedAt }).where(and(eq(humanResourcesTasks.id, row.task.id), eq(humanResourcesTasks.companyId, input.companyId), eq(humanResourcesTasks.status, previous.appliedStatus)));
    await appendAuditEventForUser({ organizationId: row.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "HR_TASK_BULK_UNDONE", entityType: "humanResourcesTask", entityId: String(row.task.id), beforeState: JSON.stringify(row.task), afterState: JSON.stringify({ ...row.task, status: previous.previousStatus, completedBy: previous.previousCompletedBy, completedAt: previous.previousCompletedAt }), correlationId: `hr-task:${row.task.id}:bulk-undo` });
  }
  return { revertedCount: rows.length, taskIds: rows.map(({ task }) => task.id) };
}
async function getPayrollRunForUser(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, userId: number, companyId: number, runId: number) {
  const rows = await db.select({ run: payrollRuns }).from(payrollRuns).where(and(eq(payrollRuns.id, runId), eq(payrollRuns.companyId, companyId), organizationAccessCondition(userId))).limit(1);
  const run = rows[0]?.run;
  if (!run) throw new Error("PAYROLL_RUN_NOT_FOUND_OR_FORBIDDEN");
  return run;
}
export async function approvePayrollRunForUser(input: { userId: number; companyId: number; runId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const run = await getPayrollRunForUser(db, input.userId, input.companyId, input.runId);
  if (run.status !== "CALCULATED") throw new Error("PAYROLL_RUN_NOT_READY_FOR_APPROVAL");
  const reviewedAt = new Date();
  await db.update(payrollRuns).set({ status: "APPROVED", approvedBy: input.userId, approvedAt: reviewedAt, reviewedBy: input.userId, reviewedAt, reviewNotes: "Conferência realizada no posto RH antes da aprovação." }).where(eq(payrollRuns.id, input.runId));
  await db.update(humanResourcesTasks).set({ status: "COMPLETED", completedBy: input.userId, completedAt: reviewedAt }).where(and(eq(humanResourcesTasks.payrollRunId, input.runId), eq(humanResourcesTasks.status, "PENDING")));
  await appendAuditEventForUser({ organizationId: run.organizationId, companyId: run.companyId, actorUserId: input.userId, action: "PAYROLL_RUN_APPROVED", entityType: "payrollRun", entityId: String(run.id), beforeState: JSON.stringify(run), afterState: JSON.stringify({ ...run, status: "APPROVED", approvedBy: input.userId }), correlationId: `payroll-run:${run.id}:approve` });
  return db.select({ run: payrollRuns }).from(payrollRuns).where(eq(payrollRuns.id, input.runId)).limit(1);
}
export async function closePayrollRunForUser(input: { userId: number; companyId: number; runId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const run = await getPayrollRunForUser(db, input.userId, input.companyId, input.runId);
  if (run.status !== "APPROVED") throw new Error("PAYROLL_RUN_NOT_APPROVED");
  const closedAt = new Date();
  await db.update(payrollRuns).set({ status: "POSTED", closedBy: input.userId, closedAt, accountingLinkStatus: "PREPARED", accountingPreparedBy: input.userId, accountingPreparedAt: closedAt, accountingReference: `FOLHA-${input.runId}` }).where(eq(payrollRuns.id, input.runId));
  await db.update(humanResourcesTasks).set({ status: "COMPLETED", completedBy: input.userId, completedAt: closedAt }).where(and(eq(humanResourcesTasks.payrollRunId, input.runId), eq(humanResourcesTasks.status, "PENDING")));
  await db.insert(humanResourcesTasks).values({ organizationId: run.organizationId, companyId: run.companyId, payrollRunId: input.runId, title: `Folha ${String(run.month).padStart(2, "0")}/${run.year} pronta para lançamento contabilístico`, dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), createdBy: input.userId });
  await appendAuditEventForUser({ organizationId: run.organizationId, companyId: run.companyId, actorUserId: input.userId, action: "PAYROLL_RUN_CLOSED", entityType: "payrollRun", entityId: String(run.id), beforeState: JSON.stringify(run), afterState: JSON.stringify({ ...run, status: "POSTED", accountingLinkStatus: "PREPARED", closedBy: input.userId }), correlationId: `payroll-run:${run.id}:close` });
  return db.select({ run: payrollRuns }).from(payrollRuns).where(eq(payrollRuns.id, input.runId)).limit(1);
}
export async function approvePayrollAccountingPreparationForUser(input: { userId: number; companyId: number; runId: number; accountingReference: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const run = await getPayrollRunForUser(db, input.userId, input.companyId, input.runId);
  if (run.status !== "POSTED" || run.accountingLinkStatus !== "PREPARED" || !run.accountingPreparedBy) throw new Error("PAYROLL_ACCOUNTING_NOT_READY");
  assertSecondApprover(run.accountingPreparedBy, input.userId);
  const approvedAt = new Date();
  await db.update(payrollRuns).set({ accountingApprovedBy: input.userId, accountingApprovedAt: approvedAt, accountingReference: input.accountingReference.trim() }).where(eq(payrollRuns.id, input.runId));
  await appendAuditEventForUser({ organizationId: run.organizationId, companyId: run.companyId, actorUserId: input.userId, action: "PAYROLL_ACCOUNTING_PREPARATION_APPROVED", entityType: "payrollRun", entityId: String(run.id), beforeState: JSON.stringify(run), afterState: JSON.stringify({ ...run, accountingApprovedBy: input.userId, accountingApprovedAt: approvedAt, accountingReference: input.accountingReference.trim() }), correlationId: `payroll-run:${run.id}:accounting-approve` });
  return db.select({ run: payrollRuns }).from(payrollRuns).where(eq(payrollRuns.id, input.runId)).limit(1);
}
export async function postPayrollJournalForUser(input: { userId: number; companyId: number; runId: number; idempotencyKey: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const run = await getPayrollRunForUser(db, input.userId, input.companyId, input.runId);
  if (run.status !== "POSTED" || run.accountingLinkStatus !== "PREPARED" || !run.accountingApprovedBy) throw new Error("PAYROLL_ACCOUNTING_APPROVAL_REQUIRED");
  const rule = await db.select({ ruleSet: payrollRuleSets }).from(payrollRuleSets).where(and(eq(payrollRuleSets.id, run.ruleSetId), eq(payrollRuleSets.companyId, input.companyId))).limit(1);
  const configuredCodes = [rule[0]?.ruleSet.salaryAccountCode, rule[0]?.ruleSet.socialExpenseAccountCode, rule[0]?.ruleSet.socialPayableAccountCode, rule[0]?.ruleSet.irtPayableAccountCode, rule[0]?.ruleSet.netPayableAccountCode];
  if (!rule[0] || configuredCodes.some((code) => !code?.trim()) || new Set(configuredCodes).size !== configuredCodes.length) throw new Error("PAYROLL_ACCOUNTS_INCOMPLETE");
  const accounts = await db.select().from(chartAccounts).where(eq(chartAccounts.companyId, input.companyId));
  const accountByCode = new Map(accounts.map((account) => [account.code, account]));
  const selectedAccounts = configuredCodes.map((code) => accountByCode.get(code!));
  if (selectedAccounts.some((account) => !account || account.postable !== 1)) throw new Error("PAYROLL_ACCOUNT_NOT_POSTABLE");
  const period = await db.select({ period: fiscalPeriods }).from(fiscalPeriods).where(and(eq(fiscalPeriods.companyId, input.companyId), eq(fiscalPeriods.year, run.year), eq(fiscalPeriods.month, run.month))).limit(1);
  if (!period[0]) throw new Error("PAYROLL_FISCAL_PERIOD_NOT_FOUND");
  const [salaryAccount, socialExpenseAccount, socialPayableAccount, irtPayableAccount, netPayableAccount] = selectedAccounts;
  const lines = [
    { accountId: salaryAccount!.id, debit: Number(run.grossTotal), credit: 0, postable: true, validFrom: new Date() },
    { accountId: socialExpenseAccount!.id, debit: Number(run.socialEmployerTotal), credit: 0, postable: true, validFrom: new Date() },
    { accountId: socialPayableAccount!.id, debit: 0, credit: Number(run.socialEmployeeTotal) + Number(run.socialEmployerTotal), postable: true, validFrom: new Date() },
    { accountId: irtPayableAccount!.id, debit: 0, credit: Number(run.irtTotal), postable: true, validFrom: new Date() },
    { accountId: netPayableAccount!.id, debit: 0, credit: Number(run.netTotal), postable: true, validFrom: new Date() },
  ].filter((line) => line.debit > 0 || line.credit > 0);
  const entry = await postJournalEntry({ companyId: input.companyId, periodId: period[0].period.id, idempotencyKey: input.idempotencyKey, description: `Processamento salarial ${String(run.month).padStart(2, "0")}/${run.year}`, documentReference: run.accountingReference ?? `FOLHA-${run.id}`, journalCode: "SALARIOS", reviewRequired: true, createdBy: input.userId, lines });
  await db.update(payrollRuns).set({ accountingLinkStatus: "POSTED", accountingReference: `DIARIO-${entry.entryId ?? entry.entry?.id}` }).where(eq(payrollRuns.id, input.runId));
  await appendAuditEventForUser({ organizationId: run.organizationId, companyId: run.companyId, actorUserId: input.userId, action: "PAYROLL_ACCOUNTING_JOURNAL_CREATED", entityType: "payrollRun", entityId: String(run.id), beforeState: JSON.stringify(run), afterState: JSON.stringify({ accountingLinkStatus: "POSTED", entryId: entry.entryId ?? entry.entry?.id }), correlationId: input.idempotencyKey });
  return { ...entry, payrollRunId: run.id };
}
export async function getPayrollJournalForUserRun(input: { userId: number; companyId: number; runId: number }) {
  const db = await getDb();
  if (!db) return [];
  const run = await getPayrollRunForUser(db, input.userId, input.companyId, input.runId);
  const entryId = run.accountingReference?.startsWith("DIARIO-") ? Number(run.accountingReference.slice(7)) : 0;
  if (!entryId) return [];
  return db.select({ entry: journalEntries, line: journalLines, account: chartAccounts }).from(journalEntries).innerJoin(journalLines, eq(journalLines.entryId, journalEntries.id)).innerJoin(chartAccounts, eq(chartAccounts.id, journalLines.accountId)).where(and(eq(journalEntries.id, entryId), eq(journalEntries.companyId, input.companyId), organizationAccessCondition(input.userId))).orderBy(journalLines.id);
}
export async function getPayrollItemsForUserRun(userId: number, companyId: number, runId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ item: payrollItems, employee: employees, contract: employmentContracts }).from(payrollItems).innerJoin(employees, eq(payrollItems.employeeId, employees.id)).innerJoin(employmentContracts, eq(payrollItems.contractId, employmentContracts.id)).innerJoin(payrollRuns, eq(payrollItems.runId, payrollRuns.id)).where(and(eq(payrollItems.companyId, companyId), eq(payrollItems.runId, runId), eq(payrollRuns.companyId, companyId), organizationAccessCondition(userId)));
}

export async function calculatePayrollRunForUser(input: { userId: number; organizationId: number; companyId: number; ruleSetId: number; year: number; month: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertCompanyReady(db, input.userId, input.companyId);
  if (input.month < 1 || input.month > 12) throw new Error("PAYROLL_MONTH_INVALID");
  const ruleRows = await db.select({ ruleSet: payrollRuleSets }).from(payrollRuleSets).where(and(eq(payrollRuleSets.id, input.ruleSetId), eq(payrollRuleSets.companyId, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  const rule = ruleRows[0]?.ruleSet;
  if (!rule) throw new Error("PAYROLL_RULE_SET_NOT_FOUND_OR_FORBIDDEN");
  const brackets = parseIrtBrackets(rule.irtBrackets);
  const contractRows = await db.select({ contract: employmentContracts, employee: employees }).from(employmentContracts).innerJoin(employees, eq(employmentContracts.employeeId, employees.id)).where(and(eq(employmentContracts.companyId, input.companyId), eq(employmentContracts.status, "ACTIVE"), eq(employees.status, "ACTIVE"), organizationAccessCondition(input.userId)));
  if (!contractRows.length) throw new Error("NO_ACTIVE_CONTRACTS");
  const runResult = await db.insert(payrollRuns).values({ organizationId: input.organizationId, companyId: input.companyId, ruleSetId: input.ruleSetId, year: input.year, month: input.month, status: "CALCULATED", createdBy: input.userId }).$returningId();
  const runId = runResult[0]?.id;
  if (!runId) throw new Error("PAYROLL_RUN_CREATE_FAILED");
  let grossTotal = 0; let socialEmployeeTotal = 0; let irtTotal = 0; let socialEmployerTotal = 0; let netTotal = 0;
  for (const row of contractRows) {
    const calculated = calculatePayrollAmounts({ grossAmount: Number(row.contract.baseSalary), socialEmployeeRate: Number(rule.socialEmployeeRate), socialEmployerRate: Number(rule.socialEmployerRate), irtBrackets: brackets });
    grossTotal += calculated.grossAmount; socialEmployeeTotal += calculated.socialEmployeeAmount; irtTotal += calculated.irtAmount; socialEmployerTotal += calculated.socialEmployerAmount; netTotal += calculated.netAmount;
    await db.insert(payrollItems).values({ organizationId: input.organizationId, companyId: input.companyId, runId, employeeId: row.employee.id, contractId: row.contract.id, grossAmount: String(calculated.grossAmount), socialEmployeeAmount: String(calculated.socialEmployeeAmount), irtAmount: String(calculated.irtAmount), socialEmployerAmount: String(calculated.socialEmployerAmount), netAmount: String(calculated.netAmount), breakdown: JSON.stringify({ taxableAmount: calculated.taxableAmount, ruleSetId: rule.id, ruleVersion: rule.version }) });
  }
  await db.update(payrollRuns).set({ grossTotal: String(grossTotal), socialEmployeeTotal: String(socialEmployeeTotal), irtTotal: String(irtTotal), socialEmployerTotal: String(socialEmployerTotal), netTotal: String(netTotal) }).where(eq(payrollRuns.id, runId));
  const approvalDueDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
  await db.insert(humanResourcesTasks).values({ organizationId: input.organizationId, companyId: input.companyId, payrollRunId: runId, title: `Folha ${String(input.month).padStart(2, "0")}/${input.year} requer aprovação`, dueDate: approvalDueDate, createdBy: input.userId });
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "PAYROLL_RUN_CALCULATED", entityType: "payrollRun", entityId: String(runId), beforeState: null, afterState: JSON.stringify({ year: input.year, month: input.month, status: "CALCULATED", employees: contractRows.length, grossTotal, netTotal, ruleVersion: rule.version }), correlationId: `payroll-run:${runId}` });
  return db.select({ run: payrollRuns, ruleSet: payrollRuleSets }).from(payrollRuns).innerJoin(payrollRuleSets, eq(payrollRuns.ruleSetId, payrollRuleSets.id)).where(eq(payrollRuns.id, runId)).limit(1);
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
  const organization = await db.select({ id: organizations.id }).from(organizations).where(organizationAccessCondition(input.userId)).limit(1);
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
  const created = await db.select({ company: companies, organization: organizations }).from(companies).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(companies.id, Number(result[0].insertId)), organizationAccessCondition(input.userId))).limit(1);
  return created[0];
}

export async function updateCompanyForUser(input: { userId: number; companyId: number; name?: string; functionalCurrency?: string; ivaRegime?: "GERAL" | "SIMPLIFICADO" | "EXCLUSAO"; legalForm?: string; address?: string; municipality?: string; province?: string; phone?: string; email?: string; activity?: string; incorporationYear?: number; legalRepresentatives?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const currentRows = await db.select({ company: companies, organization: organizations }).from(companies).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(companies.id, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  const current = currentRows[0];
  if (!current) throw new Error("COMPANY_NOT_FOUND_OR_FORBIDDEN");
  const patch = Object.fromEntries(Object.entries(input).filter(([key, value]) => key !== "userId" && key !== "companyId" && value !== undefined && value !== ""));
  if (!Object.keys(patch).length) throw new Error("COMPANY_UPDATE_EMPTY");
  await db.update(companies).set(patch).where(eq(companies.id, input.companyId));
  await appendAuditEventForUser({ organizationId: current.organization.id, companyId: input.companyId, actorUserId: input.userId, action: "COMPANY_UPDATED", entityType: "company", entityId: String(input.companyId), beforeState: JSON.stringify(current.company), afterState: JSON.stringify(patch), correlationId: `company:${input.companyId}:update` });
  const updated = await db.select({ company: companies, organization: organizations }).from(companies).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(companies.id, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  return updated[0];
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
  const companyContext = await db.select({ company: companies, organization: organizations }).from(companies).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(companies.id, input.companyId), organizationAccessCondition(input.userId))).limit(1);
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
  const rows = await db.select({ company: companies, organization: organizations }).from(companies).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(companies.id, companyId), organizationAccessCondition(userId))).limit(1);
  if (!rows[0]) throw new Error("COMPANY_NOT_FOUND_OR_FORBIDDEN");
  assertReadyConfiguration(rows[0].company.configurationStatus);
  return rows[0];
}

export async function getExercisesForUserCompany(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ exercise: fiscalExercises }).from(fiscalExercises).innerJoin(companies, eq(fiscalExercises.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(fiscalExercises.companyId, companyId), organizationAccessCondition(userId))).orderBy(desc(fiscalExercises.year));
}

export async function closeFiscalPeriodForUser(input: { userId: number; organizationId: number; companyId: number; periodId: number; correlationId: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ period: fiscalPeriods, company: companies, organization: organizations }).from(fiscalPeriods).innerJoin(companies, eq(fiscalPeriods.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(fiscalPeriods.id, input.periodId), eq(fiscalPeriods.companyId, input.companyId), eq(companies.organizationId, input.organizationId), organizationAccessCondition(input.userId))).limit(1);
  const current = rows[0];
  if (!current) throw new Error("FISCAL_PERIOD_NOT_FOUND_OR_FORBIDDEN");
  if (current.period.status === "CLOSED") throw new Error("FISCAL_PERIOD_ALREADY_CLOSED");
  const pendingEntries = await db.select({ id: journalEntries.id }).from(journalEntries).where(and(eq(journalEntries.companyId, input.companyId), eq(journalEntries.periodId, input.periodId), eq(journalEntries.reviewStatus, "PENDING"))).limit(1);
  if (pendingEntries[0]) throw new Error("PERIOD_HAS_PENDING_JOURNAL_REVIEWS");
  const unreconciled = await db.select({ id: treasuryTransactions.id }).from(treasuryTransactions).where(and(eq(treasuryTransactions.companyId, input.companyId), eq(treasuryTransactions.periodId, input.periodId), eq(treasuryTransactions.reconciliationStatus, "UNRECONCILED"))).limit(1);
  if (unreconciled[0]) throw new Error("PERIOD_HAS_UNRECONCILED_TREASURY_TRANSACTIONS");
  await db.update(fiscalPeriods).set({ status: "CLOSED", closedAt: new Date() }).where(and(eq(fiscalPeriods.id, input.periodId), eq(fiscalPeriods.companyId, input.companyId)));
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "FISCAL_PERIOD_CLOSED", entityType: "fiscalPeriod", entityId: String(input.periodId), beforeState: JSON.stringify({ status: current.period.status }), afterState: JSON.stringify({ status: "CLOSED" }), correlationId: input.correlationId });
  return { periodId: input.periodId, from: current.period.status, to: "CLOSED" as const, audited: true };
}

export async function reopenFiscalPeriodForUser(input: { userId: number; organizationId: number; companyId: number; periodId: number; reason: string; correlationId: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ period: fiscalPeriods, company: companies, organization: organizations }).from(fiscalPeriods).innerJoin(companies, eq(fiscalPeriods.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(fiscalPeriods.id, input.periodId), eq(fiscalPeriods.companyId, input.companyId), eq(companies.organizationId, input.organizationId), organizationAccessCondition(input.userId))).limit(1);
  const current = rows[0];
  if (!current) throw new Error("FISCAL_PERIOD_NOT_FOUND_OR_FORBIDDEN");
  if (current.period.status !== "CLOSED") throw new Error("FISCAL_PERIOD_NOT_CLOSED");
  await db.update(fiscalPeriods).set({ status: "REOPENED", closedAt: null }).where(and(eq(fiscalPeriods.id, input.periodId), eq(fiscalPeriods.companyId, input.companyId)));
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "FISCAL_PERIOD_REOPENED", entityType: "fiscalPeriod", entityId: String(input.periodId), beforeState: JSON.stringify({ status: current.period.status }), afterState: JSON.stringify({ status: "REOPENED", reason: input.reason }), correlationId: input.correlationId });
  return { periodId: input.periodId, from: current.period.status, to: "REOPENED" as const, reason: input.reason, audited: true };
}

export async function getPeriodsForUserCompany(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ period: fiscalPeriods }).from(fiscalPeriods).innerJoin(companies, eq(fiscalPeriods.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(organizationAccessCondition(userId), eq(companies.id, companyId))).orderBy(desc(fiscalPeriods.year), desc(fiscalPeriods.month));
}

export async function getFiscalRegisterForUserCompany(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) return buildFiscalRegister([]);
  const rows = await db.select({ document: businessDocuments }).from(businessDocuments).innerJoin(companies, eq(businessDocuments.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(businessDocuments.companyId, companyId), organizationAccessCondition(userId), isNull(businessDocuments.archivedAt), sql`${businessDocuments.status} <> 'CANCELLED'`)).orderBy(businessDocuments.issuedAt, businessDocuments.id);
  return buildFiscalRegister(rows.map(({ document }) => ({ documentId: document.id, documentNumber: document.documentNumber, issueDate: document.issuedAt ?? document.createdAt, customerNif: null, status: document.status, ivaRegime: document.ivaRegime, netAmount: Number(document.netAmount), taxAmount: Number(document.taxAmount), totalAmount: Number(document.totalAmount) })));
}

export async function getDocumentsForUserCompany(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ document: businessDocuments }).from(businessDocuments).innerJoin(companies, eq(businessDocuments.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(organizationAccessCondition(userId), eq(companies.id, companyId), isNull(businessDocuments.archivedAt))).orderBy(desc(businessDocuments.createdAt));
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
  const period = await db.select({ id: fiscalPeriods.id }).from(fiscalPeriods).innerJoin(companies, eq(fiscalPeriods.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(fiscalPeriods.id, input.periodId), eq(fiscalPeriods.companyId, input.companyId), organizationAccessCondition(input.actorUserId))).limit(1);
  if (!period[0]) throw new Error("FISCAL_PERIOD_NOT_FOUND_OR_FORBIDDEN");
  return true as const;
}

export async function assertClosedFiscalPeriodForUserCompany(input: { actorUserId: number; companyId: number; periodId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const period = await db.select({ id: fiscalPeriods.id, status: fiscalPeriods.status }).from(fiscalPeriods).innerJoin(companies, eq(fiscalPeriods.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(fiscalPeriods.id, input.periodId), eq(fiscalPeriods.companyId, input.companyId), eq(fiscalPeriods.status, "CLOSED"), organizationAccessCondition(input.actorUserId))).limit(1);
  if (!period[0]) throw new Error("FISCAL_PERIOD_NOT_CLOSED_OR_FORBIDDEN");
  return true as const;
}

export async function assertAuditScopeForUser(input: { actorUserId: number; organizationId: number; companyId?: number | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  if (input.companyId !== null && input.companyId !== undefined) {
    const scope = await db.select({ organizationId: organizations.id }).from(companies).innerJoin(organizations, eq(companies.organizationId, organizations.id)).leftJoin(organizationMemberships, eq(organizationMemberships.organizationId, organizations.id)).where(and(eq(companies.id, input.companyId), eq(organizations.id, input.organizationId), or(organizationAccessCondition(input.actorUserId), and(eq(organizationMemberships.userId, input.actorUserId), eq(organizationMemberships.status, "ACTIVE"))))).limit(1);
    if (!scope[0]) throw new Error("AUDIT_SCOPE_FORBIDDEN");
  } else {
    const scope = await db.select({ id: organizations.id }).from(organizations).leftJoin(organizationMemberships, eq(organizationMemberships.organizationId, organizations.id)).where(and(eq(organizations.id, input.organizationId), or(organizationAccessCondition(input.actorUserId), and(eq(organizationMemberships.userId, input.actorUserId), eq(organizationMemberships.status, "ACTIVE"))))).limit(1);
    if (!scope[0]) throw new Error("AUDIT_SCOPE_FORBIDDEN");
  }
  return true as const;
}

export async function appendAuditEventForUser(input: Omit<typeof auditEvents.$inferInsert, "actorUserId"> & { actorUserId: number }) {
  await assertAuditScopeForUser({ actorUserId: input.actorUserId, organizationId: input.organizationId, companyId: input.companyId });
  return appendAuditEvent(input);
}

export async function getAuditEventsForUserCompany(userId: number, companyId: number, entityType?: string, entityId?: string, action?: string, actorUserId?: number, from?: Date, to?: Date) {
  const db = await getDb();
  if (!db) return [];
  const filters = [eq(auditEvents.companyId, companyId), organizationAccessCondition(userId)];
  if (entityType) filters.push(eq(auditEvents.entityType, entityType));
  if (entityId) filters.push(eq(auditEvents.entityId, entityId));
  if (action) filters.push(eq(auditEvents.action, action));
  if (actorUserId) filters.push(eq(auditEvents.actorUserId, actorUserId));
  if (from) filters.push(gte(auditEvents.createdAt, from));
  if (to) filters.push(lte(auditEvents.createdAt, to));
  return db.select({ event: auditEvents }).from(auditEvents).innerJoin(organizations, eq(auditEvents.organizationId, organizations.id)).where(and(...filters)).orderBy(desc(auditEvents.id));
}

type StockCountLineInput = { productCode: string; expectedQuantity: number; countedQuantity: number; unitCost: number };

export async function createStockCountForUser(input: { userId: number; organizationId: number; companyId: number; periodId: number; warehouseId?: number; reference: string; countDate: Date; notes?: string; items: StockCountLineInput[] }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertCompanyReady(db, input.userId, input.companyId);
  await assertFiscalPeriodForUserCompany({ actorUserId: input.userId, companyId: input.companyId, periodId: input.periodId });
  if (!input.items.length) throw new Error("STOCK_COUNT_ITEMS_REQUIRED");
  const uniqueCodes = new Set(input.items.map((item) => item.productCode.trim().toUpperCase()));
  if (uniqueCodes.size !== input.items.length) throw new Error("STOCK_COUNT_DUPLICATE_PRODUCT");
  if (input.warehouseId) {
    const warehouse = await db.select({ id: warehouses.id }).from(warehouses).where(and(eq(warehouses.id, input.warehouseId), eq(warehouses.companyId, input.companyId), eq(warehouses.active, 1))).limit(1);
    if (!warehouse[0]) throw new Error("WAREHOUSE_NOT_FOUND_OR_FORBIDDEN");
  }
  const normalized = input.items.map((item) => validateStockCountLine(item));
  const result = await db.transaction(async (tx) => {
    const inserted = await tx.insert(stockCounts).values({ organizationId: input.organizationId, companyId: input.companyId, periodId: input.periodId, warehouseId: input.warehouseId, reference: input.reference.trim(), countDate: input.countDate, notes: input.notes?.trim() || undefined, createdBy: input.userId });
    const countId = Number(inserted[0].insertId);
    for (const item of normalized) await tx.insert(stockCountItems).values({ organizationId: input.organizationId, companyId: input.companyId, countId, productCode: item.productCode, expectedQuantity: item.expectedQuantity.toFixed(4), countedQuantity: item.countedQuantity.toFixed(4), unitCost: item.unitCost.toFixed(4) });
    return countId;
  });
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "STOCK_COUNT_CREATED", entityType: "stockCount", entityId: String(result), beforeState: null, afterState: JSON.stringify({ reference: input.reference, warehouseId: input.warehouseId ?? null, itemCount: normalized.length }), correlationId: `stock-count:${result}` });
  return { id: result, status: "DRAFT" as const, reference: input.reference.trim() };
}

export async function listStockCountsForUserCompany(input: { userId: number; companyId: number }) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ count: stockCounts, organization: organizations }).from(stockCounts).innerJoin(organizations, eq(stockCounts.organizationId, organizations.id)).where(and(eq(stockCounts.companyId, input.companyId), organizationAccessCondition(input.userId))).orderBy(desc(stockCounts.id));
  return Promise.all(rows.map(async ({ count }) => ({ count, items: await db.select({ item: stockCountItems }).from(stockCountItems).where(and(eq(stockCountItems.countId, count.id), eq(stockCountItems.companyId, input.companyId))).orderBy(stockCountItems.productCode) })));
}

export async function reviewStockCountForUser(input: { userId: number; companyId: number; countId: number; decision: "VALIDATED" | "CANCELLED" }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ count: stockCounts, organization: organizations }).from(stockCounts).innerJoin(organizations, eq(stockCounts.organizationId, organizations.id)).where(and(eq(stockCounts.id, input.countId), eq(stockCounts.companyId, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  const current = rows[0];
  if (!current || current.count.status !== "DRAFT") throw new Error("STOCK_COUNT_NOT_DRAFT_OR_FORBIDDEN");
  await db.update(stockCounts).set({ status: input.decision, validatedBy: input.decision === "VALIDATED" ? input.userId : undefined }).where(eq(stockCounts.id, input.countId));
  await appendAuditEventForUser({ organizationId: current.count.organizationId, companyId: input.companyId, actorUserId: input.userId, action: `STOCK_COUNT_${input.decision}`, entityType: "stockCount", entityId: String(input.countId), beforeState: JSON.stringify({ status: current.count.status }), afterState: JSON.stringify({ status: input.decision }), correlationId: `stock-count:${input.countId}:${input.decision}` });
  return { id: input.countId, status: input.decision };
}

export async function applyStockCountForUser(input: { userId: number; companyId: number; countId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ count: stockCounts, organization: organizations }).from(stockCounts).innerJoin(organizations, eq(stockCounts.organizationId, organizations.id)).where(and(eq(stockCounts.id, input.countId), eq(stockCounts.companyId, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  const current = rows[0];
  if (!current || current.count.status !== "VALIDATED") throw new Error("STOCK_COUNT_NOT_VALIDATED_OR_FORBIDDEN");
  await assertFiscalPeriodForUserCompany({ actorUserId: input.userId, companyId: input.companyId, periodId: current.count.periodId });
  const items = await db.select({ item: stockCountItems }).from(stockCountItems).where(and(eq(stockCountItems.countId, input.countId), eq(stockCountItems.companyId, input.companyId)));
  const adjustments = items.map(({ item }) => ({ item, difference: Number(item.countedQuantity) - Number(item.expectedQuantity) })).filter(({ difference }) => Math.abs(difference) > 0.0000001);
  const result = await db.transaction(async (tx) => {
    const movementIds: Array<{ itemId: number; movementId: number }> = [];
    for (const adjustment of adjustments) {
      const movement = await tx.insert(stockMovements).values({ organizationId: current.count.organizationId, companyId: input.companyId, periodId: current.count.periodId, warehouseId: current.count.warehouseId, productCode: adjustment.item.productCode, type: adjustment.difference > 0 ? "IN" : "OUT", quantity: Math.abs(adjustment.difference).toFixed(4), unitCost: adjustment.item.unitCost, sourceDocumentId: undefined, correlationId: `stock-count:${input.countId}:${adjustment.item.id}` });
      const movementId = Number(movement[0].insertId);
      await tx.update(stockCountItems).set({ adjustmentMovementId: movementId }).where(eq(stockCountItems.id, adjustment.item.id));
      movementIds.push({ itemId: adjustment.item.id, movementId });
    }
    await tx.update(stockCounts).set({ status: "APPLIED", appliedAt: new Date() }).where(eq(stockCounts.id, input.countId));
    return movementIds;
  });
  await appendAuditEventForUser({ organizationId: current.count.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "STOCK_COUNT_APPLIED", entityType: "stockCount", entityId: String(input.countId), beforeState: JSON.stringify({ status: current.count.status }), afterState: JSON.stringify({ status: "APPLIED", adjustmentCount: result.length }), correlationId: `stock-count:${input.countId}:apply` });
  return { id: input.countId, status: "APPLIED" as const, adjustments: result };
}

export async function getStockBalancesForUserCompany(input: { userId: number; companyId: number }) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ movement: stockMovements, warehouse: warehouses }).from(stockMovements).leftJoin(warehouses, eq(stockMovements.warehouseId, warehouses.id)).innerJoin(companies, eq(stockMovements.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(stockMovements.companyId, input.companyId), organizationAccessCondition(input.userId)));
  const balances = new Map<string, { warehouseId: number | null; warehouseCode: string; warehouseName: string; productCode: string; quantity: number; value: number }>();
  for (const row of rows) {
    const key = `${row.movement.warehouseId ?? "geral"}:${row.movement.productCode}`;
    const current = balances.get(key) ?? { warehouseId: row.movement.warehouseId ?? null, warehouseCode: row.warehouse?.code ?? "GERAL", warehouseName: row.warehouse?.name ?? "Armazém geral", productCode: row.movement.productCode, quantity: 0, value: 0 };
    const sign = row.movement.type === "IN" ? 1 : -1;
    current.quantity += sign * Number(row.movement.quantity);
    current.value += sign * Number(row.movement.quantity) * Number(row.movement.unitCost);
    balances.set(key, current);
  }
  return Array.from(balances.values()).sort((a, b) => `${a.warehouseCode}:${a.productCode}`.localeCompare(`${b.warehouseCode}:${b.productCode}`));
}
export async function getWarehousesForUserCompany(input: { userId: number; companyId: number }) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ warehouse: warehouses }).from(warehouses).innerJoin(companies, eq(warehouses.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(warehouses.companyId, input.companyId), eq(warehouses.active, 1), organizationAccessCondition(input.userId))).orderBy(warehouses.code);
}
export async function createWarehouseForUser(input: { userId: number; organizationId: number; companyId: number; code: string; name: string; address?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertCompanyReady(db, input.userId, input.companyId);
  await assertAuditScopeForUser({ actorUserId: input.userId, organizationId: input.organizationId, companyId: input.companyId });
  const code = normalizeWarehouseCode(input.code);
  const name = input.name.trim();
  if (!code || !name) throw new Error("WAREHOUSE_DATA_REQUIRED");
  const existing = await db.select({ id: warehouses.id }).from(warehouses).where(and(eq(warehouses.companyId, input.companyId), eq(warehouses.code, code))).limit(1);
  if (existing[0]) throw new Error("WAREHOUSE_CODE_ALREADY_EXISTS");
  const inserted = await db.insert(warehouses).values({ organizationId: input.organizationId, companyId: input.companyId, code, name, address: input.address?.trim() || null, createdBy: input.userId, active: 1 });
  const id = Number(inserted[0].insertId);
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "WAREHOUSE_CREATED", entityType: "warehouse", entityId: String(id), beforeState: null, afterState: JSON.stringify({ id, code, name, address: input.address?.trim() || null }), correlationId: `warehouse:${id}` });
  return { id, code, name, address: input.address?.trim() || null, active: 1 };
}
export async function reconcileStockForUserCompany(input: { userId: number; companyId: number; inventoryAccountId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const movements = await db.select({ movement: stockMovements }).from(stockMovements).innerJoin(companies, eq(stockMovements.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(stockMovements.companyId, input.companyId), organizationAccessCondition(input.userId)));
  const ledger = await db.select({ line: journalLines }).from(journalLines).innerJoin(journalEntries, eq(journalLines.entryId, journalEntries.id)).innerJoin(companies, eq(journalEntries.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(journalEntries.companyId, input.companyId), eq(journalLines.accountId, input.inventoryAccountId), organizationAccessCondition(input.userId)));
  const normalized = movements.map(({ movement }) => ({ type: movement.type, quantity: Number(movement.quantity), unitCost: Number(movement.unitCost) }));
  const ledgerValue = ledger.reduce((total, { line }) => total + Number(line.debit) - Number(line.credit), 0);
  return reconcileInventoryToLedger(normalized, ledgerValue);
}

export async function recordStockMovement(input: { userId: number; organizationId: number; companyId: number; periodId: number; warehouseId?: number; productCode: string; type: "IN" | "OUT"; quantity: number; unitCost: number; sourceDocumentId?: number; journalEntryId?: number; correlationId: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertCompanyReady(db, input.userId, input.companyId);
  await assertAuditScopeForUser({ actorUserId: input.userId, organizationId: input.organizationId, companyId: input.companyId });
  const movement = validateStockMovement(input);
  if (input.warehouseId) {
    const warehouse = await db.select({ id: warehouses.id }).from(warehouses).where(and(eq(warehouses.id, input.warehouseId), eq(warehouses.companyId, input.companyId), eq(warehouses.active, 1))).limit(1);
    if (!warehouse[0]) throw new Error("WAREHOUSE_NOT_FOUND_OR_FORBIDDEN");
  }
  const result = await db.insert(stockMovements).values({ organizationId: input.organizationId, companyId: input.companyId, periodId: input.periodId, warehouseId: input.warehouseId, productCode: input.productCode, type: input.type, quantity: String(movement.quantity), unitCost: String(movement.unitCost), sourceDocumentId: input.sourceDocumentId, journalEntryId: input.journalEntryId, correlationId: input.correlationId });
  const movementId = Number(result[0].insertId);
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "STOCK_MOVEMENT_RECORDED", entityType: "stockMovement", entityId: String(movementId), beforeState: null, afterState: JSON.stringify({ type: input.type, productCode: input.productCode, quantity: input.quantity, unitCost: input.unitCost }), correlationId: input.correlationId });
  return { id: movementId, ...input };
}

export async function transferStockBetweenWarehousesForUser(input: { userId: number; organizationId: number; companyId: number; periodId: number; fromWarehouseId: number; toWarehouseId: number; productCode: string; quantity: number; unitCost: number; transferGroupId: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertCompanyReady(db, input.userId, input.companyId);
  await assertAuditScopeForUser({ actorUserId: input.userId, organizationId: input.organizationId, companyId: input.companyId });
  const transfer = buildStockTransfer(input);
  const existingTransfer = await db.select({ id: stockMovements.id, type: stockMovements.type }).from(stockMovements).where(and(eq(stockMovements.companyId, input.companyId), eq(stockMovements.transferGroupId, transfer.transferGroupId))).limit(3);
  if (existingTransfer.length >= 2) return { outgoingId: existingTransfer.find((row) => row.type === "OUT")?.id ?? existingTransfer[0].id, incomingId: existingTransfer.find((row) => row.type === "IN")?.id ?? existingTransfer[1].id, transfer, idempotent: true };
  if (existingTransfer.length === 1) throw new Error("STOCK_TRANSFER_INCOMPLETE");
  const warehousesFound = await db.select({ id: warehouses.id }).from(warehouses).where(and(eq(warehouses.companyId, input.companyId), eq(warehouses.active, 1), sql`${warehouses.id} in (${input.fromWarehouseId}, ${input.toWarehouseId})`));
  if (warehousesFound.length !== 2) throw new Error("STOCK_TRANSFER_WAREHOUSE_FORBIDDEN");
  const sourceMovements = await db.select({ movement: stockMovements }).from(stockMovements).where(and(eq(stockMovements.companyId, input.companyId), eq(stockMovements.warehouseId, transfer.fromWarehouseId), eq(stockMovements.productCode, transfer.productCode)));
  const available = sourceMovements.reduce((total, row) => total + (row.movement.type === "IN" ? Number(row.movement.quantity) : -Number(row.movement.quantity)), 0);
  if (available + 0.0000001 < transfer.quantity) throw new Error("STOCK_INSUFFICIENT");
  const result = await db.transaction(async (tx) => {
    const outgoing = await tx.insert(stockMovements).values({ organizationId: input.organizationId, companyId: input.companyId, periodId: input.periodId, warehouseId: transfer.fromWarehouseId, transferGroupId: transfer.transferGroupId, productCode: transfer.productCode, type: "OUT", quantity: String(transfer.quantity), unitCost: String(transfer.unitCost), correlationId: `${transfer.transferGroupId}:OUT` });
    const incoming = await tx.insert(stockMovements).values({ organizationId: input.organizationId, companyId: input.companyId, periodId: input.periodId, warehouseId: transfer.toWarehouseId, transferGroupId: transfer.transferGroupId, productCode: transfer.productCode, type: "IN", quantity: String(transfer.quantity), unitCost: String(transfer.unitCost), correlationId: `${transfer.transferGroupId}:IN` });
    return { outgoingId: Number(outgoing[0].insertId), incomingId: Number(incoming[0].insertId) };
  });
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "STOCK_TRANSFER_RECORDED", entityType: "stockTransfer", entityId: transfer.transferGroupId, beforeState: null, afterState: JSON.stringify({ ...transfer, ...result }), correlationId: transfer.transferGroupId });
  return { ...result, transfer, idempotent: false };
}
export async function createFileAsset(input: { userId: number; organizationId: number; companyId: number; storageKey: string; filename: string; mimeType: string; size: number; sha256: string; allowedUserIds?: number[]; category?: "FISCAL" | "CONTABILISTICO" | "CONTRATO" | "RH" | "OUTRO"; description?: string; reference?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertCompanyReady(db, input.userId, input.companyId);
  await assertAuditScopeForUser({ actorUserId: input.userId, organizationId: input.organizationId, companyId: input.companyId });
  const result = await db.insert(fileAssets).values({ organizationId: input.organizationId, companyId: input.companyId, ownerUserId: input.userId, storageKey: input.storageKey, filename: input.filename, mimeType: input.mimeType, size: input.size, sha256: input.sha256, allowedUserIds: JSON.stringify(input.allowedUserIds ?? []), category: input.category ?? "OUTRO", description: input.description ?? null, reference: input.reference ?? null, currentVersion: 1 });
  const fileId = Number(result[0].insertId);
  await db.insert(fileAssetVersions).values({ fileAssetId: fileId, organizationId: input.organizationId, companyId: input.companyId, versionNumber: 1, storageKey: input.storageKey, filename: input.filename, mimeType: input.mimeType, size: input.size, sha256: input.sha256, createdBy: input.userId });
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "FILE_ASSET_REGISTERED", entityType: "fileAsset", entityId: String(fileId), beforeState: null, afterState: JSON.stringify({ filename: input.filename, mimeType: input.mimeType, sha256: input.sha256, size: input.size }), correlationId: input.storageKey });
  return { id: fileId, storageKey: input.storageKey };
}

export async function listFileAssetsForUser(input: { userId: number; companyId: number; search?: string; category?: "FISCAL" | "CONTABILISTICO" | "CONTRATO" | "RH" | "OUTRO"; from?: Date; to?: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ file: fileAssets }).from(fileAssets).innerJoin(organizations, eq(fileAssets.organizationId, organizations.id)).where(and(eq(fileAssets.companyId, input.companyId), organizationAccessCondition(input.userId))).orderBy(desc(fileAssets.updatedAt), desc(fileAssets.id));
  const search = input.search?.trim().toLocaleLowerCase("pt-PT");
  return rows.map(({ file }) => ({ ...file, allowedUserIds: JSON.parse(file.allowedUserIds ?? "[]") as number[] })).filter((file) => !file.archivedAt && (!input.category || file.category === input.category) && (!input.from || file.createdAt >= input.from) && (!input.to || file.createdAt <= input.to) && (!search || [file.filename, file.description ?? "", file.reference ?? ""].some((value) => value.toLocaleLowerCase("pt-PT").includes(search))));
}

export async function updateFileAssetMetadataForUser(input: { userId: number; companyId: number; fileId: number; category?: "FISCAL" | "CONTABILISTICO" | "CONTRATO" | "RH" | "OUTRO"; description?: string; reference?: string; allowedUserIds?: number[] }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const file = await getFileAssetForUser(input);
  if (file.ownerUserId !== input.userId) throw new Error("FILE_METADATA_FORBIDDEN");
  await db.update(fileAssets).set({ category: input.category, description: input.description, reference: input.reference, allowedUserIds: input.allowedUserIds ? JSON.stringify(input.allowedUserIds) : undefined }).where(and(eq(fileAssets.id, input.fileId), eq(fileAssets.companyId, input.companyId)));
  await appendAuditEventForUser({ organizationId: file.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "FILE_ASSET_METADATA_UPDATED", entityType: "fileAsset", entityId: String(input.fileId), beforeState: JSON.stringify({ category: file.category, description: file.description, reference: file.reference, allowedUserIds: file.allowedUserIds }), afterState: JSON.stringify({ category: input.category ?? file.category, description: input.description ?? file.description, reference: input.reference ?? file.reference, allowedUserIds: input.allowedUserIds ?? file.allowedUserIds }), correlationId: `file:${input.fileId}:metadata` });
  return getFileAssetForUser(input);
}

export async function archiveFileAssetForUser(input: { userId: number; companyId: number; fileId: number; reason: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const file = await getFileAssetForUser(input);
  if (file.ownerUserId !== input.userId) throw new Error("FILE_ARCHIVE_FORBIDDEN");
  await db.update(fileAssets).set({ archivedAt: new Date() }).where(and(eq(fileAssets.id, input.fileId), eq(fileAssets.companyId, input.companyId)));
  await appendAuditEventForUser({ organizationId: file.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "FILE_ASSET_ARCHIVED", entityType: "fileAsset", entityId: String(input.fileId), beforeState: JSON.stringify({ archivedAt: file.archivedAt }), afterState: JSON.stringify({ archivedAt: new Date().toISOString(), reason: input.reason }), correlationId: `file:${input.fileId}:archive` });
  return { id: input.fileId, archived: true };
}

export async function createFileAssetVersion(input: { userId: number; companyId: number; fileId: number; storageKey: string; filename: string; mimeType: string; size: number; sha256: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const file = await getFileAssetForUser(input);
  if (file.ownerUserId !== input.userId) throw new Error("FILE_VERSION_FORBIDDEN");
  const versionNumber = file.currentVersion + 1;
  await db.insert(fileAssetVersions).values({ fileAssetId: input.fileId, organizationId: file.organizationId, companyId: input.companyId, versionNumber, storageKey: input.storageKey, filename: input.filename, mimeType: input.mimeType, size: input.size, sha256: input.sha256, createdBy: input.userId });
  await db.update(fileAssets).set({ storageKey: input.storageKey, filename: input.filename, mimeType: input.mimeType, size: input.size, sha256: input.sha256, currentVersion: versionNumber }).where(and(eq(fileAssets.id, input.fileId), eq(fileAssets.companyId, input.companyId)));
  await appendAuditEventForUser({ organizationId: file.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "FILE_ASSET_VERSION_CREATED", entityType: "fileAsset", entityId: String(input.fileId), beforeState: JSON.stringify({ version: file.currentVersion, sha256: file.sha256 }), afterState: JSON.stringify({ version: versionNumber, sha256: input.sha256 }), correlationId: `file:${input.fileId}:version:${versionNumber}` });
  return { id: input.fileId, versionNumber };
}

export async function getFileAssetVersionsForUser(input: { userId: number; companyId: number; fileId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const file = await getFileAssetForUser(input);
  return db.select({ version: fileAssetVersions }).from(fileAssetVersions).where(and(eq(fileAssetVersions.fileAssetId, input.fileId), eq(fileAssetVersions.companyId, input.companyId))).orderBy(desc(fileAssetVersions.versionNumber));
}

export async function getFileAssetForUser(input: { userId: number; companyId: number; fileId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ file: fileAssets }).from(fileAssets).innerJoin(companies, eq(fileAssets.companyId, companies.id)).innerJoin(organizations, eq(fileAssets.organizationId, organizations.id)).where(and(eq(fileAssets.id, input.fileId), eq(fileAssets.companyId, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  const file = rows[0]?.file;
  if (!file) throw new Error("FILE_NOT_FOUND_OR_FORBIDDEN");
  const allowed = JSON.parse(file.allowedUserIds ?? "[]") as number[];
  if (file.ownerUserId !== input.userId && !allowed.includes(input.userId)) throw new Error("FILE_DOWNLOAD_FORBIDDEN");
  return { ...file, allowedUserIds: allowed };
}

export async function createPurchaseOrderForUser(input: { userId: number; organizationId: number; companyId: number; supplierId: number; currency?: string; requestedDate: Date; expectedDate?: Date; notes?: string; items: Array<{ productId?: number; description: string; quantity: number; unitPrice: number; taxRate?: number }> }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertCompanyReady(db, input.userId, input.companyId);
  await assertAuditScopeForUser({ actorUserId: input.userId, organizationId: input.organizationId, companyId: input.companyId });
  const supplier = await db.select({ id: counterparties.id }).from(counterparties).where(and(eq(counterparties.id, input.supplierId), eq(counterparties.companyId, input.companyId), eq(counterparties.kind, "SUPPLIER"))).limit(1);
  if (!supplier[0]) throw new Error("SUPPLIER_NOT_FOUND_OR_FORBIDDEN");
  if (!input.items.length) throw new Error("PURCHASE_ORDER_ITEMS_REQUIRED");
  const normalized = input.items.map((item, index) => { const quantity = Number(item.quantity); const unitPrice = Number(item.unitPrice); const taxRate = Number(item.taxRate ?? 0); const netAmount = Math.round(quantity * unitPrice * 100) / 100; const taxAmount = Math.round(netAmount * taxRate) / 10000; return { ...item, lineNumber: index + 1, quantity, unitPrice, taxRate, netAmount, taxAmount, totalAmount: Math.round((netAmount + taxAmount) * 100) / 100 }; });
  const totals = normalized.reduce((sum, item) => ({ net: sum.net + item.netAmount, tax: sum.tax + item.taxAmount, total: sum.total + item.totalAmount }), { net: 0, tax: 0, total: 0 });
  const orderNumber = `EC/${input.requestedDate.getUTCFullYear()}/${Date.now()}`;
  const result = await db.insert(purchaseOrders).values({ organizationId: input.organizationId, companyId: input.companyId, supplierId: input.supplierId, orderNumber, currency: input.currency ?? "AOA", netAmount: totals.net.toFixed(2), taxAmount: totals.tax.toFixed(2), totalAmount: totals.total.toFixed(2), requestedDate: input.requestedDate, expectedDate: input.expectedDate, notes: input.notes, createdBy: input.userId });
  const orderId = Number(result[0].insertId);
  await db.insert(purchaseOrderItems).values(normalized.map((item) => ({ organizationId: input.organizationId, companyId: input.companyId, orderId, lineNumber: item.lineNumber, productId: item.productId, description: item.description, quantity: item.quantity.toFixed(4), unitPrice: item.unitPrice.toFixed(4), taxRate: item.taxRate.toFixed(4), netAmount: item.netAmount.toFixed(2), taxAmount: item.taxAmount.toFixed(2), totalAmount: item.totalAmount.toFixed(2) })));
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "PURCHASE_ORDER_CREATED", entityType: "purchaseOrder", entityId: String(orderId), beforeState: null, afterState: JSON.stringify({ orderNumber, supplierId: input.supplierId, status: "DRAFT", totals }), correlationId: `purchase:${orderId}` });
  return { id: orderId, orderNumber, status: "DRAFT" as const, totals, itemCount: normalized.length };
}

export async function getPurchaseOrdersForUserCompany(input: { userId: number; companyId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ order: purchaseOrders, supplier: counterparties }).from(purchaseOrders).innerJoin(counterparties, eq(purchaseOrders.supplierId, counterparties.id)).innerJoin(organizations, eq(purchaseOrders.organizationId, organizations.id)).where(and(eq(purchaseOrders.companyId, input.companyId), organizationAccessCondition(input.userId))).orderBy(desc(purchaseOrders.id));
  return Promise.all(rows.map(async ({ order, supplier }) => ({ order, supplier, items: await db.select({ item: purchaseOrderItems }).from(purchaseOrderItems).where(and(eq(purchaseOrderItems.orderId, order.id), eq(purchaseOrderItems.companyId, input.companyId))).orderBy(purchaseOrderItems.lineNumber), receipts: await db.select({ receipt: purchaseReceipts }).from(purchaseReceipts).where(and(eq(purchaseReceipts.orderId, order.id), eq(purchaseReceipts.companyId, input.companyId))).orderBy(desc(purchaseReceipts.id)) })));
}

export async function transitionPurchaseOrderForUser(input: { userId: number; companyId: number; orderId: number; target: "SUBMITTED" | "APPROVED" | "RECEIVED" | "CANCELLED"; reason?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ order: purchaseOrders, organization: organizations }).from(purchaseOrders).innerJoin(organizations, eq(purchaseOrders.organizationId, organizations.id)).where(and(eq(purchaseOrders.id, input.orderId), eq(purchaseOrders.companyId, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  const current = rows[0];
  if (!current) throw new Error("PURCHASE_ORDER_NOT_FOUND_OR_FORBIDDEN");
  const allowed: Record<string, string[]> = { DRAFT: ["SUBMITTED", "CANCELLED"], SUBMITTED: ["APPROVED", "CANCELLED"], APPROVED: ["RECEIVED", "CANCELLED"], RECEIVED: [], CANCELLED: [] };
  if (!allowed[current.order.status]?.includes(input.target)) throw new Error("PURCHASE_ORDER_INVALID_TRANSITION");
  await db.update(purchaseOrders).set({ status: input.target, approvedBy: input.target === "APPROVED" ? input.userId : current.order.approvedBy, approvedAt: input.target === "APPROVED" ? new Date() : current.order.approvedAt }).where(eq(purchaseOrders.id, input.orderId));
  await appendAuditEventForUser({ organizationId: current.organization.id, companyId: input.companyId, actorUserId: input.userId, action: `PURCHASE_ORDER_${input.target}`, entityType: "purchaseOrder", entityId: String(input.orderId), beforeState: JSON.stringify({ status: current.order.status }), afterState: JSON.stringify({ status: input.target, reason: input.reason ?? null }), correlationId: `purchase:${input.orderId}:${input.target}` });
  return { id: input.orderId, previousStatus: current.order.status, status: input.target };
}

export async function receivePurchaseOrderForUser(input: { userId: number; companyId: number; periodId: number; orderId: number; receivedAt: Date; idempotencyKey: string; warehouseId?: number; notes?: string; items: Array<{ orderItemId: number; quantity: number; unitCost?: number }> }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertCompanyReady(db, input.userId, input.companyId);
  await assertFiscalPeriodForUserCompany({ actorUserId: input.userId, companyId: input.companyId, periodId: input.periodId });
  if (!input.items.length) throw new Error("PURCHASE_RECEIPT_ITEMS_REQUIRED");
  if (input.warehouseId) {
    const warehouse = await db.select({ id: warehouses.id }).from(warehouses).where(and(eq(warehouses.id, input.warehouseId), eq(warehouses.companyId, input.companyId), eq(warehouses.active, 1))).limit(1);
    if (!warehouse[0]) throw new Error("WAREHOUSE_NOT_FOUND_OR_FORBIDDEN");
  }
  const existing = await db.select({ receipt: purchaseReceipts }).from(purchaseReceipts).innerJoin(organizations, eq(purchaseReceipts.organizationId, organizations.id)).where(and(eq(purchaseReceipts.companyId, input.companyId), eq(purchaseReceipts.idempotencyKey, input.idempotencyKey), organizationAccessCondition(input.userId))).limit(1);
  if (existing[0]) return { id: existing[0].receipt.id, receiptNumber: existing[0].receipt.receiptNumber, status: "ALREADY_REGISTERED" as const };
  const orderRows = await db.select({ order: purchaseOrders, organizationId: organizations.id }).from(purchaseOrders).innerJoin(organizations, eq(purchaseOrders.organizationId, organizations.id)).where(and(eq(purchaseOrders.id, input.orderId), eq(purchaseOrders.companyId, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  const order = orderRows[0];
  if (!order || !["APPROVED", "RECEIVED"].includes(order.order.status)) throw new Error("PURCHASE_ORDER_NOT_APPROVED_OR_FORBIDDEN");
  const orderItems = await db.select({ item: purchaseOrderItems }).from(purchaseOrderItems).where(and(eq(purchaseOrderItems.orderId, input.orderId), eq(purchaseOrderItems.companyId, input.companyId)));
  const byId = new Map(orderItems.map(({ item }) => [item.id, item]));
  const normalized = [] as Array<{ item: typeof orderItems[number]["item"]; quantity: number; unitCost: number; productCode: string }>;
  for (const received of input.items) {
    const item = byId.get(received.orderItemId);
    const quantity = Number(received.quantity);
    if (!item || !Number.isFinite(quantity) || quantity <= 0) throw new Error("PURCHASE_RECEIPT_LINE_INVALID");
    const remaining = Number(item.quantity) - Number(item.receivedQuantity);
    if (quantity > remaining + 0.000001) throw new Error("PURCHASE_RECEIPT_QUANTITY_EXCEEDS_ORDER");
    if (!item.productId) throw new Error("PURCHASE_RECEIPT_PRODUCT_REQUIRED");
    const product = await db.select({ code: products.code }).from(products).where(and(eq(products.id, item.productId), eq(products.companyId, input.companyId), eq(products.active, 1))).limit(1);
    if (!product[0]) throw new Error("PURCHASE_RECEIPT_PRODUCT_NOT_FOUND_OR_FORBIDDEN");
    normalized.push({ item, quantity, unitCost: received.unitCost === undefined ? Number(item.unitPrice) : Number(received.unitCost), productCode: product[0].code });
  }
  const receiptNumber = `REC/${input.receivedAt.getUTCFullYear()}/${Date.now()}`;
  const receipt = await db.transaction(async (tx) => {
    const result = await tx.insert(purchaseReceipts).values({ organizationId: order.organizationId, companyId: input.companyId, orderId: input.orderId, receiptNumber, periodId: input.periodId, receivedAt: input.receivedAt, notes: input.notes, idempotencyKey: input.idempotencyKey, createdBy: input.userId });
    const receiptId = Number(result[0].insertId);
    for (const row of normalized) {
      await tx.insert(purchaseReceiptItems).values({ organizationId: order.organizationId, companyId: input.companyId, receiptId, orderItemId: row.item.id, productId: row.item.productId, productCode: row.productCode, quantity: row.quantity.toFixed(4), unitCost: row.unitCost.toFixed(4) });
      await tx.update(purchaseOrderItems).set({ receivedQuantity: sql`${purchaseOrderItems.receivedQuantity} + ${row.quantity.toFixed(4)}` }).where(eq(purchaseOrderItems.id, row.item.id));
      await tx.insert(stockMovements).values({ organizationId: order.organizationId, companyId: input.companyId, periodId: input.periodId, warehouseId: input.warehouseId, productCode: row.productCode, type: "IN", quantity: row.quantity.toFixed(4), unitCost: row.unitCost.toFixed(4), correlationId: `receipt:${receiptId}:${row.item.id}` });
    }
    return receiptId;
  });
  const refreshed = await db.select({ item: purchaseOrderItems }).from(purchaseOrderItems).where(and(eq(purchaseOrderItems.orderId, input.orderId), eq(purchaseOrderItems.companyId, input.companyId)));
  const fullyReceived = refreshed.every(({ item }) => Number(item.receivedQuantity) >= Number(item.quantity) - 0.000001);
  if (fullyReceived && order.order.status !== "RECEIVED") await db.update(purchaseOrders).set({ status: "RECEIVED" }).where(eq(purchaseOrders.id, input.orderId));
  await appendAuditEventForUser({ organizationId: order.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "PURCHASE_RECEIPT_REGISTERED", entityType: "purchaseReceipt", entityId: String(receipt), beforeState: JSON.stringify({ orderId: input.orderId, status: order.order.status }), afterState: JSON.stringify({ receiptNumber, status: fullyReceived ? "RECEIVED" : order.order.status, itemCount: normalized.length }), correlationId: `receipt:${receipt}` });
  return { id: receipt, receiptNumber, status: fullyReceived ? "RECEIVED" as const : "PARTIALLY_RECEIVED" as const };
}

export async function convertPurchaseReceiptToSupplierDraftForUser(input: { userId: number; companyId: number; receiptId: number; series: string; documentType: string; ivaRegime: "GERAL" | "SIMPLIFICADO" | "EXCLUSAO" }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertCompanyReady(db, input.userId, input.companyId);
  const receiptRows = await db.select({ receipt: purchaseReceipts, order: purchaseOrders, supplier: counterparties, organizationId: organizations.id }).from(purchaseReceipts).innerJoin(purchaseOrders, eq(purchaseReceipts.orderId, purchaseOrders.id)).innerJoin(counterparties, eq(purchaseOrders.supplierId, counterparties.id)).innerJoin(organizations, eq(purchaseReceipts.organizationId, organizations.id)).where(and(eq(purchaseReceipts.id, input.receiptId), eq(purchaseReceipts.companyId, input.companyId), organizationAccessCondition(input.userId), eq(counterparties.kind, "SUPPLIER"))).limit(1);
  const context = receiptRows[0];
  if (!context) throw new Error("PURCHASE_RECEIPT_NOT_FOUND_OR_FORBIDDEN");
  const conversionKey = `receipt-to-supplier-document:${input.companyId}:${input.receiptId}`;
  const existing = await db.select({ document: businessDocuments }).from(businessDocuments).where(and(eq(businessDocuments.companyId, input.companyId), eq(businessDocuments.sourceReceiptId, input.receiptId), eq(businessDocuments.conversionKey, conversionKey))).limit(1);
  if (existing[0]) return { id: existing[0].document.id, documentNumber: existing[0].document.documentNumber, status: existing[0].document.status, alreadyConverted: true as const };
  const receiptItems = await db.select({ receiptItem: purchaseReceiptItems, orderItem: purchaseOrderItems }).from(purchaseReceiptItems).innerJoin(purchaseOrderItems, eq(purchaseReceiptItems.orderItemId, purchaseOrderItems.id)).where(and(eq(purchaseReceiptItems.receiptId, input.receiptId), eq(purchaseReceiptItems.companyId, input.companyId))).orderBy(purchaseReceiptItems.id);
  if (!receiptItems.length) throw new Error("PURCHASE_RECEIPT_WITHOUT_LINES");
  const items = receiptItems.map(({ receiptItem, orderItem }) => { const quantity = Number(receiptItem.quantity); const unitPrice = Number(receiptItem.unitCost); const netAmount = Math.round(quantity * unitPrice * 100) / 100; const taxRate = Number(orderItem.taxRate); const taxAmount = Math.round(netAmount * taxRate) / 10000; return { productId: receiptItem.productId ?? undefined, description: orderItem.description, quantity, unitPrice, netAmount, taxAmount, totalAmount: Math.round((netAmount + taxAmount) * 100) / 100, taxRate, taxType: taxAmount > 0 ? "IVA" : undefined }; });
  try {
    const created = await createDraftBusinessDocumentForUser({ userId: input.userId, companyId: input.companyId, series: input.series, documentType: input.documentType, counterpartyId: context.supplier.id, counterpartyType: "SUPPLIER", ivaRegime: input.ivaRegime, currency: context.order.currency, items });
    await db.update(businessDocuments).set({ sourceReceiptId: input.receiptId, conversionKey }).where(and(eq(businessDocuments.id, created.id), eq(businessDocuments.companyId, input.companyId)));
    await appendAuditEventForUser({ organizationId: context.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "PURCHASE_RECEIPT_CONVERTED_TO_SUPPLIER_DRAFT", entityType: "businessDocument", entityId: String(created.id), beforeState: null, afterState: JSON.stringify({ sourceReceiptId: input.receiptId, documentNumber: created.documentNumber, status: "DRAFT", issued: false, accounted: false }), correlationId: conversionKey });
    return { id: created.id, documentNumber: created.documentNumber, status: "DRAFT" as const, alreadyConverted: false as const };
  } catch (error) {
    const duplicate = await db.select({ document: businessDocuments }).from(businessDocuments).where(and(eq(businessDocuments.companyId, input.companyId), eq(businessDocuments.conversionKey, conversionKey))).limit(1);
    if (duplicate[0]) return { id: duplicate[0].document.id, documentNumber: duplicate[0].document.documentNumber, status: duplicate[0].document.status, alreadyConverted: true as const };
    throw error;
  }
}

export async function reserveDocumentNumber(input: { userId: number; companyId: number; series: string; documentType: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertCompanyReady(db, input.userId, input.companyId);
  const reserved = await db.transaction(async (tx) => {
    const rows = await tx.select({ series: documentSeries, organization: organizations }).from(documentSeries).innerJoin(companies, eq(documentSeries.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(documentSeries.companyId, input.companyId), eq(documentSeries.code, input.series), eq(documentSeries.documentType, input.documentType), eq(documentSeries.active, 1), organizationAccessCondition(input.userId))).limit(1);
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
  const companyContext = await db.select({ organizationId: companies.organizationId, functionalCurrency: companies.functionalCurrency }).from(companies).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(companies.id, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  if (!companyContext[0]) throw new Error("COMPANY_NOT_FOUND_OR_FORBIDDEN");
  const counterparty = await db.select({ id: counterparties.id, name: counterparties.name, kind: counterparties.kind, paymentTermsDays: counterparties.paymentTermsDays, creditLimit: counterparties.creditLimit }).from(counterparties).where(and(eq(counterparties.id, input.counterpartyId), eq(counterparties.companyId, input.companyId), eq(counterparties.kind, input.counterpartyType))).limit(1);
  if (!counterparty[0]) throw new Error("COUNTERPARTY_NOT_FOUND_OR_FORBIDDEN");
  if (["NC", "ND"].includes(input.documentType) && !input.correctsDocumentId) throw new Error("CORRECTION_ORIGIN_REQUIRED");
  if (input.documentType === "AF" && input.counterpartyType !== "SUPPLIER") throw new Error("AUTOFATURACAO_REQUER_FORNECEDOR");
  if (input.counterpartyType === "CUSTOMER" && Number(counterparty[0].creditLimit ?? 0) > 0) {
    const balanceRows = await db.select({ outstanding: sql<string>`COALESCE(SUM(${businessDocuments.totalAmount} - ${businessDocuments.settledAmount}), 0)` }).from(businessDocuments).where(and(eq(businessDocuments.companyId, input.companyId), eq(businessDocuments.counterpartyId, input.counterpartyId), sql`${businessDocuments.status} IN ('ISSUED','ACCOUNTED')`));
    const outstanding = Number(balanceRows[0]?.outstanding ?? 0);
    const requested = input.items.reduce((sum, item) => sum + item.totalAmount, 0);
    if (outstanding + requested > Number(counterparty[0].creditLimit)) throw new Error("CUSTOMER_CREDIT_LIMIT_EXCEEDED");
  }
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
    const documentResult = await tx.insert(businessDocuments).values({ companyId: input.companyId, documentNumber: reserved.formatted, series: input.series, status: "DRAFT", documentType: input.documentType, customerName: counterparty[0].name, counterpartyId: input.counterpartyId, counterpartyType: input.counterpartyType, correctsDocumentId: input.correctsDocumentId, currency: input.currency ?? companyContext[0].functionalCurrency, ivaRegime: input.ivaRegime, netAmount: totals.net.toFixed(2), taxAmount: totals.tax.toFixed(2), totalAmount: totals.total.toFixed(2), dueDate: input.dueDate ?? new Date(Date.now() + Number(counterparty[0].paymentTermsDays ?? 0) * 86400000), createdBy: input.userId });
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
  const row = await db.select({ document: businessDocuments, organizationId: companies.organizationId }).from(businessDocuments).innerJoin(companies, eq(businessDocuments.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(businessDocuments.id, input.documentId), eq(businessDocuments.companyId, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  if (!row[0]) throw new Error("DOCUMENT_NOT_FOUND_OR_FORBIDDEN");
  assertDocumentMutable(row[0].document.status);
  return row[0];
}

export async function updateProductForUser(input: { userId: number; companyId: number; productId: number; name?: string; taxCode?: string; unitCode?: string; salePrice?: number; purchasePrice?: number; stockManaged?: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const row = await db.select({ product: products, organizationId: companies.organizationId }).from(products).innerJoin(companies, eq(products.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(products.id, input.productId), eq(products.companyId, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  if (!row[0]) throw new Error("PRODUCT_NOT_FOUND_OR_FORBIDDEN");
  const linked = await db.select({ id: documentItems.id }).from(documentItems).innerJoin(businessDocuments, eq(documentItems.documentId, businessDocuments.id)).where(and(eq(documentItems.companyId, input.companyId), eq(documentItems.productId, input.productId), sql`${businessDocuments.status} IN ('ISSUED','ACCOUNTED','CANCELLED')`)).limit(1);
  if (linked[0]) throw new Error("PRODUCT_IMMUTABLE_AFTER_DOCUMENT_ISSUANCE");
  await db.update(products).set({ name: input.name, taxCode: input.taxCode, unitCode: input.unitCode, salePrice: input.salePrice === undefined ? undefined : input.salePrice.toFixed(4), purchasePrice: input.purchasePrice === undefined ? undefined : input.purchasePrice.toFixed(4), stockManaged: input.stockManaged === undefined ? undefined : input.stockManaged ? 1 : 0 }).where(eq(products.id, input.productId));
  await appendAuditEventForUser({ organizationId: row[0].organizationId, companyId: input.companyId, actorUserId: input.userId, action: "PRODUCT_UPDATED", entityType: "product", entityId: String(input.productId), beforeState: JSON.stringify(row[0].product), afterState: JSON.stringify({ ...row[0].product, ...input }), correlationId: `product:${input.productId}` });
  return { id: input.productId };
}

export async function updateFixedAssetForUser(input: { userId: number; companyId: number; assetId: number; name?: string; residualValue?: number; usefulLifeMonths?: number; status?: "ACTIVE" | "DISPOSED" }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ asset: fixedAssets, organizationId: companies.organizationId }).from(fixedAssets).innerJoin(companies, eq(fixedAssets.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(fixedAssets.id, input.assetId), eq(fixedAssets.companyId, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  if (!rows[0]) throw new Error("FIXED_ASSET_NOT_FOUND_OR_FORBIDDEN");
  await db.update(fixedAssets).set({ ...(input.name === undefined ? {} : { name: input.name }), ...(input.residualValue === undefined ? {} : { residualValue: input.residualValue.toFixed(2) }), ...(input.usefulLifeMonths === undefined ? {} : { usefulLifeMonths: input.usefulLifeMonths }), ...(input.status === undefined ? {} : { status: input.status }) }).where(eq(fixedAssets.id, input.assetId));
  await appendAuditEventForUser({ organizationId: rows[0].organizationId, companyId: input.companyId, actorUserId: input.userId, action: input.status === "DISPOSED" ? "FIXED_ASSET_DISPOSED" : "FIXED_ASSET_UPDATED", entityType: "fixedAsset", entityId: String(input.assetId), beforeState: JSON.stringify(rows[0].asset), afterState: JSON.stringify({ ...rows[0].asset, ...input }), correlationId: `fixed-asset:${input.assetId}` });
  return { id: input.assetId, status: input.status ?? rows[0].asset.status };
}

export async function getFixedAssetsForUserCompany(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ asset: fixedAssets }).from(fixedAssets).innerJoin(companies, eq(fixedAssets.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(fixedAssets.companyId, companyId), eq(fixedAssets.organizationId, companies.organizationId), organizationAccessCondition(userId))).orderBy(fixedAssets.code);
}

export async function createFixedAssetForUser(input: { userId: number; organizationId: number; companyId: number; code: string; name: string; acquisitionDate: Date; acquisitionCost: number; residualValue?: number; usefulLifeMonths: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const company = await db.select({ organizationId: companies.organizationId }).from(companies).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(companies.id, input.companyId), eq(companies.organizationId, input.organizationId), organizationAccessCondition(input.userId))).limit(1);
  if (!company[0]) throw new Error("COMPANY_NOT_FOUND_OR_FORBIDDEN");
  const inserted = await db.insert(fixedAssets).values({ organizationId: input.organizationId, companyId: input.companyId, code: input.code, name: input.name, acquisitionDate: input.acquisitionDate, acquisitionCost: input.acquisitionCost.toFixed(2), residualValue: (input.residualValue ?? 0).toFixed(2), usefulLifeMonths: input.usefulLifeMonths, createdBy: input.userId });
  const id = Number(inserted[0].insertId);
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "FIXED_ASSET_CREATED", entityType: "fixedAsset", entityId: String(id), beforeState: null, afterState: JSON.stringify({ code: input.code, name: input.name, acquisitionCost: input.acquisitionCost, residualValue: input.residualValue ?? 0, usefulLifeMonths: input.usefulLifeMonths }), correlationId: `fixed-asset:${id}` });
  return { id };
}

export async function getPaymentsForUserCompany(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ payment: payments }).from(payments).innerJoin(companies, eq(payments.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(payments.companyId, companyId), organizationAccessCondition(userId))).orderBy(desc(payments.createdAt));
}

export async function reconcileCashAccountForUser(input: { userId: number; companyId: number; cashAccountId: number; statementDate: Date; openingBalance: number; closingBalance: number; adjustmentAmount?: number; adjustmentReason?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const account = await db.select({ account: cashAccounts, organizationId: companies.organizationId }).from(cashAccounts).innerJoin(companies, eq(cashAccounts.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(cashAccounts.id, input.cashAccountId), eq(cashAccounts.companyId, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  if (!account[0]) throw new Error("CASH_ACCOUNT_NOT_FOUND_OR_FORBIDDEN");
  const movements = await db.select({ direction: treasuryTransactions.direction, amount: treasuryTransactions.amount }).from(treasuryTransactions).where(and(eq(treasuryTransactions.companyId, input.companyId), eq(treasuryTransactions.cashAccountId, input.cashAccountId)));
  const netMovement = movements.reduce((sum, movement) => sum + (movement.direction === "IN" ? Number(movement.amount) : -Number(movement.amount)), 0);
  const systemBalance = input.openingBalance + netMovement;
  const rawDifference = Number((input.closingBalance - systemBalance).toFixed(2));
  const adjustment = applyReconciliationAdjustment(rawDifference, input.adjustmentAmount, input.adjustmentReason);
  const { adjustmentAmount, difference } = adjustment;
  const status = adjustment.reconciled ? "RECONCILED" as const : "OPEN" as const;
  const inserted = await db.insert(cashReconciliations).values({ companyId: input.companyId, cashAccountId: input.cashAccountId, statementDate: input.statementDate, openingBalance: input.openingBalance.toFixed(2), closingBalance: input.closingBalance.toFixed(2), systemBalance: systemBalance.toFixed(2), difference: difference.toFixed(2), status, createdBy: input.userId });
  const id = Number(inserted[0].insertId);
  await appendAuditEventForUser({ organizationId: account[0].organizationId, companyId: input.companyId, actorUserId: input.userId, action: "CASH_ACCOUNT_RECONCILED", entityType: "cashReconciliation", entityId: String(id), beforeState: null, afterState: JSON.stringify({ cashAccountId: input.cashAccountId, closingBalance: input.closingBalance, systemBalance, rawDifference, adjustmentAmount, adjustmentReason: input.adjustmentReason?.trim() ?? null, difference, status }), correlationId: `cash-reconciliation:${input.cashAccountId}:${input.statementDate.toISOString()}` });
  return { id, cashAccountId: input.cashAccountId, systemBalance, difference, status };
}

export async function reconcileTreasuryTransactionForUser(input: { userId: number; companyId: number; transactionId: number; reason?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const row = await db.select({ transaction: treasuryTransactions, organizationId: companies.organizationId }).from(treasuryTransactions).innerJoin(companies, eq(treasuryTransactions.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(treasuryTransactions.id, input.transactionId), eq(treasuryTransactions.companyId, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  if (!row[0]) throw new Error("TREASURY_TRANSACTION_NOT_FOUND_OR_FORBIDDEN");
  if (row[0].transaction.reconciliationStatus === "RECONCILED") return { id: input.transactionId, reconciliationStatus: "RECONCILED" as const, alreadyReconciled: true };
  await db.update(treasuryTransactions).set({ reconciliationStatus: "RECONCILED" }).where(and(eq(treasuryTransactions.id, input.transactionId), eq(treasuryTransactions.companyId, input.companyId)));
  await appendAuditEventForUser({ organizationId: row[0].organizationId, companyId: input.companyId, actorUserId: input.userId, action: "TREASURY_TRANSACTION_RECONCILED", entityType: "treasuryTransaction", entityId: String(input.transactionId), beforeState: JSON.stringify({ reconciliationStatus: row[0].transaction.reconciliationStatus }), afterState: JSON.stringify({ reconciliationStatus: "RECONCILED", reason: input.reason ?? null }), correlationId: `treasury-reconciliation:${input.transactionId}` });
  return { id: input.transactionId, reconciliationStatus: "RECONCILED" as const, alreadyReconciled: false };
}

export async function updateCounterpartyForUser(input: { userId: number; companyId: number; counterpartyId: number; name?: string; email?: string; phone?: string; address?: string; paymentTermsDays?: number; creditLimit?: number; preferredCurrency?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const row = await db.select({ counterparty: counterparties, organizationId: companies.organizationId }).from(counterparties).innerJoin(companies, eq(counterparties.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(counterparties.id, input.counterpartyId), eq(counterparties.companyId, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  if (!row[0]) throw new Error("COUNTERPARTY_NOT_FOUND_OR_FORBIDDEN");
  const linked = await db.select({ id: businessDocuments.id, status: businessDocuments.status }).from(businessDocuments).where(and(eq(businessDocuments.companyId, input.companyId), eq(businessDocuments.counterpartyId, input.counterpartyId))).limit(20);
  if (linked.some((document) => ["ISSUED", "ACCOUNTED", "CANCELLED"].includes(document.status))) throw new Error("COUNTERPARTY_IMMUTABLE_AFTER_DOCUMENT_ISSUANCE");
  await db.update(counterparties).set({ name: input.name, email: input.email, phone: input.phone, address: input.address, paymentTermsDays: input.paymentTermsDays, creditLimit: input.creditLimit === undefined ? undefined : input.creditLimit.toFixed(2), preferredCurrency: input.preferredCurrency }).where(eq(counterparties.id, input.counterpartyId));
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
  const row = await db.select({ document: businessDocuments, organizationId: companies.organizationId }).from(businessDocuments).innerJoin(companies, eq(businessDocuments.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(businessDocuments.id, input.documentId), eq(businessDocuments.companyId, input.companyId), organizationAccessCondition(input.userId))).limit(1);
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
  const payment = await db.select({ payment: payments, organizationId: companies.organizationId }).from(payments).innerJoin(companies, eq(payments.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(payments.id, input.paymentId), eq(payments.companyId, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  if (!payment[0]) throw new Error("PAYMENT_NOT_FOUND_OR_FORBIDDEN");
  if (payment[0].payment.documentId) await assertCommercialDocumentMutable({ userId: input.userId, companyId: input.companyId, documentId: payment[0].payment.documentId });
  await db.update(payments).set({ amount: input.amount === undefined ? undefined : input.amount.toFixed(2), method: input.method, status: input.status }).where(eq(payments.id, input.paymentId));
  await appendAuditEventForUser({ organizationId: payment[0].organizationId, companyId: input.companyId, actorUserId: input.userId, action: "PAYMENT_UPDATED", entityType: "payment", entityId: String(input.paymentId), beforeState: JSON.stringify(payment[0].payment), afterState: JSON.stringify({ ...payment[0].payment, ...input }), correlationId: `payment-update:${input.paymentId}` });
  return { id: input.paymentId };
}

export async function getJournalDocumentChainForUserCompany(userId: number, companyId: number, entryId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select({ entry: journalEntries, document: businessDocuments, line: journalLines, account: chartAccounts }).from(journalEntries).innerJoin(companies, eq(journalEntries.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).leftJoin(businessDocuments, eq(journalEntries.sourceDocumentId, businessDocuments.id)).innerJoin(journalLines, eq(journalLines.entryId, journalEntries.id)).innerJoin(chartAccounts, eq(journalLines.accountId, chartAccounts.id)).where(and(eq(journalEntries.id, entryId), eq(journalEntries.companyId, companyId), organizationAccessCondition(userId), eq(journalEntries.status, "POSTED")));
  const first = rows[0];
  if (!first) return null;
  return { entry: first.entry, document: first.document, lines: rows.map((row) => ({ lineId: row.line.id, accountId: row.account.id, accountCode: row.account.code, accountName: row.account.name, debit: Number(row.line.debit), credit: Number(row.line.credit) })) };
}

export async function getDocumentAccountingChainForUserCompany(userId: number, companyId: number, documentId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select({ document: businessDocuments, entry: journalEntries, line: journalLines, account: chartAccounts }).from(businessDocuments).innerJoin(companies, eq(businessDocuments.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).leftJoin(journalEntries, and(eq(journalEntries.sourceDocumentId, businessDocuments.id), eq(journalEntries.status, "POSTED"))).leftJoin(journalLines, eq(journalLines.entryId, journalEntries.id)).leftJoin(chartAccounts, eq(journalLines.accountId, chartAccounts.id)).where(and(eq(businessDocuments.id, documentId), eq(businessDocuments.companyId, companyId), organizationAccessCondition(userId)));
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

export async function getJournalRowsForUserCompany(userId: number, companyId: number, periodId?: number): Promise<JournalRow[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ entryId: journalEntries.id, description: journalEntries.description, createdAt: journalEntries.createdAt, sourceDocumentId: journalEntries.sourceDocumentId, accountCode: chartAccounts.code, accountName: chartAccounts.name, debit: journalLines.debit, credit: journalLines.credit, costCenter: journalEntries.costCenter, analyticalDimension: journalEntries.analyticalDimension }).from(journalLines).innerJoin(journalEntries, eq(journalLines.entryId, journalEntries.id)).innerJoin(chartAccounts, eq(journalLines.accountId, chartAccounts.id)).innerJoin(companies, eq(journalEntries.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(organizationAccessCondition(userId), eq(companies.id, companyId), eq(journalEntries.status, "POSTED"), eq(journalEntries.reviewStatus, "APPROVED"), periodId ? eq(journalEntries.periodId, periodId) : undefined));
  return rows.map((row) => ({ ...row, debit: Number(row.debit), credit: Number(row.credit) }));
}

export async function getTrialBalanceForUserCompany(userId: number, companyId: number, periodId?: number) {
  const rows = await getJournalRowsForUserCompany(userId, companyId, periodId);
  return buildTrialBalance(rows.map(({ accountCode, accountName, debit, credit }) => ({ accountCode, accountName, debit, credit })));
}

export async function getJournalForUserCompany(userId: number, companyId: number, periodId?: number) {
  return buildJournal(await getJournalRowsForUserCompany(userId, companyId, periodId));
}

export async function getLedgerForUserCompany(userId: number, companyId: number, accountCode?: string, periodId?: number) {
  return buildLedger(await getJournalRowsForUserCompany(userId, companyId, periodId), accountCode);
}

export async function getIncomeStatementForUserCompany(userId: number, companyId: number, periodId?: number) {
  const rows = await getJournalRowsForUserCompany(userId, companyId, periodId);
  return buildIncomeStatement(rows.map(({ accountCode, accountName, debit, credit }) => ({ accountCode, accountName, debit, credit })));
}

export async function getBalanceSheetForUserCompany(userId: number, companyId: number, periodId?: number) {
  const rows = await getJournalRowsForUserCompany(userId, companyId, periodId);
  return buildBalanceSheet(rows.map(({ accountCode, accountName, debit, credit }) => ({ accountCode, accountName, debit, credit })));
}

export async function getReportTraceForUserCompany(userId: number, companyId: number, report: "TRIAL_BALANCE" | "INCOME_STATEMENT" | "BALANCE_SHEET", accountCode?: string, periodId?: number) {
  const rows = await getJournalRowsForUserCompany(userId, companyId, periodId);
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
  const companyContext = await db.select({ company: companies }).from(companies).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(companies.id, companyId), organizationAccessCondition(userId))).limit(1);
  const company = companyContext[0]?.company;
  if (!company) throw new Error("COMPANY_NOT_FOUND_OR_FORBIDDEN");
  const [periodRows, accountRows, journal, documents, counterpartiesRows, productsRows, normativeRows] = await Promise.all([
    getPeriodsForUserCompany(userId, companyId),
    db.select({ id: chartAccounts.id }).from(chartAccounts).where(eq(chartAccounts.companyId, companyId)),
    getJournalForUserCompany(userId, companyId),
    getDocumentsForUserCompany(userId, companyId),
    getCounterpartiesForUserCompany(userId, companyId),
    getProductsForUserCompany(userId, companyId),
    getNormativeRulesForUserCompany(userId, companyId),
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
    customerCount: counterpartiesRows.filter(({ counterparty }) => counterparty.kind === "CUSTOMER").length,
    supplierCount: counterpartiesRows.filter(({ counterparty }) => counterparty.kind === "SUPPLIER").length,
    productCount: productsRows.length,
    taxRuleCount: normativeRows.length,
  });
}

export async function transitionBusinessDocument(input: { userId: number; companyId: number; documentId: number; to: "DRAFT" | "VALIDATED" | "ISSUED" | "ACCOUNTED" | "CANCELLED"; cancellationReason?: string; correlationId?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertCompanyReady(db, input.userId, input.companyId);
  const document = await db.select({ document: businessDocuments, organization: organizations }).from(businessDocuments).innerJoin(companies, eq(businessDocuments.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(businessDocuments.id, input.documentId), eq(businessDocuments.companyId, input.companyId), organizationAccessCondition(input.userId))).limit(1);
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

export async function postJournalEntry(input: { companyId: number; periodId: number; sourceDocumentId?: number; supportFileAssetId?: number; documentReference?: string; journalCode?: string; costCenter?: string; analyticalDimension?: string; reversalOfEntryId?: number; idempotencyKey: string; description: string; createdBy: number; reviewRequired?: boolean; accountingRuleOperation?: string; accountingRuleDocumentType?: string; lines: (JournalLineInput & { currency?: string; exchangeRate?: number })[] }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const companyContext = await db.select({ company: companies, organization: organizations }).from(companies).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(companies.id, input.companyId), organizationAccessCondition(input.createdBy))).limit(1);
  if (!companyContext[0]) throw new Error("COMPANY_NOT_FOUND_OR_FORBIDDEN");
  if (companyContext[0].company.configurationStatus !== "READY") throw new Error("COMPANY_CONFIGURATION_PENDING");
  await assertFiscalPeriodForUserCompany({ actorUserId: input.createdBy, companyId: input.companyId, periodId: input.periodId });
  if (input.sourceDocumentId !== undefined) {
    const source = await db.select({ id: businessDocuments.id }).from(businessDocuments).where(and(eq(businessDocuments.id, input.sourceDocumentId), eq(businessDocuments.companyId, input.companyId))).limit(1);
    if (!source[0]) throw new Error("SOURCE_DOCUMENT_NOT_FOUND_OR_FORBIDDEN");
  }
  if (input.supportFileAssetId !== undefined) {
    const support = await db.select({ id: fileAssets.id }).from(fileAssets).where(and(eq(fileAssets.id, input.supportFileAssetId), eq(fileAssets.companyId, input.companyId), eq(fileAssets.organizationId, companyContext[0].company.organizationId))).limit(1);
    if (!support[0]) throw new Error("SUPPORT_FILE_NOT_FOUND_OR_FORBIDDEN");
  }
  if (input.reversalOfEntryId !== undefined) {
    const original = await db.select({ id: journalEntries.id, status: journalEntries.status }).from(journalEntries).where(and(eq(journalEntries.id, input.reversalOfEntryId), eq(journalEntries.companyId, input.companyId))).limit(1);
    if (!original[0]) throw new Error("REVERSAL_ENTRY_NOT_FOUND_OR_FORBIDDEN");
    if (original[0].status === "REVERSED") throw new Error("REVERSAL_ALREADY_EXISTS");
  }
  let resolvedAccountingRule: typeof accountingRules.$inferSelect | undefined;
  if (input.accountingRuleOperation) {
    const ruleRows = await db.select({ rule: accountingRules }).from(accountingRules).innerJoin(pgcVersions, eq(accountingRules.versionId, pgcVersions.id)).where(and(eq(accountingRules.organizationId, companyContext[0].company.organizationId), eq(accountingRules.companyId, input.companyId), eq(accountingRules.operation, input.accountingRuleOperation), input.accountingRuleDocumentType ? eq(accountingRules.documentType, input.accountingRuleDocumentType) : sql`1 = 1`, eq(accountingRules.active, 1), eq(pgcVersions.status, "ACTIVE"), lte(accountingRules.effectiveFrom, new Date()), or(isNull(accountingRules.effectiveTo), gte(accountingRules.effectiveTo, new Date())))).orderBy(accountingRules.priority).limit(1);
    resolvedAccountingRule = ruleRows[0]?.rule;
    if (!resolvedAccountingRule) throw new Error("ACCOUNTING_RULE_NOT_FOUND");
    if (resolvedAccountingRule.debitAccountId === null || resolvedAccountingRule.creditAccountId === null) throw new Error("ACCOUNTING_RULE_INCOMPLETE");
    const normativeAccounts = await db.select({ id: pgcAccounts.id, code: pgcAccounts.code }).from(pgcAccounts).where(inArray(pgcAccounts.id, [resolvedAccountingRule.debitAccountId, resolvedAccountingRule.creditAccountId]));
    if (normativeAccounts.length !== 2) throw new Error("ACCOUNTING_RULE_NORMATIVE_ACCOUNT_NOT_FOUND");
    const normativeCodes = new Set(normativeAccounts.map((account) => account.code));
    const operationalAccounts = await db.select({ id: chartAccounts.id, code: chartAccounts.code }).from(chartAccounts).where(and(eq(chartAccounts.companyId, input.companyId), inArray(chartAccounts.code, Array.from(normativeCodes))));
    if (operationalAccounts.length !== normativeCodes.size) throw new Error("ACCOUNTING_RULE_OPERATIONAL_ACCOUNT_NOT_MAPPED");
    const selectedAccountIds = new Set(input.lines.map((line) => line.accountId));
    if (!operationalAccounts.every((account) => selectedAccountIds.has(account.id))) throw new Error("ACCOUNTING_RULE_ACCOUNT_MISMATCH");
  }
  const accountIds = Array.from(new Set(input.lines.map((line) => line.accountId)));
  const accountRows = accountIds.length ? await db.select({ id: chartAccounts.id, companyId: chartAccounts.companyId, postable: chartAccounts.postable, validFrom: chartAccounts.validFrom, validTo: chartAccounts.validTo }).from(chartAccounts).where(and(eq(chartAccounts.companyId, input.companyId), inArray(chartAccounts.id, accountIds))) : [];
  if (accountRows.length !== accountIds.length) throw new Error("ACCOUNT_NOT_FOUND_OR_FORBIDDEN");
  const accountsById = new Map(accountRows.map((account) => [account.id, account]));
  const authoritativeLines = input.lines.map((line) => {
    const account = accountsById.get(line.accountId);
    if (!account) throw new Error("ACCOUNT_NOT_FOUND_OR_FORBIDDEN");
    return { ...line, postable: Boolean(account.postable), validFrom: account.validFrom, validTo: account.validTo };
  });
  const validation = validateBalancedEntry(authoritativeLines);
  if (!validation.ok) throw new Error(validation.reason);
  const result = await db.transaction(async (tx) => {
    const existing = await tx.select().from(journalEntries).where(eq(journalEntries.idempotencyKey, input.idempotencyKey)).limit(1);
    if (existing[0]) return { entry: existing[0], idempotent: true };
    const period = await tx.select().from(fiscalPeriods).where(and(eq(fiscalPeriods.id, input.periodId), eq(fiscalPeriods.companyId, input.companyId))).limit(1);
    if (!period[0] || period[0].status === "CLOSED") throw new Error("PERIOD_NOT_OPEN");
    const inserted = await tx.insert(journalEntries).values({ companyId: input.companyId, periodId: input.periodId, sourceDocumentId: input.sourceDocumentId, supportFileAssetId: input.supportFileAssetId, documentReference: input.documentReference, journalCode: input.journalCode ?? "GERAL", costCenter: input.costCenter, analyticalDimension: input.analyticalDimension, reversalOfEntryId: input.reversalOfEntryId, idempotencyKey: input.idempotencyKey, description: input.description, createdBy: input.createdBy, status: "POSTED", reviewStatus: input.reviewRequired ? "PENDING" : "APPROVED", reviewedBy: input.reviewRequired ? undefined : input.createdBy, reviewedAt: input.reviewRequired ? undefined : new Date() });
    const entryId = Number(inserted[0].insertId);
    await tx.insert(journalLines).values(input.lines.map((line) => ({ entryId, accountId: line.accountId, debit: line.debit.toFixed(2), credit: line.credit.toFixed(2), currency: line.currency ?? "AOA", exchangeRate: (line.exchangeRate ?? 1).toFixed(8) })));
    if (input.reversalOfEntryId !== undefined) await tx.update(journalEntries).set({ status: "REVERSED" }).where(and(eq(journalEntries.id, input.reversalOfEntryId), eq(journalEntries.companyId, input.companyId), eq(journalEntries.status, "POSTED")));
    return { entryId, idempotent: false };
  });
  if (!result.idempotent) {
    await appendAuditEventForUser({ organizationId: companyContext[0].organization.id, companyId: input.companyId, actorUserId: input.createdBy, action: input.reversalOfEntryId ? "JOURNAL_ENTRY_REVERSED" : input.reviewRequired ? "JOURNAL_ENTRY_SUBMITTED" : "JOURNAL_ENTRY_POSTED", entityType: "journalEntry", entityId: String(result.entryId), beforeState: input.reversalOfEntryId ? JSON.stringify({ reversalOfEntryId: input.reversalOfEntryId }) : null, afterState: JSON.stringify({ description: input.description, sourceDocumentId: input.sourceDocumentId, supportFileAssetId: input.supportFileAssetId, documentReference: input.documentReference, journalCode: input.journalCode ?? "GERAL", costCenter: input.costCenter, analyticalDimension: input.analyticalDimension, reversalOfEntryId: input.reversalOfEntryId, accountingRuleId: resolvedAccountingRule?.id ?? null, accountingRuleOperation: input.accountingRuleOperation ?? null, lineCount: input.lines.length }), correlationId: input.idempotencyKey });
  }
  return result;
}

export async function getFiscalDocumentPdfDataForUser(input: { userId: number; companyId: number; documentId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ document: businessDocuments, company: companies, counterparty: counterparties }).from(businessDocuments).innerJoin(companies, eq(businessDocuments.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).leftJoin(counterparties, eq(businessDocuments.counterpartyId, counterparties.id)).where(and(eq(businessDocuments.id, input.documentId), eq(businessDocuments.companyId, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  if (!rows[0]) throw new Error("DOCUMENT_NOT_FOUND_OR_FORBIDDEN");
  const items = await db.select({ item: documentItems }).from(documentItems).where(and(eq(documentItems.documentId, input.documentId), eq(documentItems.companyId, input.companyId))).orderBy(documentItems.lineNumber);
  return { ...rows[0], items: items.map(({ item }) => item) };
}

export async function createDocumentImportBatchForUser(input: { userId: number; organizationId: number; companyId: number; kind: "counterparties" | "products" | "documents"; originalFilename: string; rows: Array<{ payload: Record<string, unknown>; errors: unknown[] }> }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertAuditScopeForUser({ actorUserId: input.userId, organizationId: input.organizationId, companyId: input.companyId });
  const hasErrors = input.rows.some((row) => row.errors.length > 0);
  const inserted = await db.insert(documentImportBatches).values({ organizationId: input.organizationId, companyId: input.companyId, kind: input.kind, status: hasErrors ? "IMPORTED_REVIEW" : "READY_TO_CONFIRM", originalFilename: input.originalFilename, validationSummary: JSON.stringify({ rows: input.rows.length, errors: input.rows.reduce((count, row) => count + row.errors.length, 0) }), createdBy: input.userId });
  const batchId = Number(inserted[0].insertId);
  if (input.rows.length) await db.insert(documentImportRows).values(input.rows.map((row, index) => ({ batchId, organizationId: input.organizationId, companyId: input.companyId, lineNumber: index + 2, payload: JSON.stringify(row.payload), status: (row.errors.length ? "INVALID" : "VALID") as "INVALID" | "VALID", errors: JSON.stringify(row.errors) })));
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "DOCUMENT_IMPORT_BATCH_CREATED", entityType: "documentImportBatch", entityId: String(batchId), beforeState: null, afterState: JSON.stringify({ kind: input.kind, status: hasErrors ? "IMPORTED_REVIEW" : "READY_TO_CONFIRM", rows: input.rows.length }), correlationId: `import:${batchId}` });
  return { batchId, status: hasErrors ? "IMPORTED_REVIEW" as const : "READY_TO_CONFIRM" as const };
}

export async function getDocumentImportBatchForUser(input: { userId: number; companyId: number; batchId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const batchRows = await db.select({ batch: documentImportBatches }).from(documentImportBatches).innerJoin(organizations, eq(documentImportBatches.organizationId, organizations.id)).where(and(eq(documentImportBatches.id, input.batchId), eq(documentImportBatches.companyId, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  if (!batchRows[0]) throw new Error("DOCUMENT_IMPORT_BATCH_NOT_FOUND_OR_FORBIDDEN");
  const rows = await db.select({ row: documentImportRows }).from(documentImportRows).where(and(eq(documentImportRows.batchId, input.batchId), eq(documentImportRows.companyId, input.companyId))).orderBy(documentImportRows.lineNumber);
  return { ...batchRows[0].batch, rows: rows.map(({ row }) => row) };
}

export async function updateDocumentImportRowForUser(input: { userId: number; companyId: number; rowId: number; payload: Record<string, unknown>; errors: unknown[] }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ row: documentImportRows, organizationId: organizations.id }).from(documentImportRows).innerJoin(organizations, eq(documentImportRows.organizationId, organizations.id)).where(and(eq(documentImportRows.id, input.rowId), eq(documentImportRows.companyId, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  if (!rows[0]) throw new Error("DOCUMENT_IMPORT_ROW_NOT_FOUND_OR_FORBIDDEN");
  await db.update(documentImportRows).set({ payload: JSON.stringify(input.payload), errors: JSON.stringify(input.errors), status: input.errors.length ? "INVALID" : "CORRECTED" }).where(eq(documentImportRows.id, input.rowId));
  await db.update(documentImportBatches).set({ status: input.errors.length ? "IMPORTED_REVIEW" : "READY_TO_CONFIRM" }).where(eq(documentImportBatches.id, rows[0].row.batchId));
  return { rowId: input.rowId, valid: input.errors.length === 0 };
}

export async function confirmDocumentImportBatchForUser(input: { userId: number; companyId: number; batchId: number }) {
  const batch = await getDocumentImportBatchForUser(input);
  if (batch.status !== "READY_TO_CONFIRM") throw new Error("DOCUMENT_IMPORT_BATCH_NOT_READY");
  if (batch.kind === "documents") throw new Error("FISCAL_DOCUMENT_IMPORT_REQUIRES_REVIEW");
  const invalid = batch.rows.some((row) => row.status === "INVALID");
  if (invalid) throw new Error("DOCUMENT_IMPORT_BATCH_HAS_INVALID_ROWS");
  await dbUpdateDocumentImportStatus(input.batchId, input.companyId, "CONFIRMED");
  return { batchId: input.batchId, status: "CONFIRMED" as const };
}

async function dbUpdateDocumentImportStatus(batchId: number, companyId: number, status: "CONFIRMED" | "REJECTED") {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(documentImportBatches).set({ status }).where(and(eq(documentImportBatches.id, batchId), eq(documentImportBatches.companyId, companyId)));
  if (status === "CONFIRMED") await db.update(documentImportRows).set({ status: "CONFIRMED" }).where(and(eq(documentImportRows.batchId, batchId), eq(documentImportRows.companyId, companyId)));
}

export async function setPrimaryLegalRepresentativeForUser(input: { userId: number; companyId: number; representative: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const representative = input.representative.trim();
  if (representative.length < 3) throw new Error("LEGAL_REPRESENTATIVE_REQUIRED");
  const context = await db.select({ company: companies, organization: organizations }).from(companies).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(companies.id, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  const current = context[0];
  if (!current) throw new Error("COMPANY_NOT_FOUND_OR_FORBIDDEN");
  const representatives = String(current.company.legalRepresentatives ?? "").split(/[;\n]/).map((name) => name.trim().toLowerCase()).filter(Boolean);
  if (!representatives.includes(representative.toLowerCase())) throw new Error("PRIMARY_REPRESENTATIVE_NOT_IN_REGISTER");
  await db.update(companies).set({ primaryLegalRepresentative: representative }).where(eq(companies.id, input.companyId));
  await appendAuditEventForUser({ organizationId: current.organization.id, companyId: input.companyId, actorUserId: input.userId, action: "COMPANY_PRIMARY_REPRESENTATIVE_SET", entityType: "company", entityId: String(input.companyId), beforeState: JSON.stringify({ primaryLegalRepresentative: current.company.primaryLegalRepresentative }), afterState: JSON.stringify({ primaryLegalRepresentative: representative }), correlationId: `company:${input.companyId}:primary-representative` });
  return { companyId: input.companyId, primaryLegalRepresentative: representative };
}

export async function createFiscalExerciseForUser(input: { userId: number; companyId: number; year: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const context = await db.select({ company: companies, organization: organizations }).from(companies).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(companies.id, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  const current = context[0];
  if (!current) throw new Error("COMPANY_NOT_FOUND_OR_FORBIDDEN");
  const existing = await db.select({ exercise: fiscalExercises }).from(fiscalExercises).where(and(eq(fiscalExercises.companyId, input.companyId), eq(fiscalExercises.year, input.year))).limit(1);
  if (existing[0]) return existing[0];
  const inserted = await db.insert(fiscalExercises).values({ companyId: input.companyId, year: input.year, status: "OPEN" });
  await appendAuditEventForUser({ organizationId: current.organization.id, companyId: input.companyId, actorUserId: input.userId, action: "FISCAL_EXERCISE_CREATED", entityType: "fiscalExercise", entityId: String(inserted[0].insertId), beforeState: null, afterState: JSON.stringify({ year: input.year, status: "OPEN" }), correlationId: `company:${input.companyId}:exercise:${input.year}` });
  const created = await db.select({ exercise: fiscalExercises }).from(fiscalExercises).where(eq(fiscalExercises.id, Number(inserted[0].insertId))).limit(1);
  return created[0];
}

export async function createFiscalPeriodForUser(input: { userId: number; companyId: number; year: number; month: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  if (input.month < 1 || input.month > 12) throw new Error("FISCAL_MONTH_INVALID");
  const context = await db.select({ company: companies, organization: organizations }).from(companies).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(companies.id, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  const current = context[0];
  if (!current) throw new Error("COMPANY_NOT_FOUND_OR_FORBIDDEN");
  let exercise = await db.select({ exercise: fiscalExercises }).from(fiscalExercises).where(and(eq(fiscalExercises.companyId, input.companyId), eq(fiscalExercises.year, input.year))).limit(1);
  if (!exercise[0]) { await createFiscalExerciseForUser(input); exercise = await db.select({ exercise: fiscalExercises }).from(fiscalExercises).where(and(eq(fiscalExercises.companyId, input.companyId), eq(fiscalExercises.year, input.year))).limit(1); }
  const existing = await db.select({ period: fiscalPeriods }).from(fiscalPeriods).where(and(eq(fiscalPeriods.companyId, input.companyId), eq(fiscalPeriods.year, input.year), eq(fiscalPeriods.month, input.month))).limit(1);
  if (existing[0]) return existing[0];
  const inserted = await db.insert(fiscalPeriods).values({ companyId: input.companyId, exerciseId: exercise[0]?.exercise.id, year: input.year, month: input.month, status: "OPEN" });
  await appendAuditEventForUser({ organizationId: current.organization.id, companyId: input.companyId, actorUserId: input.userId, action: "FISCAL_PERIOD_CREATED", entityType: "fiscalPeriod", entityId: String(inserted[0].insertId), beforeState: null, afterState: JSON.stringify({ year: input.year, month: input.month, status: "OPEN" }), correlationId: `company:${input.companyId}:period:${input.year}-${input.month}` });
  const created = await db.select({ period: fiscalPeriods }).from(fiscalPeriods).where(eq(fiscalPeriods.id, Number(inserted[0].insertId))).limit(1);
  return created[0];
}

export async function getDocumentSeriesForUserCompany(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ series: documentSeries }).from(documentSeries).innerJoin(companies, eq(documentSeries.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(documentSeries.companyId, companyId), organizationAccessCondition(userId))).orderBy(documentSeries.code, documentSeries.documentType);
}

export async function createDocumentSeriesForUser(input: { userId: number; companyId: number; code: string; documentType: string; nextNumber?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const code = input.code.trim().toUpperCase();
  const documentType = input.documentType.trim().toUpperCase();
  if (code.length < 1 || code.length > 32) throw new Error("DOCUMENT_SERIES_CODE_INVALID");
  if (documentType.length < 1 || documentType.length > 32) throw new Error("DOCUMENT_TYPE_INVALID");
  const nextNumber = input.nextNumber ?? 1;
  if (!Number.isInteger(nextNumber) || nextNumber < 1) throw new Error("DOCUMENT_SERIES_NUMBER_INVALID");
  const context = await db.select({ company: companies, organization: organizations }).from(companies).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(companies.id, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  const current = context[0];
  if (!current) throw new Error("COMPANY_NOT_FOUND_OR_FORBIDDEN");
  const existing = await db.select({ series: documentSeries }).from(documentSeries).where(and(eq(documentSeries.companyId, input.companyId), eq(documentSeries.code, code), eq(documentSeries.documentType, documentType))).limit(1);
  if (existing[0]) return existing[0];
  const inserted = await db.insert(documentSeries).values({ companyId: input.companyId, code, documentType, nextNumber, active: 1 });
  await appendAuditEventForUser({ organizationId: current.organization.id, companyId: input.companyId, actorUserId: input.userId, action: "DOCUMENT_SERIES_CREATED", entityType: "documentSeries", entityId: String(inserted[0].insertId), beforeState: null, afterState: JSON.stringify({ code, documentType, nextNumber, active: 1 }), correlationId: `company:${input.companyId}:series:${code}:${documentType}` });
  const created = await db.select({ series: documentSeries }).from(documentSeries).where(eq(documentSeries.id, Number(inserted[0].insertId))).limit(1);
  return created[0];
}

export async function getChartAccountsForUserCompany(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ account: chartAccounts }).from(chartAccounts).innerJoin(companies, eq(chartAccounts.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(chartAccounts.companyId, companyId), organizationAccessCondition(userId))).orderBy(chartAccounts.code);
}

export async function createChartAccountForUser(input: { userId: number; companyId: number; code: string; name: string; parentCode?: string; postable?: boolean; validFrom: Date; validTo?: Date | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const scope = await db.select({ company: companies, organizationId: organizations.id }).from(companies).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(companies.id, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  if (!scope[0]) throw new Error("COMPANY_NOT_FOUND_OR_FORBIDDEN");
  if (input.parentCode) {
    const parent = await db.select({ id: chartAccounts.id }).from(chartAccounts).where(and(eq(chartAccounts.companyId, input.companyId), eq(chartAccounts.code, input.parentCode))).limit(1);
    if (!parent[0]) throw new Error("PARENT_ACCOUNT_NOT_FOUND_OR_FORBIDDEN");
  }
  const duplicate = await db.select({ id: chartAccounts.id }).from(chartAccounts).where(and(eq(chartAccounts.companyId, input.companyId), eq(chartAccounts.code, input.code.trim()))).limit(1);
  if (duplicate[0]) throw new Error("ACCOUNT_CODE_ALREADY_EXISTS");
  const result = await db.insert(chartAccounts).values({ companyId: input.companyId, code: input.code.trim(), name: input.name.trim(), parentCode: input.parentCode?.trim() || null, postable: input.postable === false ? 0 : 1, validFrom: input.validFrom, validTo: input.validTo ?? null });
  const id = Number(result[0].insertId);
  await appendAuditEventForUser({ organizationId: scope[0].organizationId, companyId: input.companyId, actorUserId: input.userId, action: "CHART_ACCOUNT_CREATED", entityType: "chartAccount", entityId: String(id), beforeState: null, afterState: JSON.stringify({ id, code: input.code.trim(), name: input.name.trim(), parentCode: input.parentCode ?? null, postable: input.postable !== false }), correlationId: `chart-account:${id}` });
  return { id, audited: true };
}

export async function updateChartAccountForUser(input: { userId: number; companyId: number; accountId: number; name?: string; parentCode?: string | null; postable?: boolean; validTo?: Date | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ account: chartAccounts, organizationId: organizations.id }).from(chartAccounts).innerJoin(companies, eq(chartAccounts.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(chartAccounts.id, input.accountId), eq(chartAccounts.companyId, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  const current = rows[0];
  if (!current) throw new Error("ACCOUNT_NOT_FOUND_OR_FORBIDDEN");
  if (input.parentCode) {
    if (input.parentCode === current.account.code) throw new Error("ACCOUNT_PARENT_CYCLE");
    const parent = await db.select({ id: chartAccounts.id }).from(chartAccounts).where(and(eq(chartAccounts.companyId, input.companyId), eq(chartAccounts.code, input.parentCode))).limit(1);
    if (!parent[0]) throw new Error("PARENT_ACCOUNT_NOT_FOUND_OR_FORBIDDEN");
  }
  await db.update(chartAccounts).set({ ...(input.name === undefined ? {} : { name: input.name.trim() }), ...(input.parentCode === undefined ? {} : { parentCode: input.parentCode?.trim() || null }), ...(input.postable === undefined ? {} : { postable: input.postable ? 1 : 0 }), ...(input.validTo === undefined ? {} : { validTo: input.validTo }) }).where(eq(chartAccounts.id, input.accountId));
  await appendAuditEventForUser({ organizationId: current.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "CHART_ACCOUNT_UPDATED", entityType: "chartAccount", entityId: String(input.accountId), beforeState: JSON.stringify(current.account), afterState: JSON.stringify({ ...current.account, ...input }), correlationId: `chart-account:${input.accountId}` });
  return { id: input.accountId, audited: true };
}

export async function getAnalyticalCostCenterReportForUserCompany(input: { userId: number; companyId: number; periodId?: number }) {
  const db = await getDb(); if (!db) return [];
  const conditions = [eq(journalEntries.companyId, input.companyId), organizationAccessCondition(input.userId), eq(journalEntries.status, "POSTED" as const)];
  if (input.periodId) conditions.push(eq(journalEntries.periodId, input.periodId));
  const rows = await db.select({ costCenter: journalEntries.costCenter, dimension: journalEntries.analyticalDimension, debit: journalLines.debit, credit: journalLines.credit, accountCode: chartAccounts.code, accountName: chartAccounts.name }).from(journalEntries).innerJoin(journalLines, eq(journalLines.entryId, journalEntries.id)).innerJoin(chartAccounts, eq(journalLines.accountId, chartAccounts.id)).innerJoin(companies, eq(journalEntries.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(...conditions));
  const groups = new Map<string, { costCenter: string; dimension: string; debit: number; credit: number; saldo: number; lines: number }>();
  for (const row of rows) { const costCenter = row.costCenter ?? "SEM_CENTRO"; const dimension = row.dimension ?? "GERAL"; const key = `${costCenter}:${dimension}`; const current = groups.get(key) ?? { costCenter, dimension, debit: 0, credit: 0, saldo: 0, lines: 0 }; current.debit += Number(row.debit); current.credit += Number(row.credit); current.saldo += Number(row.debit) - Number(row.credit); current.lines += 1; groups.set(key, current); }
  return Array.from(groups.values()).map((group) => ({ ...group, debit: Number(group.debit.toFixed(2)), credit: Number(group.credit.toFixed(2)), saldo: Number(group.saldo.toFixed(2)) })).sort((a, b) => a.costCenter.localeCompare(b.costCenter));
}

export async function getCostCentersForUserCompany(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ center: costCenters }).from(costCenters).innerJoin(companies, eq(costCenters.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(costCenters.companyId, companyId), eq(costCenters.active, 1), organizationAccessCondition(userId))).orderBy(costCenters.code);
}

export async function createCostCenterForUser(input: { userId: number; companyId: number; code: string; name: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const scope = await db.select({ company: companies, organizationId: organizations.id }).from(companies).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(companies.id, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  if (!scope[0]) throw new Error("COMPANY_NOT_FOUND_OR_FORBIDDEN");
  const code = input.code.trim();
  const duplicate = await db.select({ id: costCenters.id }).from(costCenters).where(and(eq(costCenters.companyId, input.companyId), eq(costCenters.code, code))).limit(1);
  if (duplicate[0]) throw new Error("COST_CENTER_CODE_ALREADY_EXISTS");
  const result = await db.insert(costCenters).values({ companyId: input.companyId, code, name: input.name.trim(), active: 1 });
  const id = Number(result[0].insertId);
  await appendAuditEventForUser({ organizationId: scope[0].organizationId, companyId: input.companyId, actorUserId: input.userId, action: "COST_CENTER_CREATED", entityType: "costCenter", entityId: String(id), beforeState: null, afterState: JSON.stringify({ id, code, name: input.name.trim() }), correlationId: `cost-center:${id}` });
  return { id, audited: true };
}

export type AccountingImportRow = { periodId: number; description: string; debitAccountId: number; creditAccountId: number; amount: number; documentReference?: string; journalCode?: string; costCenter?: string; analyticalDimension?: string; idempotencyKey: string };

export async function importJournalEntriesForUser(input: { userId: number; companyId: number; rows: AccountingImportRow[] }) {
  if (input.rows.length === 0 || input.rows.length > 500) throw new Error("IMPORT_ROWS_LIMIT");
  for (const row of input.rows) {
    if (!row.description.trim() || !Number.isInteger(row.debitAccountId) || !Number.isInteger(row.creditAccountId) || !Number.isFinite(row.amount) || row.amount <= 0 || !row.idempotencyKey.trim()) throw new Error("IMPORT_ROW_INVALID");
    const validation = validateBalancedEntry([{ accountId: row.debitAccountId, debit: row.amount, credit: 0, postable: true, validFrom: new Date() }, { accountId: row.creditAccountId, debit: 0, credit: row.amount, postable: true, validFrom: new Date() }]);
    if (!validation.ok) throw new Error(validation.reason);
  }
  const published = [] as Array<{ entryId: number; idempotent: boolean }>;
  for (const row of input.rows) {
    const result = await postJournalEntry({ companyId: input.companyId, periodId: row.periodId, description: row.description.trim(), documentReference: row.documentReference?.trim() || undefined, journalCode: row.journalCode?.trim() || "GERAL", costCenter: row.costCenter?.trim() || undefined, analyticalDimension: row.analyticalDimension?.trim() || undefined, idempotencyKey: row.idempotencyKey.trim(), createdBy: input.userId, lines: [{ accountId: row.debitAccountId, debit: row.amount, credit: 0, postable: true, validFrom: new Date(), currency: "AOA", exchangeRate: 1 }, { accountId: row.creditAccountId, debit: 0, credit: row.amount, postable: true, validFrom: new Date(), currency: "AOA", exchangeRate: 1 }] });
    published.push({ entryId: Number(result.entryId ?? result.entry?.id), idempotent: result.idempotent });
  }
  return { count: published.length, published };
}


export async function createFiscalTaxRecordForUser(input: { userId: number; organizationId: number; companyId: number; periodId: number; taxType: "IVA" | "IAC" | "INDUSTRIAL" | "IRT" | "IEC" | "RETENCAO" | "OUTRO"; direction: "OUTPUT" | "INPUT" | "WITHHELD"; regime?: string; taxCode?: string; baseAmount: number; taxAmount: number; withheldAmount?: number; currency?: string; dueDate?: Date; sourceReference?: string; idempotencyKey: string }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const scope = await db.select({ organizationId: organizations.id }).from(companies).innerJoin(organizations, eq(companies.organizationId, organizations.id)).innerJoin(fiscalPeriods, eq(fiscalPeriods.companyId, companies.id)).where(and(eq(companies.id, input.companyId), eq(companies.organizationId, input.organizationId), eq(fiscalPeriods.id, input.periodId), organizationAccessCondition(input.userId))).limit(1);
  if (!scope[0]) throw new Error("FISCAL_TAX_SCOPE_FORBIDDEN");
  const existing = await db.select({ record: fiscalTaxRecords }).from(fiscalTaxRecords).where(eq(fiscalTaxRecords.idempotencyKey, input.idempotencyKey)).limit(1);
  if (existing[0]) return { record: existing[0].record, idempotent: true };
  const inserted = await db.insert(fiscalTaxRecords).values({ organizationId: input.organizationId, companyId: input.companyId, periodId: input.periodId, taxType: input.taxType, direction: input.direction, regime: input.regime, taxCode: input.taxCode, baseAmount: String(input.baseAmount), taxAmount: String(input.taxAmount), withheldAmount: String(input.withheldAmount ?? 0), currency: input.currency ?? "AOA", dueDate: input.dueDate, sourceReference: input.sourceReference, idempotencyKey: input.idempotencyKey, createdBy: input.userId, status: "CALCULATED" });
  const id = Number(inserted[0].insertId);
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "FISCAL_TAX_RECORD_CREATED", entityType: "fiscalTaxRecord", entityId: String(id), beforeState: null, afterState: JSON.stringify({ ...input, userId: undefined }), correlationId: input.idempotencyKey });
  return { record: { id, ...input, status: "CALCULATED" as const }, idempotent: false };
}

export async function listFiscalTaxRecordsForUser(input: { userId: number; companyId: number; periodId?: number; taxType?: "IVA" | "IAC" | "INDUSTRIAL" | "IRT" | "IEC" | "RETENCAO" | "OUTRO" }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const conditions = [eq(fiscalTaxRecords.companyId, input.companyId), organizationAccessCondition(input.userId)];
  if (input.periodId) conditions.push(eq(fiscalTaxRecords.periodId, input.periodId));
  if (input.taxType) conditions.push(eq(fiscalTaxRecords.taxType, input.taxType));
  return db.select({ record: fiscalTaxRecords }).from(fiscalTaxRecords).innerJoin(companies, eq(fiscalTaxRecords.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(...conditions)).orderBy(desc(fiscalTaxRecords.createdAt));
}

export async function createOpeningBalanceForUser(input: { userId: number; organizationId: number; companyId: number; periodId: number; accountId: number; debit: number; credit: number; currency?: string; reason?: string }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  if (input.debit < 0 || input.credit < 0 || (input.debit === 0 && input.credit === 0) || (input.debit > 0 && input.credit > 0)) throw new Error("OPENING_BALANCE_MUST_HAVE_ONE_SIDE");
  await assertAuditScopeForUser({ actorUserId: input.userId, organizationId: input.organizationId, companyId: input.companyId });
  await assertFiscalPeriodForUserCompany({ actorUserId: input.userId, companyId: input.companyId, periodId: input.periodId });
  const account = await db.select({ account: chartAccounts }).from(chartAccounts).where(and(eq(chartAccounts.id, input.accountId), eq(chartAccounts.companyId, input.companyId), eq(chartAccounts.postable, 1))).limit(1);
  if (!account[0]) throw new Error("OPENING_BALANCE_ACCOUNT_NOT_POSTABLE");
  const inserted = await db.insert(openingBalances).values({ organizationId: input.organizationId, companyId: input.companyId, periodId: input.periodId, accountId: input.accountId, debit: input.debit.toFixed(2), credit: input.credit.toFixed(2), currency: input.currency ?? "AOA", reason: input.reason, createdBy: input.userId, status: "DRAFT" });
  const id = Number(inserted[0].insertId);
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "OPENING_BALANCE_CREATED", entityType: "openingBalance", entityId: String(id), beforeState: null, afterState: JSON.stringify({ ...input, id, status: "DRAFT" }), correlationId: `opening-balance:${input.companyId}:${input.periodId}:${id}` });
  return { id, status: "DRAFT" as const };
}

export async function listOpeningBalancesForUser(input: { userId: number; companyId: number; periodId?: number }) {
  const db = await getDb(); if (!db) return [];
  const conditions = [eq(openingBalances.companyId, input.companyId), organizationAccessCondition(input.userId)];
  if (input.periodId) conditions.push(eq(openingBalances.periodId, input.periodId));
  return db.select({ openingBalance: openingBalances, account: chartAccounts }).from(openingBalances).innerJoin(companies, eq(openingBalances.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).innerJoin(chartAccounts, eq(openingBalances.accountId, chartAccounts.id)).where(and(...conditions)).orderBy(desc(openingBalances.createdAt));
}

type P1AccountingLine = { accountId: number; debit: number; credit: number };
function validateP1AccountingLines(lines: P1AccountingLine[]) {
  if (lines.length < 2) throw new Error("ACCOUNTING_LINES_REQUIRED");
  const debit = lines.reduce((sum, line) => sum + line.debit, 0);
  const credit = lines.reduce((sum, line) => sum + line.credit, 0);
  if (!lines.every((line) => Number.isInteger(line.accountId) && line.accountId > 0 && line.debit >= 0 && line.credit >= 0 && (line.debit === 0 || line.credit === 0))) throw new Error("ACCOUNTING_LINE_INVALID");
  if (debit <= 0 || Math.abs(debit - credit) > 0.01) throw new Error("ACCOUNTING_LINES_UNBALANCED");
  return { debit: Number(debit.toFixed(2)), credit: Number(credit.toFixed(2)) };
}

export async function createAccountingAdjustmentForUser(input: { userId: number; organizationId: number; companyId: number; periodId: number; adjustmentType: "REGULARIZACAO" | "RECLASSIFICACAO" | "ACRESCIMO" | "DIFERIMENTO" | "CORRECCAO"; reason: string; lines: P1AccountingLine[] }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  if (!input.reason.trim()) throw new Error("ADJUSTMENT_REASON_REQUIRED");
  const totals = validateP1AccountingLines(input.lines);
  await assertAuditScopeForUser({ actorUserId: input.userId, organizationId: input.organizationId, companyId: input.companyId });
  await assertFiscalPeriodForUserCompany({ actorUserId: input.userId, companyId: input.companyId, periodId: input.periodId });
  const inserted = await db.insert(accountingAdjustments).values({ organizationId: input.organizationId, companyId: input.companyId, periodId: input.periodId, adjustmentType: input.adjustmentType, reason: input.reason.trim(), linesJson: JSON.stringify(input.lines), createdBy: input.userId, status: "DRAFT" });
  const id = Number(inserted[0].insertId);
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "ACCOUNTING_ADJUSTMENT_CREATED", entityType: "accountingAdjustment", entityId: String(id), beforeState: null, afterState: JSON.stringify({ ...input, id, status: "DRAFT" }), correlationId: `accounting-adjustment:${input.companyId}:${input.periodId}:${id}` });
  return { id, status: "DRAFT" as const, ...totals };
}

export async function reviewOpeningBalanceForUser(input: { userId: number; companyId: number; openingBalanceId: number; decision: "VALIDATED" | "REJECTED"; reason?: string }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ openingBalance: openingBalances, organizationId: companies.organizationId }).from(openingBalances).innerJoin(companies, eq(openingBalances.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(openingBalances.id, input.openingBalanceId), eq(openingBalances.companyId, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  if (!rows[0] || rows[0].openingBalance.status !== "DRAFT") throw new Error("OPENING_BALANCE_NOT_REVIEWABLE");
  await db.update(openingBalances).set({ status: input.decision, validatedBy: input.userId, validatedAt: new Date(), reason: input.reason?.trim() || rows[0].openingBalance.reason }).where(eq(openingBalances.id, input.openingBalanceId));
  await appendAuditEventForUser({ organizationId: rows[0].organizationId, companyId: input.companyId, actorUserId: input.userId, action: input.decision === "VALIDATED" ? "OPENING_BALANCE_VALIDATED" : "OPENING_BALANCE_REJECTED", entityType: "openingBalance", entityId: String(input.openingBalanceId), beforeState: JSON.stringify({ status: "DRAFT" }), afterState: JSON.stringify({ status: input.decision, reason: input.reason ?? null }), correlationId: `opening-review:${input.openingBalanceId}` });
  return { id: input.openingBalanceId, status: input.decision } as const;
}

export async function publishOpeningBalancesForUser(input: { userId: number; companyId: number; periodId: number }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ openingBalance: openingBalances, organizationId: companies.organizationId }).from(openingBalances).innerJoin(companies, eq(openingBalances.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(openingBalances.companyId, input.companyId), eq(openingBalances.periodId, input.periodId), eq(openingBalances.status, "VALIDATED" as const), organizationAccessCondition(input.userId)));
  if (!rows.length) throw new Error("OPENING_BALANCES_NOT_READY");
  const totals = validateP1AccountingLines(rows.map(({ openingBalance }) => ({ accountId: openingBalance.accountId, debit: Number(openingBalance.debit), credit: Number(openingBalance.credit) })));
  const entry = await postJournalEntry({ companyId: input.companyId, periodId: input.periodId, idempotencyKey: `opening-post:${input.companyId}:${input.periodId}`, description: "Saldos iniciais do período", journalCode: "ABERTURA", createdBy: input.userId, lines: rows.map(({ openingBalance }) => ({ accountId: openingBalance.accountId, debit: Number(openingBalance.debit), credit: Number(openingBalance.credit), postable: true, validFrom: new Date(), currency: openingBalance.currency, exchangeRate: 1 })) });
  await db.update(openingBalances).set({ status: "POSTED", journalEntryId: entry.entryId }).where(and(eq(openingBalances.companyId, input.companyId), eq(openingBalances.periodId, input.periodId), eq(openingBalances.status, "VALIDATED" as const)));
  return { entryId: entry.entryId, ...totals, status: "POSTED" as const };
}

export async function reviewAccountingAdjustmentForUser(input: { userId: number; companyId: number; adjustmentId: number; decision: "APPROVED" | "REJECTED"; reason?: string }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ adjustment: accountingAdjustments, organizationId: companies.organizationId }).from(accountingAdjustments).innerJoin(companies, eq(accountingAdjustments.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(accountingAdjustments.id, input.adjustmentId), eq(accountingAdjustments.companyId, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  if (!rows[0] || rows[0].adjustment.status !== "DRAFT") throw new Error("ACCOUNTING_ADJUSTMENT_NOT_REVIEWABLE");
  if (!rows[0].adjustment.linesJson) throw new Error("ACCOUNTING_LINES_REQUIRED");
  validateP1AccountingLines(JSON.parse(rows[0].adjustment.linesJson) as P1AccountingLine[]);
  await db.update(accountingAdjustments).set({ status: input.decision, reviewedBy: input.userId, reviewedAt: new Date(), reason: input.reason?.trim() || rows[0].adjustment.reason }).where(eq(accountingAdjustments.id, input.adjustmentId));
  await appendAuditEventForUser({ organizationId: rows[0].organizationId, companyId: input.companyId, actorUserId: input.userId, action: input.decision === "APPROVED" ? "ACCOUNTING_ADJUSTMENT_APPROVED" : "ACCOUNTING_ADJUSTMENT_REJECTED", entityType: "accountingAdjustment", entityId: String(input.adjustmentId), beforeState: JSON.stringify({ status: "DRAFT" }), afterState: JSON.stringify({ status: input.decision, reason: input.reason ?? null }), correlationId: `adjustment-review:${input.adjustmentId}` });
  return { id: input.adjustmentId, status: input.decision } as const;
}

export async function publishAccountingAdjustmentForUser(input: { userId: number; companyId: number; adjustmentId: number }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ adjustment: accountingAdjustments }).from(accountingAdjustments).innerJoin(companies, eq(accountingAdjustments.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(accountingAdjustments.id, input.adjustmentId), eq(accountingAdjustments.companyId, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  if (!rows[0] || rows[0].adjustment.status !== "APPROVED" || !rows[0].adjustment.linesJson) throw new Error("ACCOUNTING_ADJUSTMENT_NOT_READY");
  const lines = JSON.parse(rows[0].adjustment.linesJson) as P1AccountingLine[]; validateP1AccountingLines(lines);
  const entry = await postJournalEntry({ companyId: input.companyId, periodId: rows[0].adjustment.periodId, idempotencyKey: `adjustment-post:${input.adjustmentId}`, description: rows[0].adjustment.reason, journalCode: "OPERACOES_DIVERSAS", createdBy: input.userId, lines: lines.map((line) => ({ ...line, postable: true, validFrom: new Date(), currency: "AOA", exchangeRate: 1 })) });
  await db.update(accountingAdjustments).set({ status: "POSTED", journalEntryId: entry.entryId }).where(eq(accountingAdjustments.id, input.adjustmentId));
  return { id: input.adjustmentId, entryId: entry.entryId, status: "POSTED" as const };
}

export async function listAccountingAdjustmentsForUser(input: { userId: number; companyId: number; periodId?: number }) {
  const db = await getDb(); if (!db) return [];
  const conditions = [eq(accountingAdjustments.companyId, input.companyId), organizationAccessCondition(input.userId)];
  if (input.periodId) conditions.push(eq(accountingAdjustments.periodId, input.periodId));
  return db.select({ adjustment: accountingAdjustments }).from(accountingAdjustments).innerJoin(companies, eq(accountingAdjustments.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(...conditions)).orderBy(desc(accountingAdjustments.createdAt));
}

export async function getFiscalObligationsForUserCompany(input: { userId: number; companyId: number; year: number; periodId?: number }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const scope = await db.select({ company: companies, organizationId: organizations.id }).from(companies).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(companies.id, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  if (!scope[0]) throw new Error("COMPANY_NOT_FOUND_OR_FORBIDDEN");
  const conditions = [eq(fiscalTaxRecords.companyId, input.companyId), gte(fiscalTaxRecords.dueDate, new Date(`${input.year}-01-01T00:00:00.000Z`)), lte(fiscalTaxRecords.dueDate, new Date(`${input.year}-12-31T23:59:59.999Z`))];
  if (input.periodId) conditions.push(eq(fiscalTaxRecords.periodId, input.periodId));
  const records = await db.select({ record: fiscalTaxRecords }).from(fiscalTaxRecords).where(and(...conditions)).orderBy(fiscalTaxRecords.dueDate);
  return { companyId: input.companyId, year: input.year, obligations: records.map(({ record }) => ({ id: record.id, kind: record.taxType, code: record.taxCode ?? record.taxType, dueDate: record.dueDate, amount: record.taxAmount, withheldAmount: record.withheldAmount, currency: record.currency, status: record.status, periodId: record.periodId, sourceReference: record.sourceReference })) };
}

export async function importBankStatementForUser(input: { userId: number; organizationId: number; companyId: number; cashAccountId: number; statementDate: Date; openingBalance: number; closingBalance: number; currency?: string; originalFilename: string; rows: Array<{ bookingDate: Date; valueDate: Date; description: string; externalReference?: string; counterparty?: string; direction: "IN" | "OUT"; amount: number; balance?: number }> }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const account = await db.select({ account: cashAccounts }).from(cashAccounts).innerJoin(companies, eq(cashAccounts.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(cashAccounts.id, input.cashAccountId), eq(cashAccounts.companyId, input.companyId), eq(companies.organizationId, input.organizationId), organizationAccessCondition(input.userId))).limit(1);
  if (!account[0]) throw new Error("CASH_ACCOUNT_NOT_FOUND_OR_FORBIDDEN");
  const payload = JSON.stringify({ companyId: input.companyId, cashAccountId: input.cashAccountId, statementDate: input.statementDate.toISOString(), openingBalance: input.openingBalance, closingBalance: input.closingBalance, currency: input.currency ?? "AOA", filename: input.originalFilename, rows: input.rows });
  const sha256 = createHash("sha256").update(payload).digest("hex");
  const existing = await db.select({ importRow: bankStatementImports }).from(bankStatementImports).where(eq(bankStatementImports.sha256, sha256)).limit(1);
  if (existing[0]) return { importRow: existing[0].importRow, idempotent: true };
  const inserted = await db.insert(bankStatementImports).values({ organizationId: input.organizationId, companyId: input.companyId, cashAccountId: input.cashAccountId, statementDate: input.statementDate, openingBalance: String(input.openingBalance), closingBalance: String(input.closingBalance), currency: input.currency ?? account[0].account.currency, originalFilename: input.originalFilename, sha256, idempotencyKey: `extracto:${sha256}`, createdBy: input.userId, status: "IMPORTED" });
  const importId = Number(inserted[0].insertId);
  for (const row of input.rows) {
    const fingerprint = createHash("sha256").update(JSON.stringify({ importId, ...row })).digest("hex");
    await db.insert(bankStatementLines).values({ importId, companyId: input.companyId, bookingDate: row.bookingDate, valueDate: row.valueDate, description: row.description, externalReference: row.externalReference, counterparty: row.counterparty, direction: row.direction, amount: String(row.amount), balance: row.balance === undefined ? undefined : String(row.balance), fingerprint, status: "UNMATCHED" });
  }
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "BANK_STATEMENT_IMPORTED", entityType: "bankStatementImport", entityId: String(importId), beforeState: null, afterState: JSON.stringify({ importId, cashAccountId: input.cashAccountId, statementDate: input.statementDate, rowCount: input.rows.length, sha256 }), correlationId: `extracto:${sha256}` });
  return { importRow: { id: importId, sha256, rowCount: input.rows.length, status: "IMPORTED" as const }, idempotent: false };
}

export async function listBankStatementLinesForUser(input: { userId: number; companyId: number; cashAccountId?: number; importId?: number; status?: "UNMATCHED" | "SUGGESTED" | "MATCHED" | "EXCEPTION" }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const conditions = [eq(bankStatementLines.companyId, input.companyId), organizationAccessCondition(input.userId)];
  if (input.importId) conditions.push(eq(bankStatementLines.importId, input.importId));
  if (input.status) conditions.push(eq(bankStatementLines.status, input.status));
  if (input.cashAccountId) conditions.push(eq(bankStatementImports.cashAccountId, input.cashAccountId));
  return db.select({ line: bankStatementLines, importRow: bankStatementImports }).from(bankStatementLines).innerJoin(bankStatementImports, eq(bankStatementLines.importId, bankStatementImports.id)).innerJoin(companies, eq(bankStatementLines.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(...conditions)).orderBy(desc(bankStatementLines.valueDate));
}

export async function matchBankStatementLineForUser(input: { userId: number; companyId: number; organizationId: number; lineId: number; treasuryTransactionId: number; reason?: string }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ line: bankStatementLines, importRow: bankStatementImports }).from(bankStatementLines).innerJoin(bankStatementImports, eq(bankStatementLines.importId, bankStatementImports.id)).innerJoin(companies, eq(bankStatementLines.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(bankStatementLines.id, input.lineId), eq(bankStatementLines.companyId, input.companyId), eq(companies.organizationId, input.organizationId), organizationAccessCondition(input.userId))).limit(1);
  if (!rows[0]) throw new Error("BANK_STATEMENT_LINE_NOT_FOUND_OR_FORBIDDEN");
  const transaction = await db.select({ transaction: treasuryTransactions }).from(treasuryTransactions).innerJoin(companies, eq(treasuryTransactions.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(treasuryTransactions.id, input.treasuryTransactionId), eq(treasuryTransactions.companyId, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  if (!transaction[0]) throw new Error("TREASURY_TRANSACTION_NOT_FOUND_OR_FORBIDDEN");
  await db.update(bankStatementLines).set({ matchedTreasuryTransactionId: input.treasuryTransactionId, status: "MATCHED" }).where(eq(bankStatementLines.id, input.lineId));
  await db.update(treasuryTransactions).set({ reconciliationStatus: "RECONCILED" }).where(eq(treasuryTransactions.id, input.treasuryTransactionId));
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "BANK_STATEMENT_LINE_MATCHED", entityType: "bankStatementLine", entityId: String(input.lineId), beforeState: JSON.stringify({ status: rows[0].line.status, matchedTreasuryTransactionId: rows[0].line.matchedTreasuryTransactionId }), afterState: JSON.stringify({ status: "MATCHED", matchedTreasuryTransactionId: input.treasuryTransactionId, reason: input.reason ?? null }), correlationId: `extracto-linha:${input.lineId}` });
  return { lineId: input.lineId, treasuryTransactionId: input.treasuryTransactionId, status: "MATCHED" as const };
}


export async function reviewJournalEntryForUser(input: { userId: number; companyId: number; entryId: number; decision: "APPROVED" | "REJECTED"; reason?: string }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ entry: journalEntries, organizationId: companies.organizationId }).from(journalEntries).innerJoin(companies, eq(journalEntries.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(journalEntries.id, input.entryId), eq(journalEntries.companyId, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  if (!rows[0]) throw new Error("JOURNAL_ENTRY_NOT_FOUND_OR_FORBIDDEN");
  if (rows[0].entry.reviewStatus !== "PENDING") throw new Error("JOURNAL_ENTRY_ALREADY_REVIEWED");
  if (rows[0].entry.createdBy === input.userId) throw new Error("JOURNAL_ENTRY_CREATOR_CANNOT_REVIEW");
  await db.update(journalEntries).set({ reviewStatus: input.decision, reviewedBy: input.userId, reviewedAt: new Date() }).where(and(eq(journalEntries.id, input.entryId), eq(journalEntries.companyId, input.companyId), eq(journalEntries.reviewStatus, "PENDING")));
  await appendAuditEventForUser({ organizationId: rows[0].organizationId, companyId: input.companyId, actorUserId: input.userId, action: input.decision === "APPROVED" ? "JOURNAL_ENTRY_APPROVED" : "JOURNAL_ENTRY_REJECTED", entityType: "journalEntry", entityId: String(input.entryId), beforeState: JSON.stringify({ reviewStatus: "PENDING" }), afterState: JSON.stringify({ reviewStatus: input.decision, reason: input.reason ?? null }), correlationId: `journal-review:${input.entryId}` });
  return { id: input.entryId, reviewStatus: input.decision } as const;
}

export async function listPendingJournalEntriesForUser(input: { userId: number; companyId: number; periodId?: number }) {
  const db = await getDb(); if (!db) return [];
  const conditions = [eq(journalEntries.companyId, input.companyId), eq(journalEntries.reviewStatus, "PENDING" as const), organizationAccessCondition(input.userId)];
  if (input.periodId) conditions.push(eq(journalEntries.periodId, input.periodId));
  return db.select({ entry: journalEntries }).from(journalEntries).innerJoin(companies, eq(journalEntries.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(...conditions)).orderBy(desc(journalEntries.createdAt));
}


export async function transferBetweenCashAccountsForUser(input: { userId: number; organizationId: number; companyId: number; periodId?: number; fromCashAccountId: number; toCashAccountId: number; amount: number; valueDate: Date; correlationId: string }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  if (input.fromCashAccountId === input.toCashAccountId) throw new Error("TRANSFER_ACCOUNTS_MUST_DIFFER");
  if (input.amount <= 0) throw new Error("TRANSFER_AMOUNT_INVALID");
  await assertAuditScopeForUser({ actorUserId: input.userId, organizationId: input.organizationId, companyId: input.companyId });
  if (input.periodId) await assertFiscalPeriodForUserCompany({ actorUserId: input.userId, companyId: input.companyId, periodId: input.periodId });
  const accounts = await db.select({ account: cashAccounts }).from(cashAccounts).innerJoin(companies, eq(cashAccounts.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(cashAccounts.companyId, input.companyId), sql`${cashAccounts.id} in (${input.fromCashAccountId}, ${input.toCashAccountId})`, organizationAccessCondition(input.userId)));
  if (accounts.length !== 2) throw new Error("TRANSFER_ACCOUNT_NOT_FOUND_OR_FORBIDDEN");
  if (accounts[0].account.currency !== accounts[1].account.currency) throw new Error("TRANSFER_CURRENCY_MUST_MATCH");
  const existing = await db.select({ id: treasuryTransactions.id }).from(treasuryTransactions).where(and(eq(treasuryTransactions.companyId, input.companyId), eq(treasuryTransactions.correlationId, input.correlationId))).limit(1);
  if (existing[0]) return { correlationId: input.correlationId, idempotent: true };
  const result = await db.transaction(async (tx) => {
    const out = await tx.insert(treasuryTransactions).values({ companyId: input.companyId, periodId: input.periodId, cashAccountId: input.fromCashAccountId, direction: "OUT", amount: input.amount.toFixed(2), valueDate: input.valueDate, correlationId: input.correlationId });
    const into = await tx.insert(treasuryTransactions).values({ companyId: input.companyId, periodId: input.periodId, cashAccountId: input.toCashAccountId, direction: "IN", amount: input.amount.toFixed(2), valueDate: input.valueDate, correlationId: input.correlationId });
    return { outId: Number(out[0].insertId), intoId: Number(into[0].insertId) };
  });
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "TREASURY_INTERNAL_TRANSFER_CREATED", entityType: "treasuryTransfer", entityId: input.correlationId, beforeState: null, afterState: JSON.stringify({ ...input, amount: input.amount.toFixed(2), outId: result.outId, intoId: result.intoId }), correlationId: input.correlationId });
  return { ...result, correlationId: input.correlationId, idempotent: false };
}


export async function approvePaymentForUser(input: { userId: number; companyId: number; paymentId: number; executionReference?: string }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ payment: payments, organizationId: companies.organizationId }).from(payments).innerJoin(companies, eq(payments.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(payments.id, input.paymentId), eq(payments.companyId, input.companyId), organizationAccessCondition(input.userId))).limit(1);
  if (!rows[0]) throw new Error("PAYMENT_NOT_FOUND_OR_FORBIDDEN");
  if (rows[0].payment.createdBy === input.userId) throw new Error("PAYMENT_CREATOR_CANNOT_APPROVE");
  if (rows[0].payment.approvalStatus === "APPROVED") return { paymentId: input.paymentId, idempotent: true };
  if (rows[0].payment.approvalStatus !== "PENDING") throw new Error("PAYMENT_ALREADY_REVIEWED");
  if (rows[0].payment.method === "BANK_TRANSFER" && !input.executionReference?.trim()) throw new Error("PAYMENT_EXECUTION_REFERENCE_REQUIRED");
  await db.transaction(async (tx) => {
    await tx.update(payments).set({ approvalStatus: "APPROVED", approvedBy: input.userId, approvedAt: new Date(), executionReference: input.executionReference, status: "CONFIRMED" }).where(and(eq(payments.id, input.paymentId), eq(payments.companyId, input.companyId), eq(payments.approvalStatus, "PENDING")));
    if (rows[0].payment.cashAccountId) {
      const existing = await tx.select({ id: treasuryTransactions.id }).from(treasuryTransactions).where(and(eq(treasuryTransactions.paymentId, input.paymentId), eq(treasuryTransactions.companyId, input.companyId))).limit(1);
      if (!existing[0]) await tx.insert(treasuryTransactions).values({ companyId: input.companyId, periodId: rows[0].payment.periodId, cashAccountId: rows[0].payment.cashAccountId, paymentId: input.paymentId, direction: rows[0].payment.direction === "RECEIPT" ? "IN" : "OUT", amount: rows[0].payment.amount, valueDate: rows[0].payment.paidAt, correlationId: `payment:${input.paymentId}` });
    }
    if (rows[0].payment.documentId) await tx.update(businessDocuments).set({ settledAmount: sql`LEAST(${businessDocuments.totalAmount}, ${businessDocuments.settledAmount} + ${rows[0].payment.amount})` }).where(and(eq(businessDocuments.id, rows[0].payment.documentId), eq(businessDocuments.companyId, input.companyId), sql`${businessDocuments.status} IN ('ISSUED','ACCOUNTED')`));
  });
  await appendAuditEventForUser({ organizationId: rows[0].organizationId, companyId: input.companyId, actorUserId: input.userId, action: "PAYMENT_APPROVED_EXECUTED", entityType: "payment", entityId: String(input.paymentId), beforeState: JSON.stringify({ approvalStatus: "PENDING" }), afterState: JSON.stringify({ approvalStatus: "APPROVED", status: "CONFIRMED", executionReference: input.executionReference ?? null }), correlationId: `payment-approval:${input.paymentId}` });
  return { paymentId: input.paymentId, idempotent: false };
}

export async function getFinancialDashboardForUserCompany(input: { userId: number; companyId: number; periodId?: number; comparisonPeriodId?: number; costCenter?: string; analyticalDimension?: string }) {
  const [currentRows, customerAging, supplierAging, fiscalRegister, periodRows] = await Promise.all([
    getJournalRowsForUserCompany(input.userId, input.companyId, input.periodId),
    getAgingForUserCompany(input.userId, input.companyId, "CUSTOMER", new Date()),
    getAgingForUserCompany(input.userId, input.companyId, "SUPPLIER", new Date()),
    getFiscalRegisterForUserCompany(input.userId, input.companyId),
    getPeriodsForUserCompany(input.userId, input.companyId),
  ]);
  const currentPeriod = periodRows.find(({ period }) => period.id === input.periodId)?.period ?? periodRows[0]?.period;
  const automaticComparison = currentPeriod ? periodRows.find(({ period }) => period.year === currentPeriod.year - 1 && period.month === currentPeriod.month)?.period.id : undefined;
  const resolvedComparisonPeriodId = input.comparisonPeriodId ?? automaticComparison;
  const comparisonRows = resolvedComparisonPeriodId ? await getJournalRowsForUserCompany(input.userId, input.companyId, resolvedComparisonPeriodId) : [];
  const matches = (row: JournalRow) => (!input.costCenter || row.costCenter === input.costCenter) && (!input.analyticalDimension || row.analyticalDimension === input.analyticalDimension);
  const rows = currentRows.filter(matches);
  const comparisonFilteredRows = comparisonRows.filter(matches);
  const journal = buildJournal(rows);
  const comparisonJournal = buildJournal(comparisonFilteredRows);
  const incomeStatement = buildIncomeStatement(rows.map(({ accountCode, accountName, debit, credit }) => ({ accountCode, accountName, debit, credit })));
  const balanceSheet = buildBalanceSheet(rows.map(({ accountCode, accountName, debit, credit }) => ({ accountCode, accountName, debit, credit })));
  const comparisonIncomeStatement = buildIncomeStatement(comparisonFilteredRows.map(({ accountCode, accountName, debit, credit }) => ({ accountCode, accountName, debit, credit })));
  const monthly = new Map<string, { period: string; revenue: number; expenses: number; result: number; debit: number; credit: number }>();
  for (const row of journal.entries) {
    const date = new Date(row.createdAt);
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    const current = monthly.get(key) ?? { period: `${String(date.getUTCMonth() + 1).padStart(2, "0")}/${date.getUTCFullYear()}`, revenue: 0, expenses: 0, result: 0, debit: 0, credit: 0 };
    const amount = Number(row.debit) - Number(row.credit);
    if (row.accountCode.startsWith("7")) current.revenue += Number(row.credit) - Number(row.debit);
    if (row.accountCode.startsWith("6")) current.expenses += amount;
    current.debit += Number(row.debit);
    current.credit += Number(row.credit);
    current.result = current.revenue - current.expenses;
    monthly.set(key, current);
  }
  const monthlySeries = Array.from(monthly.values()).sort((a, b) => a.period.localeCompare(b.period)).slice(-12).map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, typeof value === "number" ? Number(value.toFixed(2)) : value])));
  const revenueRows = incomeStatement.rows.filter((row) => row.accountCode.startsWith("7")).sort((a, b) => Math.abs(b.credit - b.debit) - Math.abs(a.credit - a.debit)).slice(0, 8).map((row) => ({ accountCode: row.accountCode, label: row.accountName, amount: Number(Math.abs(row.credit - row.debit).toFixed(2)) }));
  const expenseRows = incomeStatement.rows.filter((row) => row.accountCode.startsWith("6")).sort((a, b) => Math.abs(b.debit - b.credit) - Math.abs(a.debit - a.credit)).slice(0, 8).map((row) => ({ accountCode: row.accountCode, label: row.accountName, amount: Number(Math.abs(row.debit - row.credit).toFixed(2)) }));
  return {
    companyId: input.companyId,
    periodId: input.periodId ?? null,
    comparisonPeriodId: resolvedComparisonPeriodId ?? null,
    filters: { costCenter: input.costCenter ?? null, analyticalDimension: input.analyticalDimension ?? null },
    currency: "AOA",
    kpis: {
      revenue: incomeStatement.revenue,
      expenses: incomeStatement.expenses,
      netIncome: incomeStatement.netIncome,
      receivable: customerAging.totals.outstanding,
      payable: supplierAging.totals.outstanding,
      treasuryBalance: balanceSheet.assets - customerAging.totals.outstanding,
      documentsTotal: fiscalRegister.totals.totalAmount,
    },
    comparison: { revenue: comparisonIncomeStatement.revenue, expenses: comparisonIncomeStatement.expenses, netIncome: comparisonIncomeStatement.netIncome, debit: comparisonJournal.totals.debit, credit: comparisonJournal.totals.credit },
    monthlySeries,
    revenueRows,
    expenseRows,
    aging: { receivable: customerAging.totals, payable: supplierAging.totals },
    reconciliation: { debit: journal.totals.debit, credit: journal.totals.credit, balanced: Math.abs(journal.totals.debit - journal.totals.credit) <= 0.005 },
  };
}
