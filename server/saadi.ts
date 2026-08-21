import { createHash } from "node:crypto";
import { and, desc, eq, or, sql } from "drizzle-orm";
import { appendAuditEventForUser, getDb } from "./db";
import { companies, organizations, saadiProvenance, saadiSnapshots, saadiStudies, saadiVersions, saadiFeasibilityInputs, saadiDecisions, saadiFinancialResults, saadiScenarios, saadiRisks, saadiVarianceReports } from "../drizzle/schema";
import { saadiSnapshotSchema, saadiSnapshotRequestSchema, saadiVersionSchema, type SaadiSnapshot as SaadiSnapshotContract, type SaadiSnapshotRequest, type SaadiVersion } from "../shared/saadi-contracts";
import { calculateFeasibility } from "./saadi-financial";
import { readSaadiAccountingSummary } from "./saadi-erp-read";

const organizationAccessCondition = (userId: number) => or(
  eq(organizations.ownerUserId, userId),
  sql`EXISTS (SELECT 1 FROM organizationMemberships AS om_saadi WHERE om_saadi.organizationId = ${organizations.id} AND om_saadi.userId = ${userId} AND om_saadi.status = 'ACTIVE')`,
);

function hashPayload(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function validateSaadiSnapshotInput(input: { request: SaadiSnapshotRequest; snapshot: SaadiSnapshotContract; idempotencyKey: string }) {
  const request = saadiSnapshotRequestSchema.parse(input.request);
  const snapshot = saadiSnapshotSchema.parse(input.snapshot);
  const key = input.idempotencyKey.trim();
  if (!key) throw new Error("SAADI_IDEMPOTENCY_KEY_REQUIRED");
  if (snapshot.request.organizationId !== request.organizationId || snapshot.request.companyId !== request.companyId) {
    throw new Error("SAADI_SNAPSHOT_SCOPE_MISMATCH");
  }
  return { request, snapshot, idempotencyKey: key } as const;
}

async function assertCompanyAccess(input: { userId: number; organizationId: number; companyId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ company: companies, organization: organizations })
    .from(companies)
    .innerJoin(organizations, eq(companies.organizationId, organizations.id))
    .where(and(
      eq(companies.id, input.companyId),
      eq(companies.organizationId, input.organizationId),
      organizationAccessCondition(input.userId),
    ))
    .limit(1);
  if (!rows[0]) throw new Error("SAADI_COMPANY_NOT_FOUND_OR_FORBIDDEN");
  return rows[0];
}

export async function createSaadiStudy(input: {
  userId: number;
  organizationId: number;
  companyId: number;
  studyCode: string;
  name: string;
  investmentDomain?: "IMOBILIARIO" | "AGRICULTURA" | "INDUSTRIA" | "ENERGIA" | "HOTELARIA" | "LOGISTICA" | "OUTRO";
  baseCurrency?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertCompanyAccess(input);
  const studyCode = input.studyCode.trim();
  const name = input.name.trim();
  if (!studyCode || !name) throw new Error("SAADI_STUDY_FIELDS_REQUIRED");
  await db.insert(saadiStudies).values({
    organizationId: input.organizationId,
    companyId: input.companyId,
    studyCode,
    name,
    investmentDomain: input.investmentDomain ?? "OUTRO",
    baseCurrency: (input.baseCurrency ?? "AOA").trim().toUpperCase(),
    createdBy: input.userId,
  });
  const rows = await db.select().from(saadiStudies)
    .where(and(eq(saadiStudies.organizationId, input.organizationId), eq(saadiStudies.companyId, input.companyId), eq(saadiStudies.studyCode, studyCode)))
    .orderBy(desc(saadiStudies.id)).limit(1);
  const created = rows[0];
  if (created) await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "SAADI_STUDY_CREATED", entityType: "saadiStudy", entityId: String(created.id), beforeState: null, afterState: JSON.stringify({ studyCode, investmentDomain: created.investmentDomain, status: created.status }), correlationId: `saadi-study:${created.id}` });
  return created;
}

