import { createHash } from "node:crypto";
import { and, desc, eq, or, sql } from "drizzle-orm";
import { appendAuditEventForUser, getDb } from "./db";
import { companies, organizations, saadiAlerts, saadiAssumptions, saadiCompanyLinks, saadiExternalCompanies, saadiFinancialHistoricalData, saadiFinancingSources, saadiIntegrationRuns, saadiInvestmentItems, saadiMetricProvenance, saadiProjections, saadiProjects, saadiStudies, saadiValidations, saadiVersionSnapshots } from "../drizzle/schema";

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


export async function createSaadiProject(input: { userId: number; organizationId: number; companyId?: number; externalCompanyId?: number; code: string; name: string; description?: string }) {
  await assertOrganizationAccess(input.userId, input.organizationId);
  if (!input.code.trim() || !input.name.trim() || (input.companyId === undefined && input.externalCompanyId === undefined)) throw new Error("SAADI_PROJECT_FIELDS_REQUIRED");
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(saadiProjects).values({ organizationId: input.organizationId, companyId: input.companyId ?? null, externalCompanyId: input.externalCompanyId ?? null, code: input.code.trim(), name: input.name.trim(), description: input.description?.trim(), createdBy: input.userId });
  const created = await db.select().from(saadiProjects).where(and(eq(saadiProjects.organizationId, input.organizationId), eq(saadiProjects.code, input.code.trim()))).orderBy(desc(saadiProjects.id)).limit(1);
  return created[0];
}

export async function listSaadiProjects(input: { userId: number; organizationId: number; limit?: number; offset?: number }) {
  await assertOrganizationAccess(input.userId, input.organizationId);
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 100);
  const offset = Math.max(input.offset ?? 0, 0);
  return db.select().from(saadiProjects).where(eq(saadiProjects.organizationId, input.organizationId)).orderBy(desc(saadiProjects.updatedAt)).limit(limit).offset(offset);
}

export async function createSaadiIntegrationRun(input: { userId: number; organizationId: number; companyId?: number; studyId: number; source: string; request: unknown }) {
  await assertStudyAccess({ userId: input.userId, organizationId: input.organizationId, studyId: input.studyId });
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const requestHash = hashValue(input.request);
  await db.insert(saadiIntegrationRuns).values({ organizationId: input.organizationId, companyId: input.companyId ?? null, studyId: input.studyId, source: input.source.trim(), requestHash, status: "PENDENTE", attempts: 0, createdBy: input.userId });
  const created = await db.select().from(saadiIntegrationRuns).where(and(eq(saadiIntegrationRuns.organizationId, input.organizationId), eq(saadiIntegrationRuns.studyId, input.studyId), eq(saadiIntegrationRuns.requestHash, requestHash))).orderBy(desc(saadiIntegrationRuns.id)).limit(1);
  return created[0];
}

export async function updateSaadiIntegrationRun(input: { userId: number; organizationId: number; runId: number; status: "PENDENTE" | "EM_PROCESSAMENTO" | "CONCLUIDA" | "RETRY" | "FALHADA" | "RECONCILIACAO_NECESSARIA"; errorCode?: string; errorMessage?: string; attempts?: number }) {
  await assertOrganizationAccess(input.userId, input.organizationId);
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const now = new Date();
  await db.update(saadiIntegrationRuns).set({ status: input.status, attempts: input.attempts, errorCode: input.errorCode, errorMessage: input.errorMessage, startedAt: input.status === "EM_PROCESSAMENTO" ? now : undefined, finishedAt: ["CONCLUIDA", "FALHADA", "RECONCILIACAO_NECESSARIA"].includes(input.status) ? now : undefined }).where(and(eq(saadiIntegrationRuns.id, input.runId), eq(saadiIntegrationRuns.organizationId, input.organizationId)));
  return { updated: true };
}

export async function listSaadiIntegrationRuns(input: { userId: number; organizationId: number; studyId: number; limit?: number; offset?: number }) {
  await assertStudyAccess({ userId: input.userId, organizationId: input.organizationId, studyId: input.studyId });
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.select().from(saadiIntegrationRuns).where(and(eq(saadiIntegrationRuns.organizationId, input.organizationId), eq(saadiIntegrationRuns.studyId, input.studyId))).orderBy(desc(saadiIntegrationRuns.createdAt)).limit(Math.min(Math.max(input.limit ?? 50, 1), 100)).offset(Math.max(input.offset ?? 0, 0));
}

