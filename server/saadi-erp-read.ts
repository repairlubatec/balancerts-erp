import { createHash } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { businessDocuments, companies, employees, fiscalPeriods, fiscalTaxRecords, organizations, payments, pgcAccounts, pgcSources, pgcVersions, purchaseOrders, stockMovements, treasuryTransactions } from "../drizzle/schema";
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
  const periodRows = periodId === undefined ? [] : await db
    .select({ period: fiscalPeriods })
    .from(fiscalPeriods)
    .innerJoin(companies, eq(fiscalPeriods.companyId, companies.id))
    .innerJoin(organizations, eq(companies.organizationId, organizations.id))
    .where(and(eq(fiscalPeriods.id, periodId), eq(fiscalPeriods.companyId, companyId), eq(companies.organizationId, organizationId)))
    .limit(1);
  const period = periodRows[0]?.period;
  if (periodId !== undefined && !period) throw new Error("SAADI_PERIOD_NOT_FOUND_OR_FORBIDDEN");
  const periodStart = period ? new Date(Date.UTC(period.year, period.month - 1, 1)) : null;
  const periodEnd = period ? new Date(Date.UTC(period.year, period.month, 0, 23, 59, 59, 999)) : null;
  const documentScope = periodStart && periodEnd
    ? sql`COALESCE(${businessDocuments.issuedAt}, ${businessDocuments.createdAt}) >= ${periodStart} AND COALESCE(${businessDocuments.issuedAt}, ${businessDocuments.createdAt}) <= ${periodEnd}`
    : sql`1 = 1`;
  const purchaseScope = periodStart && periodEnd
    ? sql`${purchaseOrders.requestedDate} >= ${periodStart} AND ${purchaseOrders.requestedDate} <= ${periodEnd}`
    : sql`1 = 1`;
  const [documents, purchases, paymentsSummary, treasury, stock, humanResources, taxes] = await Promise.all([
    db.select({ total: sql<number>`count(*)`, gross: sql<string>`coalesce(sum(${businessDocuments.totalAmount}), 0)` }).from(businessDocuments).innerJoin(companies, eq(businessDocuments.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(businessDocuments.companyId, companyId), eq(companies.organizationId, organizationId), documentScope)),
    db.select({ total: sql<number>`count(*)` }).from(purchaseOrders).where(and(eq(purchaseOrders.organizationId, organizationId), eq(purchaseOrders.companyId, companyId), purchaseScope)),
    db.select({ total: sql<number>`count(*)`, amount: sql<string>`coalesce(sum(${payments.amount}), 0)` }).from(payments).where(and(eq(payments.organizationId, organizationId), eq(payments.companyId, companyId), periodId === undefined ? sql`1 = 1` : eq(payments.periodId, periodId))),
    db.select({ total: sql<number>`count(*)`, amountIn: sql<string>`coalesce(sum(case when ${treasuryTransactions.direction} = 'IN' then ${treasuryTransactions.amount} else 0 end), 0)`, amountOut: sql<string>`coalesce(sum(case when ${treasuryTransactions.direction} = 'OUT' then ${treasuryTransactions.amount} else 0 end), 0)` }).from(treasuryTransactions).innerJoin(companies, eq(treasuryTransactions.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(treasuryTransactions.companyId, companyId), eq(companies.organizationId, organizationId), periodId === undefined ? sql`1 = 1` : eq(treasuryTransactions.periodId, periodId))),
    db.select({ total: sql<number>`count(*)`, quantity: sql<string>`coalesce(sum(${stockMovements.quantity}), 0)` }).from(stockMovements).where(and(eq(stockMovements.organizationId, organizationId), eq(stockMovements.companyId, companyId), periodId === undefined ? sql`1 = 1` : eq(stockMovements.periodId, periodId))),
    db.select({ total: sql<number>`count(*)` }).from(employees).where(and(eq(employees.organizationId, organizationId), eq(employees.companyId, companyId))),
    db.select({ total: sql<number>`count(*)`, amount: sql<string>`coalesce(sum(${fiscalTaxRecords.taxAmount}), 0)` }).from(fiscalTaxRecords).where(and(eq(fiscalTaxRecords.organizationId, organizationId), eq(fiscalTaxRecords.companyId, companyId), periodId === undefined ? sql`1 = 1` : eq(fiscalTaxRecords.periodId, periodId))),
  ]);
  return envelope({ organizationId, companyId, asOf: context.asOf, sourceSystem: "BALANCERTS.ERP", sourceService: "operational-domains.read", sourceVersion: "erp-read-v1", dataClass: "ACTUAL_REALIZED", authority: "ERP", data: { periodId: periodId ?? null, periodScope: periodId === undefined ? "ALL_PERIODS" : { start: periodStart, end: periodEnd }, commercial: documents[0] ?? { total: 0, gross: "0" }, purchases: purchases[0] ?? { total: 0 }, treasury: treasury[0] ?? { total: 0, amountIn: "0", amountOut: "0" }, payments: paymentsSummary[0] ?? { total: 0, amount: "0" }, stock: stock[0] ?? { total: 0, quantity: "0" }, humanResources: { ...(humanResources[0] ?? { total: 0 }), scope: "MASTER_DATA_NOT_PERIODIZED" }, fiscality: taxes[0] ?? { total: 0, amount: "0" } } });
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