export async function createSaadiSnapshot(input: {
  userId: number;
  studyId: number;
  request: SaadiSnapshotRequest;
  snapshot: SaadiSnapshotContract;
  idempotencyKey: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const { request, snapshot, idempotencyKey: key } = validateSaadiSnapshotInput(input);
  await assertCompanyAccess({ userId: input.userId, organizationId: request.organizationId, companyId: request.companyId });
  const studyRows = await db.select().from(saadiStudies).where(and(
    eq(saadiStudies.id, input.studyId),
    eq(saadiStudies.organizationId, request.organizationId),
    eq(saadiStudies.companyId, request.companyId),
  )).limit(1);
  if (!studyRows[0]) throw new Error("SAADI_STUDY_NOT_FOUND_OR_FORBIDDEN");
  const sourceFingerprint = snapshot.contentHash ?? hashPayload(snapshot);
  const existing = await db.select().from(saadiSnapshots).where(and(
    eq(saadiSnapshots.organizationId, request.organizationId),
    eq(saadiSnapshots.companyId, request.companyId),
    eq(saadiSnapshots.idempotencyKey, key),
  )).limit(1);
  if (existing[0]) return { snapshot: existing[0], alreadyExists: true } as const;
  await db.insert(saadiSnapshots).values({
    organizationId: request.organizationId,
    companyId: request.companyId,
    studyId: input.studyId,
    asOf: new Date(snapshot.capturedAt ?? new Date().toISOString()),
    sourceFingerprint,
    payloadJson: JSON.stringify(snapshot),
    status: snapshot.status === "CONCLUIDA" ? "READY" : "STALE",
    idempotencyKey: key,
    createdBy: input.userId,
  });
  const created = await db.select().from(saadiSnapshots).where(and(
    eq(saadiSnapshots.organizationId, request.organizationId),
    eq(saadiSnapshots.companyId, request.companyId),
    eq(saadiSnapshots.idempotencyKey, key),
  )).limit(1);
  if (created[0]) await appendAuditEventForUser({ organizationId: request.organizationId, companyId: request.companyId, actorUserId: input.userId, action: "SAADI_SNAPSHOT_CREATED", entityType: "saadiSnapshot", entityId: String(created[0].id), beforeState: null, afterState: JSON.stringify({ studyId: input.studyId, status: created[0].status, sourceFingerprint: created[0].sourceFingerprint }), correlationId: `saadi-snapshot:${created[0].id}` });
  return { snapshot: created[0], alreadyExists: false } as const;
}

export async function captureSaadiErpAccountingSnapshot(input: { userId: number; studyId: number; request: SaadiSnapshotRequest }) {
  const summary = await readSaadiAccountingSummary(input.userId, input.request.companyId, input.request.periodIds[0]);
  if (summary.organizationId !== input.request.organizationId) throw new Error("SAADI_SCOPE_MISMATCH");
  const capturedAt = new Date().toISOString();
  const content = { request: input.request, status: "CONCLUIDA" as const, capturedAt, provenance: [{ sourceSystem: "BALANCERTS.ERP" as const, sourceContract: "erp.accounting.read", sourceEntity: "accounting.read", organizationId: input.request.organizationId, companyId: input.request.companyId, periodIds: input.request.periodIds, extractedAt: capturedAt, contractVersion: input.request.contractVersion, transformation: "LEITURA_DIRECTA", contentHash: summary.integrityHash }], metrics: { periodos: input.request.periodIds.length, linhasBalancete: Array.isArray(summary.data.trialBalance) ? summary.data.trialBalance.length : 0, receitaRealizada: Number(summary.data.incomeStatement.revenue), despesasRealizadas: Number(summary.data.incomeStatement.expenses), resultadoLiquidoRealizado: Number(summary.data.incomeStatement.netIncome) } };
  const contentHash = hashPayload(content);
  return createSaadiSnapshot({ userId: input.userId, studyId: input.studyId, idempotencyKey: `erp-accounting:${input.request.correlationId}`, request: input.request, snapshot: { ...content, contentHash } });
}

export async function submitSaadiDecision(input: { userId: number; organizationId: number; companyId: number; studyId: number; versionId: number; decision: "APROVAR" | "REJEITAR" | "PEDIR_REVISAO"; justification: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertCompanyAccess(input);
  const justification = input.justification.trim();
  if (!justification) throw new Error("SAADI_DECISION_JUSTIFICATION_REQUIRED");
  const [version] = await db.select().from(saadiVersions).where(and(eq(saadiVersions.id, input.versionId), eq(saadiVersions.organizationId, input.organizationId), eq(saadiVersions.companyId, input.companyId), eq(saadiVersions.studyId, input.studyId))).limit(1);
  if (!version) throw new Error("SAADI_VERSION_NOT_FOUND_OR_FORBIDDEN");
  if (version.status !== "APPROVED") throw new Error("SAADI_DECISION_REQUIRES_APPROVED_VERSION");
  const existing = await db.select().from(saadiDecisions).where(eq(saadiDecisions.versionId, input.versionId)).limit(1);
  if (existing[0]) return { ...existing[0], alreadyExists: true };
  const decisionHash = hashPayload({ organizationId: input.organizationId, companyId: input.companyId, studyId: input.studyId, versionId: input.versionId, decision: input.decision, justification, versionHash: version.versionHash });
  const values = { organizationId: input.organizationId, companyId: input.companyId, studyId: input.studyId, versionId: input.versionId, decision: input.decision, justification, decidedBy: input.userId, decisionHash };
  await db.insert(saadiDecisions).values(values);
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "SAADI_DECISION_SUBMITTED", entityType: "saadiDecision", entityId: String(input.versionId), beforeState: null, afterState: JSON.stringify(values), correlationId: `saadi-decision:${input.versionId}` });
  return { ...values, alreadyExists: false };
}