export async function linkSaadiVersionSnapshot(input: { userId: number; organizationId: number; companyId?: number; versionId: number; snapshotId: number; relationType: "BASE" | "SUPORTE" | "RECONCILIACAO" }) {
  await assertOrganizationAccess(input.userId, input.organizationId);
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(saadiVersionSnapshots).values({ organizationId: input.organizationId, companyId: input.companyId ?? null, versionId: input.versionId, snapshotId: input.snapshotId, relationType: input.relationType, createdBy: input.userId });
  return { linked: true };
}

export async function listSaadiVersionSnapshots(input: { userId: number; organizationId: number; versionId: number }) {
  await assertOrganizationAccess(input.userId, input.organizationId);
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.select().from(saadiVersionSnapshots).where(and(eq(saadiVersionSnapshots.organizationId, input.organizationId), eq(saadiVersionSnapshots.versionId, input.versionId))).orderBy(desc(saadiVersionSnapshots.createdAt));
}

export async function recordSaadiMetricProvenance(input: { userId: number; organizationId: number; companyId?: number; studyId: number; versionId?: number; metric: string; periodYear?: number; value: string; currency?: string; authoritySource: "ERP" | "DOCUMENTO" | "UTILIZADOR" | "IA"; dataNature: "REALIZADO" | "PREMISSA" | "PROJECCAO" | "DERIVADO" | "INTRODUZIDO_UTILIZADOR" | "SUGESTAO_IA"; sourceDocumentId?: number; sourcePage?: number; sourceField?: string; transformation?: string }) {
  await assertStudyAccess({ userId: input.userId, organizationId: input.organizationId, studyId: input.studyId });
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(saadiMetricProvenance).values({ organizationId: input.organizationId, companyId: input.companyId ?? null, studyId: input.studyId, versionId: input.versionId, metric: input.metric.trim(), periodYear: input.periodYear, value: input.value.trim(), currency: (input.currency ?? "AOA").toUpperCase(), authoritySource: input.authoritySource, dataNature: input.dataNature, sourceDocumentId: input.sourceDocumentId, sourcePage: input.sourcePage, sourceField: input.sourceField, transformation: input.transformation, valueHash: hashValue({ metric: input.metric, periodYear: input.periodYear, value: input.value, dataNature: input.dataNature }), createdBy: input.userId });
  return { recorded: true };
}

export async function listSaadiMetricProvenance(input: { userId: number; organizationId: number; studyId: number; metric?: string; limit?: number; offset?: number }) {
  await assertStudyAccess({ userId: input.userId, organizationId: input.organizationId, studyId: input.studyId });
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const conditions = [eq(saadiMetricProvenance.organizationId, input.organizationId), eq(saadiMetricProvenance.studyId, input.studyId)];
  if (input.metric) conditions.push(eq(saadiMetricProvenance.metric, input.metric));
  return db.select().from(saadiMetricProvenance).where(and(...conditions)).orderBy(desc(saadiMetricProvenance.createdAt)).limit(Math.min(Math.max(input.limit ?? 100, 1), 200)).offset(Math.max(input.offset ?? 0, 0));
}


export async function createSaadiCompanyLink(input: { userId: number; organizationId: number; companyId?: number; externalCompanyId?: number; linkType: "ESTUDO_OPERACIONAL" | "REFERENCIA_EXTERNA" }) {
  await assertOrganizationAccess(input.userId, input.organizationId);
  if (input.companyId === undefined && input.externalCompanyId === undefined) throw new Error("SAADI_COMPANY_LINK_TARGET_REQUIRED");
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(saadiCompanyLinks).values({ organizationId: input.organizationId, companyId: input.companyId ?? null, externalCompanyId: input.externalCompanyId ?? null, linkType: input.linkType, status: "PENDENTE", createdBy: input.userId });
  return { created: true, status: "PENDENTE" as const };
}

export async function listSaadiCompanyLinks(input: { userId: number; organizationId: number; companyId?: number; externalCompanyId?: number }) {
  await assertOrganizationAccess(input.userId, input.organizationId);
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const conditions = [eq(saadiCompanyLinks.organizationId, input.organizationId)];
  if (input.companyId !== undefined) conditions.push(eq(saadiCompanyLinks.companyId, input.companyId));
  if (input.externalCompanyId !== undefined) conditions.push(eq(saadiCompanyLinks.externalCompanyId, input.externalCompanyId));
  return db.select().from(saadiCompanyLinks).where(and(...conditions)).orderBy(desc(saadiCompanyLinks.createdAt));
}

