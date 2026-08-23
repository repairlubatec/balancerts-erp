import { and, eq, sql } from "drizzle-orm";
import { getDb, appendAuditEventForUser } from "./db";
import { accountingRules, pgcAccounts, pgcSources, pgcVersions, organizations } from "../drizzle/schema";

async function accessibleVersion(userId: number, organizationId: number, versionId: number) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ version: pgcVersions }).from(pgcVersions).innerJoin(organizations, eq(pgcVersions.organizationId, organizations.id)).where(and(eq(pgcVersions.id, versionId), eq(pgcVersions.organizationId, organizationId), sql`(${organizations.ownerUserId} = ${userId} OR EXISTS (SELECT 1 FROM organizationMemberships AS om WHERE om.organizationId = ${organizations.id} AND om.userId = ${userId} AND om.status = 'ACTIVE'))`)).limit(1);
  if (!rows[0]) throw new Error("PGC_VERSION_NOT_FOUND_OR_FORBIDDEN");
  return rows[0].version;
}

export async function submitPgcVersionForReview(input: { userId: number; organizationId: number; versionId: number }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const version = await accessibleVersion(input.userId, input.organizationId, input.versionId);
  if (version.status !== "DRAFT") throw new Error("PGC_VERSION_INVALID_TRANSITION");
  await db.update(pgcVersions).set({ status: "UNDER_REVIEW" }).where(eq(pgcVersions.id, input.versionId));
  await appendAuditEventForUser({ organizationId: input.organizationId, actorUserId: input.userId, action: "PGC_VERSION_SUBMITTED_FOR_REVIEW", entityType: "pgcVersion", entityId: String(input.versionId), beforeState: JSON.stringify({ status: version.status }), afterState: JSON.stringify({ status: "UNDER_REVIEW" }), correlationId: `pgc-version:${input.versionId}` });
  return { versionId: input.versionId, status: "UNDER_REVIEW" as const };
}

export async function validatePgcVersionForUser(input: { userId: number; organizationId: number; versionId: number }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const version = await accessibleVersion(input.userId, input.organizationId, input.versionId);
  if (version.status !== "UNDER_REVIEW") throw new Error("PGC_VERSION_INVALID_TRANSITION");
  const accounts = await db.select().from(pgcAccounts).where(and(eq(pgcAccounts.versionId, input.versionId), eq(pgcAccounts.organizationId, input.organizationId)));
  const sources = await db.select().from(pgcSources).where(and(eq(pgcSources.versionId, input.versionId), eq(pgcSources.organizationId, input.organizationId)));
  const pendingAccounts = accounts.filter((account) => account.validationStatus !== "CONFIRMED");
  const pendingSources = sources.filter((source) => source.verificationStatus !== "CONFIRMED");
  if (accounts.length === 0) throw new Error("PGC_VERSION_WITHOUT_ACCOUNTS");
  if (pendingAccounts.length > 0) throw new Error("PGC_VERSION_HAS_UNVALIDATED_ACCOUNTS");
  if (sources.length === 0 || pendingSources.length > 0) throw new Error("PGC_VERSION_HAS_UNCONFIRMED_SOURCES");
  await db.update(pgcVersions).set({ status: "VALIDATED" }).where(eq(pgcVersions.id, input.versionId));
  await appendAuditEventForUser({ organizationId: input.organizationId, actorUserId: input.userId, action: "PGC_VERSION_VALIDATED", entityType: "pgcVersion", entityId: String(input.versionId), beforeState: JSON.stringify({ status: version.status }), afterState: JSON.stringify({ status: "VALIDATED", accountCount: accounts.length, sourceCount: sources.length }), correlationId: `pgc-version:${input.versionId}` });
  return { versionId: input.versionId, status: "VALIDATED" as const, accountCount: accounts.length, sourceCount: sources.length };
}

export function getPgcReadinessBlockers(input: { status: string; accountCount: number; confirmedAccountCount: number; sourceCount: number; confirmedSourceCount: number; accountingRuleCount: number }) {
  const blockers: string[] = [];
  if (input.status !== "VALIDATED") blockers.push("PGC_VERSION_MUST_BE_VALIDATED");
  if (input.accountCount === 0) blockers.push("PGC_VERSION_WITHOUT_ACCOUNTS");
  if (input.confirmedAccountCount !== input.accountCount) blockers.push("PGC_VERSION_HAS_UNVALIDATED_ACCOUNTS");
  if (input.sourceCount === 0) blockers.push("PGC_VERSION_WITHOUT_SOURCES");
  if (input.confirmedSourceCount !== input.sourceCount) blockers.push("PGC_VERSION_HAS_UNCONFIRMED_SOURCES");
  if (input.accountingRuleCount === 0) blockers.push("PGC_VERSION_WITHOUT_ACCOUNTING_RULES");
  return blockers;
}