export async function listSaadiDecisionsForUser(input: { userId: number; organizationId: number; companyId: number; studyId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertCompanyAccess(input);
  return db.select().from(saadiDecisions).where(and(eq(saadiDecisions.organizationId, input.organizationId), eq(saadiDecisions.companyId, input.companyId), eq(saadiDecisions.studyId, input.studyId))).orderBy(desc(saadiDecisions.decidedAt));
}

export async function createSaadiRisk(input: { userId: number; organizationId: number; companyId: number; studyId: number; title: string; description: string; probability: number; impact: number; response?: "EVITAR" | "REDUZIR" | "TRANSFERIR" | "ACEITAR" }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertCompanyAccess(input);
  const title = input.title.trim();
  const description = input.description.trim();
  if (!title || !description) throw new Error("SAADI_RISK_FIELDS_REQUIRED");
  if (!Number.isInteger(input.probability) || input.probability < 1 || input.probability > 5 || !Number.isInteger(input.impact) || input.impact < 1 || input.impact > 5) throw new Error("SAADI_RISK_SCALE_INVALID");
  const [study] = await db.select().from(saadiStudies).where(and(eq(saadiStudies.id, input.studyId), eq(saadiStudies.organizationId, input.organizationId), eq(saadiStudies.companyId, input.companyId))).limit(1);
  if (!study) throw new Error("SAADI_STUDY_NOT_FOUND_OR_FORBIDDEN");
  const values = { organizationId: input.organizationId, companyId: input.companyId, studyId: input.studyId, title, description, probability: input.probability, impact: input.impact, exposure: input.probability * input.impact, response: input.response ?? "REDUZIR", status: "ABERTO" as const, createdBy: input.userId };
  await db.insert(saadiRisks).values(values);
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "SAADI_RISK_CREATED", entityType: "saadiRisk", entityId: `${input.studyId}:${title}`, beforeState: null, afterState: JSON.stringify(values), correlationId: `saadi-risk:${input.studyId}:${title}` });
  return { ...values, exposureLabel: values.exposure >= 20 ? "Crítico" : values.exposure >= 12 ? "Alto" : values.exposure >= 6 ? "Moderado" : "Baixo" };
}