export async function authorizeSaadiCompanyLink(input: { userId: number; organizationId: number; linkId: number; status: "AUTORIZADA" | "REVOGADA" }) {
  await assertOrganizationAccess(input.userId, input.organizationId);
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(saadiCompanyLinks).set({ status: input.status, authorizedBy: input.userId, authorizedAt: new Date() }).where(and(eq(saadiCompanyLinks.id, input.linkId), eq(saadiCompanyLinks.organizationId, input.organizationId)));
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: 0, actorUserId: input.userId, action: `SAADI_COMPANY_LINK_${input.status}`, entityType: "saadiCompanyLink", entityId: String(input.linkId), beforeState: null, afterState: JSON.stringify({ status: input.status }), correlationId: `saadi-company-link:${input.linkId}:${input.status}` });
  return { updated: true, status: input.status };
}


export async function createSaadiProjection(input: { userId: number; organizationId: number; companyId?: number; studyId: number; scenarioId?: number; periodYear: number; metric: string; value: number; currency?: string; formulaVersion?: string }) {
  await assertStudyAccess({ userId: input.userId, organizationId: input.organizationId, studyId: input.studyId });
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const normalizedValue = String(input.value);
  const sourceHash = hashValue({ studyId: input.studyId, scenarioId: input.scenarioId ?? null, periodYear: input.periodYear, metric: input.metric, value: normalizedValue, formulaVersion: input.formulaVersion ?? "v1" });
  await db.insert(saadiProjections).values({ organizationId: input.organizationId, companyId: input.companyId ?? null, studyId: input.studyId, scenarioId: input.scenarioId ?? null, periodYear: input.periodYear, metric: input.metric.trim(), value: normalizedValue, currency: (input.currency ?? "AOA").toUpperCase(), formulaVersion: input.formulaVersion ?? "v1", sourceHash, createdBy: input.userId });
  return { created: true, sourceHash };
}

export async function listSaadiProjections(input: { userId: number; organizationId: number; studyId: number; scenarioId?: number; metric?: string; limit?: number; offset?: number }) {
  await assertStudyAccess({ userId: input.userId, organizationId: input.organizationId, studyId: input.studyId });
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const conditions = [eq(saadiProjections.organizationId, input.organizationId), eq(saadiProjections.studyId, input.studyId)];
  if (input.scenarioId !== undefined) conditions.push(eq(saadiProjections.scenarioId, input.scenarioId));
  if (input.metric) conditions.push(eq(saadiProjections.metric, input.metric));
  return db.select().from(saadiProjections).where(and(...conditions)).orderBy(desc(saadiProjections.periodYear)).limit(Math.min(Math.max(input.limit ?? 100, 1), 500)).offset(Math.max(input.offset ?? 0, 0));
}

export async function createSaadiAlert(input: { userId: number; organizationId: number; companyId: number; studyId: number; code: string; severity: "CRITICO" | "ATENCAO" | "FAVORAVEL"; title: string; description: string; thresholdValue?: number; actualValue?: number }) {
  await assertStudyAccess({ userId: input.userId, organizationId: input.organizationId, studyId: input.studyId });
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(saadiAlerts).values({ organizationId: input.organizationId, companyId: input.companyId, studyId: input.studyId, code: input.code.trim(), severity: input.severity, title: input.title.trim(), description: input.description.trim(), thresholdValue: input.thresholdValue === undefined ? undefined : String(input.thresholdValue), actualValue: input.actualValue === undefined ? undefined : String(input.actualValue), createdBy: input.userId });
  return { created: true };
}

export async function listSaadiAlerts(input: { userId: number; organizationId: number; companyId: number; studyId: number; includeResolved?: boolean }) {
  await assertStudyAccess({ userId: input.userId, organizationId: input.organizationId, studyId: input.studyId });
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const conditions = [eq(saadiAlerts.organizationId, input.organizationId), eq(saadiAlerts.companyId, input.companyId), eq(saadiAlerts.studyId, input.studyId)];
  if (!input.includeResolved) conditions.push(eq(saadiAlerts.resolved, 0));
  return db.select().from(saadiAlerts).where(and(...conditions)).orderBy(desc(saadiAlerts.createdAt));
}

