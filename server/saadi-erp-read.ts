import { createHash } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { businessDocuments, employees, fiscalTaxRecords, payments, pgcAccounts, pgcSources, pgcVersions, purchaseOrders, stockMovements, treasuryTransactions } from "../drizzle/schema";
import { getBalanceSheetForUserCompany, getCompaniesForUser, getDb, getIncomeStatementForUserCompany, getTrialBalanceForUserCompany } from "./db";

export type SaadiDataClass = "ACTUAL_REALIZED";

export type SaadiReadEnvelope<T> = {
  organizationId: number;
  companyId: number;
  asOf: string;
  sourceSystem: "BALANCERTS.ERP";
  sourceService: string;
  sourceVersion: "erp-read-v1";
  dataClass: SaadiDataClass;
  authority: "ERP";
  data: T;
  integrityHash: string;
};

function hash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value, (_key, item) => item instanceof Date ? item.toISOString() : item)).digest("hex");
}

function envelope<T>(input: Omit<SaadiReadEnvelope<T>, "integrityHash">): SaadiReadEnvelope<T> {
  return { ...input, integrityHash: hash(input) };
}

export async function readSaadiCompanyContext(userId: number, companyId: number) {
  const companies = await getCompaniesForUser(userId);
  const match = companies.find((entry) => entry.company.id === companyId);
  if (!match) throw new Error("SAADI_ERP_COMPANY_NOT_FOUND_OR_FORBIDDEN");
  return envelope({ organizationId: match.company.organizationId, companyId, asOf: new Date().toISOString(), sourceSystem: "BALANCERTS.ERP", sourceService: "companies.read", sourceVersion: "erp-read-v1", dataClass: "ACTUAL_REALIZED", authority: "ERP", data: { company: match.company } });
}

async function contextFor(userId: number, companyId: number) {
  const context = await readSaadiCompanyContext(userId, companyId);
  return { context, organizationId: context.organizationId };
}

export async function readSaadiOperationalSummary(userId: number, companyId: number, periodId?: number) {
  const { context, organizationId } = await contextFor(userId, companyId);
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [documents, purchases, paymentsSummary, treasury, stock, humanResources, taxes] = await Promise.all([
    db.select({ total: sql<number>`count(*)`, gross: sql<string>`coalesce(sum(totalAmount), 0)` }).from(businessDocuments).where(eq(businessDocuments.companyId, companyId)),
    db.select({ total: sql<number>`count(*)` }).from(purchaseOrders).where(and(eq(purchaseOrders.organizationId, organizationId), eq(purchaseOrders.companyId, companyId))),
    db.select({ total: sql<number>`count(*)`, amount: sql<string>`coalesce(sum(amount), 0)` }).from(payments).where(and(eq(payments.organizationId, organizationId), eq(payments.companyId, companyId))),
    db.select({ total: sql<number>`count(*)`, amountIn: sql<string>`coalesce(sum(case when direction = 'IN' then amount else 0 end), 0)`, amountOut: sql<string>`coalesce(sum(case when direction = 'OUT' then amount else 0 end), 0)` }).from(treasuryTransactions).where(eq(treasuryTransactions.companyId, companyId)),
    db.select({ total: sql<number>`count(*)`, quantity: sql<string>`coalesce(sum(quantity), 0)` }).from(stockMovements).where(and(eq(stockMovements.organizationId, organizationId), eq(stockMovements.companyId, companyId))),
    db.select({ total: sql<number>`count(*)` }).from(employees).where(and(eq(employees.organizationId, organizationId), eq(employees.companyId, companyId))),
    db.select({ total: sql<number>`count(*)`, amount: sql<string>`coalesce(sum(taxAmount), 0)` }).from(fiscalTaxRecords).where(and(eq(fiscalTaxRecords.organizationId, organizationId), eq(fiscalTaxRecords.companyId, companyId))),
  ]);
  return envelope({ organizationId, companyId, asOf: context.asOf, sourceSystem: "BALANCERTS.ERP", sourceService: "operational-domains.read", sourceVersion: "erp-read-v1", dataClass: "ACTUAL_REALIZED", authority: "ERP", data: { periodId: periodId ?? null, commercial: documents[0] ?? { total: 0, gross: "0" }, purchases: purchases[0] ?? { total: 0 }, treasury: treasury[0] ?? { total: 0, amountIn: "0", amountOut: "0" }, payments: paymentsSummary[0] ?? { total: 0, amount: "0" }, stock: stock[0] ?? { total: 0, quantity: "0" }, humanResources: humanResources[0] ?? { total: 0 }, fiscality: taxes[0] ?? { total: 0, amount: "0" } } });
}