export async function listSaadiRisksForUser(input: { userId: number; organizationId: number; companyId: number; studyId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertCompanyAccess(input);
  return db.select().from(saadiRisks).where(and(eq(saadiRisks.organizationId, input.organizationId), eq(saadiRisks.companyId, input.companyId), eq(saadiRisks.studyId, input.studyId))).orderBy(desc(saadiRisks.exposure), desc(saadiRisks.createdAt));
}

export async function compareSaadiProjectionToRealized(input: { userId: number; organizationId: number; companyId: number; studyId: number; snapshotId: number; metric: string; projectedValue: number; currency?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertCompanyAccess(input);
  if (!Number.isFinite(input.projectedValue)) throw new Error("SAADI_PROJECTED_VALUE_INVALID");
  const [snapshot] = await db.select().from(saadiSnapshots).where(and(eq(saadiSnapshots.id, input.snapshotId), eq(saadiSnapshots.organizationId, input.organizationId), eq(saadiSnapshots.companyId, input.companyId), eq(saadiSnapshots.studyId, input.studyId))).limit(1);
  if (!snapshot) throw new Error("SAADI_SNAPSHOT_NOT_FOUND_OR_FORBIDDEN");
  const payload = JSON.parse(snapshot.payloadJson) as { metrics?: Record<string, number> };
  const realizedValue = payload.metrics?.[input.metric];
  if (typeof realizedValue !== "number" || !Number.isFinite(realizedValue)) throw new Error("SAADI_REALIZED_METRIC_NOT_AVAILABLE");
  const absoluteVariance = realizedValue - input.projectedValue;
  const percentageVariance = input.projectedValue === 0 ? null : (absoluteVariance / Math.abs(input.projectedValue)) * 100;
  const sourceHash = snapshot.sourceFingerprint;
  const comparisonHash = hashPayload({ organizationId: input.organizationId, companyId: input.companyId, studyId: input.studyId, snapshotId: input.snapshotId, metric: input.metric, projectedValue: input.projectedValue, realizedValue, sourceHash });
  const values = { organizationId: input.organizationId, companyId: input.companyId, studyId: input.studyId, snapshotId: input.snapshotId, metric: input.metric, projectedValue: String(input.projectedValue), realizedValue: String(realizedValue), absoluteVariance: String(absoluteVariance), percentageVariance: percentageVariance === null ? null : String(percentageVariance), currency: input.currency ?? "AOA", sourceHash, comparisonHash, createdBy: input.userId } as const;
  const existing = await db.select().from(saadiVarianceReports).where(and(eq(saadiVarianceReports.studyId, input.studyId), eq(saadiVarianceReports.snapshotId, input.snapshotId), eq(saadiVarianceReports.metric, input.metric))).limit(1);
  if (existing[0]) return { ...existing[0], alreadyExists: true };
  await db.insert(saadiVarianceReports).values(values);
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "SAADI_VARIANCE_CALCULATED", entityType: "saadiVarianceReport", entityId: `${input.studyId}:${input.snapshotId}:${input.metric}`, beforeState: null, afterState: JSON.stringify({ metric: input.metric, projectedValue: input.projectedValue, realizedValue, absoluteVariance, percentageVariance, comparisonHash }), correlationId: `saadi-variance:${input.studyId}:${input.snapshotId}:${input.metric}` });
  return { ...values, alreadyExists: false };
}