export async function resolveSaadiAlert(input: { userId: number; organizationId: number; companyId: number; alertId: number }) {
  await assertOrganizationAccess(input.userId, input.organizationId);
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(saadiAlerts).set({ resolved: 1 }).where(and(eq(saadiAlerts.id, input.alertId), eq(saadiAlerts.organizationId, input.organizationId), eq(saadiAlerts.companyId, input.companyId)));
  return { resolved: true };
}

export async function upsertSaadiValidation(input: { userId: number; organizationId: number; companyId: number; studyId: number; requirementCode: string; status: "PENDENTE" | "VALIDADO" | "BLOQUEADO"; message: string }) {
  await assertStudyAccess({ userId: input.userId, organizationId: input.organizationId, studyId: input.studyId });
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await db.select().from(saadiValidations).where(and(eq(saadiValidations.organizationId, input.organizationId), eq(saadiValidations.studyId, input.studyId), eq(saadiValidations.requirementCode, input.requirementCode))).limit(1);
  if (existing[0]) await db.update(saadiValidations).set({ status: input.status, message: input.message, checkedBy: input.userId, checkedAt: new Date() }).where(eq(saadiValidations.id, existing[0].id));
  else await db.insert(saadiValidations).values({ organizationId: input.organizationId, companyId: input.companyId, studyId: input.studyId, requirementCode: input.requirementCode.trim(), status: input.status, message: input.message.trim(), checkedBy: input.userId, checkedAt: new Date() });
  return { updated: true };
}

export async function listSaadiValidations(input: { userId: number; organizationId: number; companyId: number; studyId: number }) {
  await assertStudyAccess({ userId: input.userId, organizationId: input.organizationId, studyId: input.studyId });
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.select().from(saadiValidations).where(and(eq(saadiValidations.organizationId, input.organizationId), eq(saadiValidations.companyId, input.companyId), eq(saadiValidations.studyId, input.studyId))).orderBy(saadiValidations.requirementCode);
}


const saadiWorkflowTransitions: Record<string, string[]> = {
  RASCUNHO: ["EM_ANALISE", "ARQUIVADO"],
  EM_ANALISE: ["AGUARDANDO_VALIDACAO", "RASCUNHO", "ARQUIVADO"],
  AGUARDANDO_VALIDACAO: ["VALIDADO", "EM_ANALISE", "ARQUIVADO"],
  VALIDADO: ["CONCLUIDO", "EM_ANALISE", "ARQUIVADO"],
  CONCLUIDO: ["ARQUIVADO"],
  ARQUIVADO: [],
};

export async function transitionSaadiStudyWorkflow(input: { userId: number; organizationId: number; studyId: number; nextStatus: "RASCUNHO" | "EM_ANALISE" | "AGUARDANDO_VALIDACAO" | "VALIDADO" | "CONCLUIDO" | "ARQUIVADO" }) {
  await assertStudyAccess({ userId: input.userId, organizationId: input.organizationId, studyId: input.studyId });
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const current = await db.select({ workflowStatus: saadiStudies.workflowStatus }).from(saadiStudies).where(and(eq(saadiStudies.id, input.studyId), eq(saadiStudies.organizationId, input.organizationId))).limit(1);
  const from = current[0]?.workflowStatus ?? "RASCUNHO";
  if (from === input.nextStatus) return { updated: false, workflowStatus: from };
  if (!saadiWorkflowTransitions[from]?.includes(input.nextStatus)) throw new Error("SAADI_WORKFLOW_TRANSITION_INVALIDA");
  if (input.nextStatus === "CONCLUIDO") {
    const validations = await db.select().from(saadiValidations).where(and(eq(saadiValidations.organizationId, input.organizationId), eq(saadiValidations.studyId, input.studyId)));
    if (validations.some((validation) => validation.status !== "VALIDADO")) throw new Error("SAADI_VALIDACOES_PENDENTES");
  }
  await db.update(saadiStudies).set({ workflowStatus: input.nextStatus }).where(and(eq(saadiStudies.id, input.studyId), eq(saadiStudies.organizationId, input.organizationId)));
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: 0, actorUserId: input.userId, action: "SAADI_WORKFLOW_TRANSITION", entityType: "saadiStudy", entityId: String(input.studyId), beforeState: JSON.stringify({ workflowStatus: from }), afterState: JSON.stringify({ workflowStatus: input.nextStatus }), correlationId: `saadi-workflow:${input.studyId}:${from}:${input.nextStatus}` });
  return { updated: true, workflowStatus: input.nextStatus };
}
