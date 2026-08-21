import { createHash } from "node:crypto";
import { and, desc, eq, or, sql } from "drizzle-orm";
import { appendAuditEventForUser, getDb } from "./db";
import { companies, organizations, saadiAssumptions, saadiExternalCompanies, saadiFinancialHistoricalData, saadiFinancingSources, saadiInvestmentItems, saadiStudies, saadiValidations } from "../drizzle/schema";

const organizationAccessCondition = (userId: number) => or(
  eq(organizations.ownerUserId, userId),
  sql`EXISTS (SELECT 1 FROM organizationMemberships AS om_saadi_ext WHERE om_saadi_ext.organizationId = ${organizations.id} AND om_saadi_ext.userId = ${userId} AND om_saadi_ext.status = 'ACTIVE')`,
);

async function assertOrganizationAccess(userId: number, organizationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ id: organizations.id }).from(organizations).where(and(eq(organizations.id, organizationId), organizationAccessCondition(userId))).limit(1);
  if (!rows[0]) throw new Error("SAADI_ORGANIZATION_NOT_FOUND_OR_FORBIDDEN");
}

async function assertStudyAccess(input: { userId: number; organizationId: number; studyId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ study: saadiStudies }).from(saadiStudies).innerJoin(organizations, eq(saadiStudies.organizationId, organizations.id)).where(and(eq(saadiStudies.id, input.studyId), eq(saadiStudies.organizationId, input.organizationId), organizationAccessCondition(input.userId))).limit(1);
  if (!rows[0]) throw new Error("SAADI_STUDY_NOT_FOUND_OR_FORBIDDEN");
  return rows[0].study;
}

function hashValue(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function calculateInvestmentTotal(items: Array<{ quantity: string | number; unitValue: string | number; totalValue?: string | number }>) {
  return items.reduce((sum, item) => sum + (item.totalValue !== undefined ? Number(item.totalValue) : Number(item.quantity) * Number(item.unitValue)), 0);
}

export function calculateFinancingBalance(initialInvestment: number, sources: Array<{ amount: string | number }>, tolerance = 0.01) {
  const totalSources = sources.reduce((sum, source) => sum + Number(source.amount), 0);
  const difference = totalSources - initialInvestment;
  return { initialInvestment, totalSources, difference, balanced: Math.abs(difference) <= tolerance, insufficient: difference < -tolerance, excess: difference > tolerance };
}

export async function createExternalSaadiStudy(input: { userId: number; organizationId: number; studyCode: string; name: string; studyType: string; description?: string; baseCurrency?: string; investmentDomain?: "IMOBILIARIO" | "AGRICULTURA" | "INDUSTRIA" | "ENERGIA" | "HOTELARIA" | "LOGISTICA" | "OUTRO"; responsibleName?: string; responsibleProfessionalId?: string; accountingFirm?: string; responsibleContact?: string; responsibleEmail?: string; studyDate?: Date; externalCompany: { legalName: string; nif?: string; societyType?: string; registrationNumber?: string; incorporationDate?: Date; activity?: string; activityCode?: string; sector?: string; country?: string; province?: string; municipality?: string; address?: string; phone?: string; email?: string; website?: string; contactName?: string; contactPosition?: string } }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertOrganizationAccess(input.userId, input.organizationId);
  if (!input.studyCode.trim() || !input.name.trim() || !input.externalCompany.legalName.trim()) throw new Error("SAADI_EXTERNAL_STUDY_FIELDS_REQUIRED");
  await db.insert(saadiStudies).values({ organizationId: input.organizationId, companyId: null, entityType: "EXTERNA", studyCode: input.studyCode.trim(), name: input.name.trim(), studyType: input.studyType.trim(), description: input.description?.trim() || null, responsibleName: input.responsibleName?.trim() || null, responsibleProfessionalId: input.responsibleProfessionalId?.trim() || null, accountingFirm: input.accountingFirm?.trim() || null, responsibleContact: input.responsibleContact?.trim() || null, responsibleEmail: input.responsibleEmail?.trim() || null, studyDate: input.studyDate ?? new Date(), investmentDomain: input.investmentDomain ?? "OUTRO", baseCurrency: (input.baseCurrency ?? "AOA").toUpperCase(), createdBy: input.userId });
  const studyRows = await db.select().from(saadiStudies).where(and(eq(saadiStudies.organizationId, input.organizationId), eq(saadiStudies.studyCode, input.studyCode.trim()))).orderBy(desc(saadiStudies.id)).limit(1);
  const study = studyRows[0];
  if (!study) throw new Error("SAADI_EXTERNAL_STUDY_CREATE_FAILED");
  await db.insert(saadiExternalCompanies).values({ organizationId: input.organizationId, studyId: study.id, ...input.externalCompany, legalName: input.externalCompany.legalName.trim(), country: input.externalCompany.country?.trim() || "Angola", createdBy: input.userId });
  const externalRows = await db.select().from(saadiExternalCompanies).where(eq(saadiExternalCompanies.studyId, study.id)).limit(1);
  const external = externalRows[0];
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: 0, actorUserId: input.userId, action: "SAADI_EXTERNAL_STUDY_CREATED", entityType: "saadiStudy", entityId: String(study.id), beforeState: null, afterState: JSON.stringify({ studyId: study.id, externalCompanyId: external?.id ?? null, studyCode: study.studyCode }), correlationId: `saadi-external-study:${study.id}` });
  return { study, externalCompany: external };
}