export async function listSaadiVariancesForUser(input: { userId: number; organizationId: number; companyId: number; studyId: number; snapshotId?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertCompanyAccess(input);
  return db.select().from(saadiVarianceReports).where(and(eq(saadiVarianceReports.organizationId, input.organizationId), eq(saadiVarianceReports.companyId, input.companyId), eq(saadiVarianceReports.studyId, input.studyId), input.snapshotId ? eq(saadiVarianceReports.snapshotId, input.snapshotId) : undefined)).orderBy(desc(saadiVarianceReports.createdAt));
}

export function validateSaadiVersionInput(input: { version: SaadiVersion; organizationId: number; companyId: number }) {
  const version = saadiVersionSchema.parse(input.version);
  if (input.organizationId <= 0 || input.companyId <= 0) throw new Error("SAADI_SCOPE_REQUIRED");
  if (version.status === "APROVADA" && version.sourceSnapshotIds.length === 0) throw new Error("SAADI_APPROVED_VERSION_REQUIRES_SOURCE");
  const calculatedHash = hashPayload({ ...version, contentHash: undefined });
  if (version.contentHash !== calculatedHash) throw new Error("SAADI_VERSION_HASH_INVALID");
  return version;
}

export async function listSaadiSnapshotsForUser(input: { userId: number; organizationId: number; companyId: number; studyId?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertCompanyAccess(input);
  return db.select().from(saadiSnapshots).where(and(
    eq(saadiSnapshots.organizationId, input.organizationId),
    eq(saadiSnapshots.companyId, input.companyId),
    ...(input.studyId ? [eq(saadiSnapshots.studyId, input.studyId)] : []),
  )).orderBy(desc(saadiSnapshots.id));
}

export async function listSaadiVersionsForUser(input: { userId: number; organizationId: number; companyId: number; studyId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertCompanyAccess(input);
  return db.select().from(saadiVersions).where(and(
    eq(saadiVersions.organizationId, input.organizationId),
    eq(saadiVersions.companyId, input.companyId),
    eq(saadiVersions.studyId, input.studyId),
  )).orderBy(desc(saadiVersions.versionNumber));
}

export async function createSaadiVersion(input: { userId: number; organizationId: number; companyId: number; studyId: number; snapshotId: number; version: SaadiVersion }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const version = validateSaadiVersionInput({ version: input.version, organizationId: input.organizationId, companyId: input.companyId });
  await assertCompanyAccess(input);
  const study = await db.select().from(saadiStudies).where(and(eq(saadiStudies.id, input.studyId), eq(saadiStudies.organizationId, input.organizationId), eq(saadiStudies.companyId, input.companyId))).limit(1);
  if (!study[0]) throw new Error("SAADI_STUDY_NOT_FOUND_OR_FORBIDDEN");
  const snapshot = await db.select().from(saadiSnapshots).where(and(eq(saadiSnapshots.id, input.snapshotId), eq(saadiSnapshots.organizationId, input.organizationId), eq(saadiSnapshots.companyId, input.companyId), eq(saadiSnapshots.studyId, input.studyId))).limit(1);
  if (!snapshot[0]) throw new Error("SAADI_SNAPSHOT_NOT_FOUND_OR_FORBIDDEN");
  const existing = await db.select().from(saadiVersions).where(and(eq(saadiVersions.studyId, input.studyId), eq(saadiVersions.versionNumber, version.versionNumber))).limit(1);
  if (existing[0]) return { version: existing[0], alreadyExists: true } as const;
  await db.insert(saadiVersions).values({ organizationId: input.organizationId, companyId: input.companyId, studyId: input.studyId, snapshotId: input.snapshotId, versionNumber: version.versionNumber, status: version.status === "RASCUNHO" ? "DRAFT" : version.status === "EM_REVISAO" ? "IN_REVIEW" : version.status === "APROVADA" ? "APPROVED" : "ARCHIVED", assumptionsJson: JSON.stringify(version.assumptions), projectionsJson: JSON.stringify(version.projections), versionHash: version.contentHash, createdBy: input.userId });
  const created = await db.select().from(saadiVersions).where(and(eq(saadiVersions.studyId, input.studyId), eq(saadiVersions.versionNumber, version.versionNumber))).limit(1);
  if (created[0]) await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "SAADI_VERSION_CREATED", entityType: "saadiVersion", entityId: String(created[0].id), beforeState: null, afterState: JSON.stringify({ studyId: input.studyId, versionNumber: created[0].versionNumber, status: created[0].status, versionHash: created[0].versionHash }), correlationId: `saadi-version:${created[0].id}` });
  return { version: created[0], alreadyExists: false } as const;
}

export async function transitionSaadiVersionForUser(input: { userId: number; organizationId: number; companyId: number; versionId: number; decision: "APPROVE" | "ARCHIVE" }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertCompanyAccess(input);
  const rows = await db.select().from(saadiVersions).where(and(eq(saadiVersions.id, input.versionId), eq(saadiVersions.organizationId, input.organizationId), eq(saadiVersions.companyId, input.companyId))).limit(1);
  const current = rows[0];
  if (!current) throw new Error("SAADI_VERSION_NOT_FOUND_OR_FORBIDDEN");
  if (input.decision === "APPROVE" && current.status !== "IN_REVIEW") throw new Error("SAADI_VERSION_REVIEW_REQUIRED");
  if (input.decision === "ARCHIVE" && current.status === "ARCHIVED") return { id: current.id, status: current.status, alreadyArchived: true } as const;
  const nextStatus = input.decision === "APPROVE" ? "APPROVED" : "ARCHIVED";
  await db.update(saadiVersions).set({ status: nextStatus, ...(input.decision === "APPROVE" ? { approvedBy: input.userId, approvedAt: new Date() } : {}) }).where(eq(saadiVersions.id, input.versionId));
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: input.decision === "APPROVE" ? "SAADI_VERSION_APPROVED" : "SAADI_VERSION_ARCHIVED", entityType: "saadiVersion", entityId: String(current.id), beforeState: JSON.stringify({ status: current.status }), afterState: JSON.stringify({ status: nextStatus, versionNumber: current.versionNumber }), correlationId: `saadi-version-transition:${current.id}:${nextStatus}` });
  return { id: current.id, status: nextStatus, alreadyArchived: false } as const;
}

