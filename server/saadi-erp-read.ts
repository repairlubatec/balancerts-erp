import { createHash } from "node:crypto";
import { getBalanceSheetForUserCompany, getCompaniesForUser, getIncomeStatementForUserCompany, getTrialBalanceForUserCompany } from "./db";

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

export async function readSaadiAccountingSummary(userId: number, companyId: number, periodId?: number) {
  const { context, organizationId } = await contextFor(userId, companyId);
  const [trialBalance, incomeStatement, balanceSheet] = await Promise.all([
    getTrialBalanceForUserCompany(userId, companyId, periodId),
    getIncomeStatementForUserCompany(userId, companyId, periodId),
    getBalanceSheetForUserCompany(userId, companyId, periodId),
  ]);
  return envelope({ organizationId, companyId, asOf: context.asOf, sourceSystem: "BALANCERTS.ERP", sourceService: "accounting.read", sourceVersion: "erp-read-v1", dataClass: "ACTUAL_REALIZED", authority: "ERP", data: { periodId: periodId ?? null, trialBalance, incomeStatement, balanceSheet } });
}