export async function getExternalCompanyForStudy(input: { userId: number; organizationId: number; studyId: number }) {
  await assertStudyAccess(input);
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return (await db.select().from(saadiExternalCompanies).where(and(eq(saadiExternalCompanies.organizationId, input.organizationId), eq(saadiExternalCompanies.studyId, input.studyId))).limit(1))[0] ?? null;
}

export async function createSaadiInvestmentItem(input: { userId: number; organizationId: number; companyId?: number; studyId: number; description: string; quantity: number; unitValue: number; category: string; expectedDate?: Date; sourceDocumentId?: number; currency?: string }) {
  await assertStudyAccess({ userId: input.userId, organizationId: input.organizationId, studyId: input.studyId });
  if (input.quantity <= 0 || input.unitValue < 0 || !input.description.trim()) throw new Error("SAADI_INVESTMENT_ITEM_INVALID");
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const totalValue = input.quantity * input.unitValue;
  await db.insert(saadiInvestmentItems).values({ organizationId: input.organizationId, companyId: input.companyId ?? null, studyId: input.studyId, description: input.description.trim(), quantity: String(input.quantity), unitValue: input.unitValue.toFixed(2), totalValue: totalValue.toFixed(2), category: input.category.trim(), expectedDate: input.expectedDate, sourceDocumentId: input.sourceDocumentId, currency: (input.currency ?? "AOA").toUpperCase(), createdBy: input.userId });
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId ?? 0, actorUserId: input.userId, action: "SAADI_INVESTMENT_ITEM_CREATED", entityType: "saadiInvestmentItem", entityId: String(input.studyId), beforeState: null, afterState: JSON.stringify({ description: input.description, totalValue }), correlationId: `saadi-investment:${input.studyId}:${Date.now()}` });
  return { totalValue };
}

export async function listSaadiInvestmentItems(input: { userId: number; organizationId: number; studyId: number }) {
  await assertStudyAccess(input);
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const items = await db.select().from(saadiInvestmentItems).where(and(eq(saadiInvestmentItems.organizationId, input.organizationId), eq(saadiInvestmentItems.studyId, input.studyId))).orderBy(desc(saadiInvestmentItems.id));
  const total = calculateInvestmentTotal(items);
  return { items, totalInvestment: total };
}

export async function createSaadiFinancingSource(input: { userId: number; organizationId: number; companyId?: number; studyId: number; sourceType: "CAPITAL_PROPRIO" | "EMPRESTIMO_BANCARIO" | "INVESTIDOR" | "SUBSIDIO" | "LEASING" | "OUTRO"; description: string; amount: number; interestRate?: number; termMonths?: number; graceMonths?: number; periodicity?: string; startDate?: Date; endDate?: Date; guarantees?: string; commissions?: number; currency?: string }) {
  await assertStudyAccess({ userId: input.userId, organizationId: input.organizationId, studyId: input.studyId });
  if (input.amount < 0 || !input.description.trim()) throw new Error("SAADI_FINANCING_SOURCE_INVALID");
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(saadiFinancingSources).values({ organizationId: input.organizationId, companyId: input.companyId ?? null, studyId: input.studyId, sourceType: input.sourceType, description: input.description.trim(), amount: input.amount.toFixed(2), interestRate: (input.interestRate ?? 0).toFixed(6), termMonths: input.termMonths ?? 0, graceMonths: input.graceMonths ?? 0, periodicity: input.periodicity ?? "MENSAL", startDate: input.startDate, endDate: input.endDate, guarantees: input.guarantees, commissions: (input.commissions ?? 0).toFixed(2), currency: (input.currency ?? "AOA").toUpperCase(), createdBy: input.userId });
  return { saved: true };
}

export async function listSaadiFinancingSources(input: { userId: number; organizationId: number; studyId: number }) {
  await assertStudyAccess(input);
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const sources = await db.select().from(saadiFinancingSources).where(and(eq(saadiFinancingSources.organizationId, input.organizationId), eq(saadiFinancingSources.studyId, input.studyId))).orderBy(desc(saadiFinancingSources.id));
  return { sources, totalFinancing: sources.reduce((sum, source) => sum + Number(source.amount), 0) };
}