export async function listSaadiProvenanceForUser(input: { userId: number; organizationId: number; companyId: number; snapshotId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertCompanyAccess(input);
  return db.select().from(saadiProvenance).where(and(eq(saadiProvenance.organizationId, input.organizationId), eq(saadiProvenance.companyId, input.companyId), eq(saadiProvenance.snapshotId, input.snapshotId))).orderBy(desc(saadiProvenance.id));
}

export async function listSaadiStudiesForUser(input: { userId: number; organizationId: number; companyId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertCompanyAccess(input);
  return db.select().from(saadiStudies).where(and(
    eq(saadiStudies.organizationId, input.organizationId),
    eq(saadiStudies.companyId, input.companyId),
  )).orderBy(desc(saadiStudies.id));
}


export type SaadiFeasibilityInput = {
  initialInvestment: number;
  discountRate: number;
  cashFlows: number[];
  currency: string;
};

function validateFeasibilityInput(input: SaadiFeasibilityInput) {
  if (!Number.isFinite(input.initialInvestment) || input.initialInvestment <= 0) throw new Error("SAADI_INVESTIMENTO_INVALIDO");
  if (!Number.isFinite(input.discountRate) || input.discountRate <= -1 || input.discountRate > 10) throw new Error("SAADI_TAXA_INVALIDA");
  if (!Array.isArray(input.cashFlows) || input.cashFlows.length < 1 || input.cashFlows.length > 120) throw new Error("SAADI_FLUXOS_INVALIDOS");
  if (input.cashFlows.some((flow) => !Number.isFinite(flow))) throw new Error("SAADI_FLUXO_INVALIDO");
  if (!/^[A-Z]{3}$/.test(input.currency)) throw new Error("SAADI_MOEDA_INVALIDA");
}

export async function saveSaadiFeasibilityInput(input: { userId: number; organizationId: number; companyId: number; studyId: number; feasibility: SaadiFeasibilityInput }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertCompanyAccess(input);
  validateFeasibilityInput(input.feasibility);
  const study = await db.select().from(saadiStudies).where(and(eq(saadiStudies.id, input.studyId), eq(saadiStudies.organizationId, input.organizationId), eq(saadiStudies.companyId, input.companyId))).limit(1);
  if (!study[0]) throw new Error("SAADI_STUDY_NOT_FOUND_OR_FORBIDDEN");
  const inputHash = hashPayload({ studyId: input.studyId, ...input.feasibility });
  const existing = await db.select().from(saadiFeasibilityInputs).where(and(eq(saadiFeasibilityInputs.organizationId, input.organizationId), eq(saadiFeasibilityInputs.companyId, input.companyId), eq(saadiFeasibilityInputs.studyId, input.studyId))).limit(1);
  if (existing[0]) {
    await db.update(saadiFeasibilityInputs).set({ initialInvestment: String(input.feasibility.initialInvestment), discountRate: String(input.feasibility.discountRate), cashFlowsJson: JSON.stringify(input.feasibility.cashFlows), currency: input.feasibility.currency, inputHash, createdBy: input.userId }).where(eq(saadiFeasibilityInputs.id, existing[0].id));
  } else {
    await db.insert(saadiFeasibilityInputs).values({ organizationId: input.organizationId, companyId: input.companyId, studyId: input.studyId, initialInvestment: String(input.feasibility.initialInvestment), discountRate: String(input.feasibility.discountRate), cashFlowsJson: JSON.stringify(input.feasibility.cashFlows), currency: input.feasibility.currency, inputHash, createdBy: input.userId });
  }
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "SAADI_FEASIBILITY_INPUT_SAVED", entityType: "saadiFeasibilityInput", entityId: String(input.studyId), beforeState: null, afterState: JSON.stringify({ inputHash }), correlationId: `saadi-feasibility-input:${input.studyId}` });
  return { inputHash, saved: true };
}