export async function readSaadiPgcNormativeContext(userId: number, companyId: number) {
  const { context, organizationId } = await contextFor(userId, companyId);
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [versions] = await Promise.all([
    db.select().from(pgcVersions).where(and(eq(pgcVersions.organizationId, organizationId), eq(pgcVersions.status, "ACTIVE"))).orderBy(desc(pgcVersions.effectiveFrom)).limit(1),
  ]);
  const version = versions[0] ?? null;
  if (!version) return envelope({ organizationId, companyId, asOf: context.asOf, sourceSystem: "BALANCERTS.ERP", sourceService: "pgc.normative.read", sourceVersion: "erp-read-v1", dataClass: "ACTUAL_REALIZED", authority: "ERP", data: { version: null, sources: [], accounts: [], confirmedOnly: true, available: false } });
  const [sources, accounts] = await Promise.all([
    db.select({ id: pgcSources.id, instrument: pgcSources.instrument, instrumentNumber: pgcSources.instrumentNumber, article: pgcSources.article, title: pgcSources.title, effectiveFrom: pgcSources.effectiveFrom, sourceUrl: pgcSources.sourceUrl }).from(pgcSources).where(and(eq(pgcSources.organizationId, organizationId), eq(pgcSources.versionId, version.id), eq(pgcSources.verificationStatus, "CONFIRMED"))).orderBy(pgcSources.id),
    db.select({ id: pgcAccounts.id, code: pgcAccounts.code, name: pgcAccounts.name, classCode: pgcAccounts.classCode, parentCode: pgcAccounts.parentCode, level: pgcAccounts.level, accountType: pgcAccounts.accountType, nature: pgcAccounts.nature, balanceType: pgcAccounts.balanceType, acceptsEntries: pgcAccounts.acceptsEntries, fiscal: pgcAccounts.fiscal, iva: pgcAccounts.iva }).from(pgcAccounts).where(and(eq(pgcAccounts.organizationId, organizationId), eq(pgcAccounts.versionId, version.id), eq(pgcAccounts.active, 1), eq(pgcAccounts.validationStatus, "CONFIRMED"))).orderBy(pgcAccounts.code),
  ]);
  return envelope({ organizationId, companyId, asOf: context.asOf, sourceSystem: "BALANCERTS.ERP", sourceService: "pgc.normative.read", sourceVersion: "erp-read-v1", dataClass: "ACTUAL_REALIZED", authority: "ERP", data: { version: { id: version.id, code: version.code, name: version.name, effectiveFrom: version.effectiveFrom, status: version.status }, sources, accounts, confirmedOnly: true, available: true } });
}

export async function readSaadiAccountingSummary(userId: number, companyId: number, periodId?: number) {
  const { context, organizationId } = await contextFor(userId, companyId);
  const [trialBalance, incomeStatement, balanceSheet] = await Promise.all([
    getTrialBalanceForUserCompany(userId, companyId, periodId),
    getIncomeStatementForUserCompany(userId, companyId, periodId),
    getBalanceSheetForUserCompany(userId, companyId, periodId),
  ]);
  return envelope({ organizationId, companyId, asOf: context.asOf, sourceSystem: "BALANCERTS.ERP", sourceService: "accounting.read", sourceVersion: "erp-read-v1", dataClass: "ACTUAL_REALIZED", authority: "ERP", data: { periodId: periodId ?? null, trialBalance, incomeStatement, balanceSheet } });
}