export async function getPgcActivationReadinessForUser(input: { userId: number; organizationId: number; versionId: number }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const version = await accessibleVersion(input.userId, input.organizationId, input.versionId);
  const [accounts, sources, rules] = await Promise.all([
    db.select().from(pgcAccounts).where(and(eq(pgcAccounts.versionId, input.versionId), eq(pgcAccounts.organizationId, input.organizationId))),
    db.select().from(pgcSources).where(and(eq(pgcSources.versionId, input.versionId), eq(pgcSources.organizationId, input.organizationId))),
    db.select().from(accountingRules).where(and(eq(accountingRules.versionId, input.versionId), eq(accountingRules.organizationId, input.organizationId), eq(accountingRules.active, 1))),
  ]);
  const confirmedAccounts = accounts.filter((account) => account.validationStatus === "CONFIRMED");
  const confirmedSources = sources.filter((source) => source.verificationStatus === "CONFIRMED");
  const blockers = getPgcReadinessBlockers({ status: version.status, accountCount: accounts.length, confirmedAccountCount: confirmedAccounts.length, sourceCount: sources.length, confirmedSourceCount: confirmedSources.length, accountingRuleCount: rules.length });
  return { versionId: input.versionId, status: version.status, accountCount: accounts.length, confirmedAccountCount: confirmedAccounts.length, sourceCount: sources.length, confirmedSourceCount: confirmedSources.length, accountingRuleCount: rules.length, ready: blockers.length === 0, blockers };
}

export async function activatePgcVersionForUser(input: { userId: number; organizationId: number; versionId: number }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const version = await accessibleVersion(input.userId, input.organizationId, input.versionId);
  if (version.status !== "VALIDATED") throw new Error("PGC_VERSION_MUST_BE_VALIDATED");
  const readiness = await getPgcActivationReadinessForUser(input);
  if (!readiness.ready) throw new Error(readiness.blockers[0] ?? "PGC_VERSION_NOT_READY");
  const active = await db.select({ id: pgcVersions.id }).from(pgcVersions).where(and(eq(pgcVersions.organizationId, input.organizationId), eq(pgcVersions.status, "ACTIVE"), sql`${pgcVersions.id} <> ${input.versionId}`)).limit(1);
  await db.update(pgcVersions).set({ status: "SUPERSEDED", effectiveTo: new Date() }).where(and(eq(pgcVersions.organizationId, input.organizationId), eq(pgcVersions.status, "ACTIVE")));
  await db.update(pgcVersions).set({ status: "ACTIVE", activatedAt: new Date(), activatedBy: input.userId }).where(eq(pgcVersions.id, input.versionId));
  await appendAuditEventForUser({ organizationId: input.organizationId, actorUserId: input.userId, action: "PGC_VERSION_ACTIVATED", entityType: "pgcVersion", entityId: String(input.versionId), beforeState: JSON.stringify({ status: version.status, previousActiveVersionId: active[0]?.id ?? null }), afterState: JSON.stringify({ status: "ACTIVE" }), correlationId: `pgc-version:${input.versionId}` });
  return { versionId: input.versionId, status: "ACTIVE" as const, previousActiveVersionId: active[0]?.id ?? null };
}

export const requiredOperationalAccountingRuleOperations = ["COMPRAS", "VENDAS", "STOCK", "TESOURARIA", "SALARIOS", "IMOBILIZADO"] as const;

export function normalizeAccountingRuleOperation(operation: string) {
  const normalized = operation.trim().toUpperCase();
  if (["COMPRA", "COMPRAS"].includes(normalized)) return "COMPRAS";
  if (["VENDA", "VENDAS"].includes(normalized)) return "VENDAS";
  if (["STOCK", "ESTOQUE", "INVENTARIO"].includes(normalized)) return "STOCK";
  if (["TESOURARIA", "PAGAMENTO", "PAGAMENTOS", "RECEBIMENTO", "RECEBIMENTOS"].includes(normalized)) return "TESOURARIA";
  if (["SALARIO", "SALARIOS", "FOLHA"].includes(normalized)) return "SALARIOS";
  if (["IMOBILIZADO", "DEPRECIACAO", "DEPRECIAÇÃO"].includes(normalized)) return "IMOBILIZADO";
  return normalized;
}

export function getAccountingRuleCoverage(input: { requiredOperations?: readonly string[]; activeRuleOperations: readonly string[] }) {
  const required = [...(input.requiredOperations ?? requiredOperationalAccountingRuleOperations)].map(normalizeAccountingRuleOperation);
  const active = new Set(input.activeRuleOperations.map(normalizeAccountingRuleOperation));
  const missing = required.filter((operation) => !active.has(operation));
  return { required, active: required.filter((operation) => active.has(operation)), missing, complete: missing.length === 0 };
}