export async function calculateSaadiFeasibilityForUser(input: { userId: number; organizationId: number; companyId: number; studyId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertCompanyAccess(input);
  const rows = await db.select().from(saadiFeasibilityInputs).where(and(eq(saadiFeasibilityInputs.organizationId, input.organizationId), eq(saadiFeasibilityInputs.companyId, input.companyId), eq(saadiFeasibilityInputs.studyId, input.studyId))).limit(1);
  const saved = rows[0];
  if (!saved) throw new Error("SAADI_FEASIBILITY_INPUT_REQUIRED");
  const result = calculateFeasibility({ initialInvestment: Number(saved.initialInvestment), discountRate: Number(saved.discountRate), cashFlows: JSON.parse(saved.cashFlowsJson) as number[] });
  const resultHash = hashPayload({ inputHash: saved.inputHash, result });
  const existing = await db.select().from(saadiFinancialResults).where(and(eq(saadiFinancialResults.organizationId, input.organizationId), eq(saadiFinancialResults.companyId, input.companyId), eq(saadiFinancialResults.studyId, input.studyId))).limit(1);
  const values = { organizationId: input.organizationId, companyId: input.companyId, studyId: input.studyId, npv: result.npv.toFixed(2), irr: result.irr === null ? "" : result.irr.toFixed(8), paybackMonths: result.paybackMonths === null ? "" : result.paybackMonths.toFixed(2), roi: result.roi.toFixed(8), decision: result.decision, resultJson: JSON.stringify({ ...result, inputHash: saved.inputHash }), resultHash, calculatedBy: input.userId } as const;
  if (existing[0]) await db.update(saadiFinancialResults).set(values).where(eq(saadiFinancialResults.id, existing[0].id));
  else await db.insert(saadiFinancialResults).values(values);
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "SAADI_FEASIBILITY_CALCULATED", entityType: "saadiFinancialResult", entityId: String(input.studyId), beforeState: null, afterState: JSON.stringify({ resultHash, decision: result.decision }), correlationId: `saadi-feasibility-calculate:${input.studyId}` });
  return { ...result, resultHash, inputHash: saved.inputHash, currency: saved.currency };
}