export async function createSaadiAssumption(input: { userId: number; organizationId: number; companyId?: number; studyId: number; scenarioId?: number; name: string; value: string; unit: string; startYear: number; endYear: number; source?: string; notes?: string; dataOrigin?: "MANUAL" | "ERP" | "DOCUMENTO" | "IA" }) {
  await assertStudyAccess({ userId: input.userId, organizationId: input.organizationId, studyId: input.studyId });
  if (!input.name.trim() || input.startYear > input.endYear) throw new Error("SAADI_ASSUMPTION_INVALID");
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(saadiAssumptions).values({ ...input, companyId: input.companyId ?? null, name: input.name.trim(), value: input.value.trim(), unit: input.unit.trim(), source: input.source?.trim(), notes: input.notes?.trim(), dataOrigin: input.dataOrigin ?? "MANUAL", createdBy: input.userId });
  return { saved: true };
}

export async function listSaadiAssumptions(input: { userId: number; organizationId: number; studyId: number; scenarioId?: number }) {
  await assertStudyAccess(input);
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const conditions = [eq(saadiAssumptions.organizationId, input.organizationId), eq(saadiAssumptions.studyId, input.studyId)];
  if (input.scenarioId !== undefined) conditions.push(eq(saadiAssumptions.scenarioId, input.scenarioId));
  return db.select().from(saadiAssumptions).where(and(...conditions)).orderBy(desc(saadiAssumptions.id));
}

export async function createSaadiHistoricalData(input: { userId: number; organizationId: number; companyId?: number; studyId: number; periodYear: number; section: "DRE" | "BALANCO" | "FLUXO_CAIXA"; metric: string; value: number; currency?: string; sourceDocumentId?: number; sourcePage?: number; sourceField?: string; dataOrigin: "ERP" | "DOCUMENTO" | "MANUAL" | "IA" }) {
  await assertStudyAccess({ userId: input.userId, organizationId: input.organizationId, studyId: input.studyId });
  if (!input.metric.trim() || !Number.isFinite(input.value)) throw new Error("SAADI_HISTORICAL_DATA_INVALID");
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const value = input.value.toFixed(2);
  await db.insert(saadiFinancialHistoricalData).values({ organizationId: input.organizationId, companyId: input.companyId ?? null, studyId: input.studyId, periodYear: input.periodYear, section: input.section, metric: input.metric.trim(), value, currency: (input.currency ?? "AOA").toUpperCase(), sourceDocumentId: input.sourceDocumentId, sourcePage: input.sourcePage, sourceField: input.sourceField, dataOrigin: input.dataOrigin, valueHash: hashValue({ periodYear: input.periodYear, section: input.section, metric: input.metric.trim(), value }), createdBy: input.userId });
  return { saved: true, value };
}

export async function listSaadiHistoricalData(input: { userId: number; organizationId: number; studyId: number; periodYear?: number }) {
  await assertStudyAccess(input);
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const conditions = [eq(saadiFinancialHistoricalData.organizationId, input.organizationId), eq(saadiFinancialHistoricalData.studyId, input.studyId)];
  if (input.periodYear !== undefined) conditions.push(eq(saadiFinancialHistoricalData.periodYear, input.periodYear));
  return db.select().from(saadiFinancialHistoricalData).where(and(...conditions)).orderBy(desc(saadiFinancialHistoricalData.periodYear), saadiFinancialHistoricalData.section, saadiFinancialHistoricalData.metric);
}

export async function updateSaadiHistoricalValidation(input: { userId: number; organizationId: number; companyId: number; historicalId: number; status: "PENDENTE" | "VALIDADO" | "REJEITADO" }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select().from(saadiFinancialHistoricalData).where(and(eq(saadiFinancialHistoricalData.id, input.historicalId), eq(saadiFinancialHistoricalData.organizationId, input.organizationId))).limit(1);
  if (!rows[0]) throw new Error("SAADI_HISTORICAL_DATA_NOT_FOUND");
  await db.update(saadiFinancialHistoricalData).set({ validationStatus: input.status, validatedBy: input.status === "PENDENTE" ? null : input.userId, validatedAt: input.status === "PENDENTE" ? null : new Date() }).where(eq(saadiFinancialHistoricalData.id, input.historicalId));
  return { validated: true };
}

export async function getSaadiValidationChecklist(input: { userId: number; organizationId: number; companyId: number; studyId: number }) {
  const study = await assertStudyAccess(input);
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const required = [
    { code: "EMPRESA_OU_PROJECTO", message: "Empresa ou projecto identificado." },
    { code: "INVESTIMENTO", message: "Investimento informado." },
    { code: "FINANCIAMENTO", message: "Fontes de financiamento informadas quando aplicável." },
    { code: "PREMISSAS", message: "Premissas preenchidas." },
    { code: "PROJECCOES", message: "Projecções calculadas." },
    { code: "INDICADORES", message: "Indicadores calculados." },
    { code: "RISCOS", message: "Riscos avaliados." },
    { code: "DECISAO", message: "Decisão humana registada." },
  ];
  const existing = await db.select().from(saadiValidations).where(and(eq(saadiValidations.organizationId, input.organizationId), eq(saadiValidations.studyId, input.studyId)));
  const byCode = new Map(existing.map((item) => [item.requirementCode, item]));
  return { study, checklist: required.map((item) => byCode.get(item.code) ?? { requirementCode: item.code, status: "PENDENTE", message: item.message }) };
}