export async function getSaadiFeasibilityForUser(input: { userId: number; organizationId: number; companyId: number; studyId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertCompanyAccess(input);
  const [saved] = await db.select().from(saadiFeasibilityInputs).where(and(eq(saadiFeasibilityInputs.organizationId, input.organizationId), eq(saadiFeasibilityInputs.companyId, input.companyId), eq(saadiFeasibilityInputs.studyId, input.studyId))).limit(1);
  const [result] = await db.select().from(saadiFinancialResults).where(and(eq(saadiFinancialResults.organizationId, input.organizationId), eq(saadiFinancialResults.companyId, input.companyId), eq(saadiFinancialResults.studyId, input.studyId))).limit(1);
  return { input: saved ? { initialInvestment: Number(saved.initialInvestment), discountRate: Number(saved.discountRate), cashFlows: JSON.parse(saved.cashFlowsJson) as number[], currency: saved.currency, inputHash: saved.inputHash } : null, result: result ? { npv: Number(result.npv), irr: result.irr ? Number(result.irr) : null, paybackMonths: result.paybackMonths ? Number(result.paybackMonths) : null, roi: Number(result.roi), decision: result.decision, resultHash: result.resultHash } : null };
}


export async function saveSaadiScenario(input: { userId: number; organizationId: number; companyId: number; studyId: number; name: string; feasibility: SaadiFeasibilityInput }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertCompanyAccess(input);
  const name = input.name.trim();
  if (!name) throw new Error("SAADI_CENARIO_NOME_OBRIGATORIO");
  validateFeasibilityInput(input.feasibility);
  const study = await db.select().from(saadiStudies).where(and(eq(saadiStudies.id, input.studyId), eq(saadiStudies.organizationId, input.organizationId), eq(saadiStudies.companyId, input.companyId))).limit(1);
  if (!study[0]) throw new Error("SAADI_STUDY_NOT_FOUND_OR_FORBIDDEN");
  const existing = await db.select().from(saadiScenarios).where(and(eq(saadiScenarios.organizationId, input.organizationId), eq(saadiScenarios.companyId, input.companyId), eq(saadiScenarios.studyId, input.studyId), eq(saadiScenarios.name, name))).limit(1);
  const result = calculateFeasibility({ initialInvestment: input.feasibility.initialInvestment, discountRate: input.feasibility.discountRate, cashFlows: input.feasibility.cashFlows });
  const resultJson = JSON.stringify(result);
  const resultHash = hashPayload({ name, feasibility: input.feasibility, result });
  const values = { organizationId: input.organizationId, companyId: input.companyId, studyId: input.studyId, name, initialInvestment: String(input.feasibility.initialInvestment), discountRate: String(input.feasibility.discountRate), cashFlowsJson: JSON.stringify(input.feasibility.cashFlows), resultJson, resultHash, decision: result.decision, createdBy: input.userId } as const;
  if (existing[0]) await db.update(saadiScenarios).set(values).where(eq(saadiScenarios.id, existing[0].id));
  else await db.insert(saadiScenarios).values(values);
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "SAADI_SCENARIO_CALCULATED", entityType: "saadiScenario", entityId: String(input.studyId), beforeState: null, afterState: JSON.stringify({ name, resultHash, decision: result.decision }), correlationId: `saadi-scenario:${input.studyId}:${name}` });
  return { name, ...result, resultHash };
}

export async function listSaadiScenariosForUser(input: { userId: number; organizationId: number; companyId: number; studyId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await assertCompanyAccess(input);
  return db.select().from(saadiScenarios).where(and(eq(saadiScenarios.organizationId, input.organizationId), eq(saadiScenarios.companyId, input.companyId), eq(saadiScenarios.studyId, input.studyId))).orderBy(desc(saadiScenarios.createdAt));
}
