import { and, eq, sql } from "drizzle-orm";
import { getDb, appendAuditEventForUser } from "./db";
import { pgcAccounts, pgcSources, pgcVersions, organizations } from "../drizzle/schema";

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
  const accounts = await db.select().from(pgcAccounts).where(eq(pgcAccounts.versionId, input.versionId));
  const sources = await db.select().from(pgcSources).where(eq(pgcSources.versionId, input.versionId));
  const pendingAccounts = accounts.filter((account) => account.validationStatus !== "CONFIRMED");
  const pendingSources = sources.filter((source) => source.verificationStatus !== "CONFIRMED");
  if (accounts.length === 0) throw new Error("PGC_VERSION_WITHOUT_ACCOUNTS");
  if (pendingAccounts.length > 0) throw new Error("PGC_VERSION_HAS_UNVALIDATED_ACCOUNTS");
  if (sources.length === 0 || pendingSources.length > 0) throw new Error("PGC_VERSION_HAS_UNCONFIRMED_SOURCES");
  await db.update(pgcVersions).set({ status: "VALIDATED" }).where(eq(pgcVersions.id, input.versionId));
  await appendAuditEventForUser({ organizationId: input.organizationId, actorUserId: input.userId, action: "PGC_VERSION_VALIDATED", entityType: "pgcVersion", entityId: String(input.versionId), beforeState: JSON.stringify({ status: version.status }), afterState: JSON.stringify({ status: "VALIDATED", accountCount: accounts.length, sourceCount: sources.length }), correlationId: `pgc-version:${input.versionId}` });
  return { versionId: input.versionId, status: "VALIDATED" as const, accountCount: accounts.length, sourceCount: sources.length };
}

export async function activatePgcVersionForUser(input: { userId: number; organizationId: number; versionId: number }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const version = await accessibleVersion(input.userId, input.organizationId, input.versionId);
  if (version.status !== "VALIDATED") throw new Error("PGC_VERSION_MUST_BE_VALIDATED");
  const active = await db.select({ id: pgcVersions.id }).from(pgcVersions).where(and(eq(pgcVersions.organizationId, input.organizationId), eq(pgcVersions.status, "ACTIVE"), sql`${pgcVersions.id} <> ${input.versionId}`)).limit(1);
  await db.update(pgcVersions).set({ status: "SUPERSEDED", effectiveTo: new Date() }).where(and(eq(pgcVersions.organizationId, input.organizationId), eq(pgcVersions.status, "ACTIVE")));
  await db.update(pgcVersions).set({ status: "ACTIVE", activatedAt: new Date(), activatedBy: input.userId }).where(eq(pgcVersions.id, input.versionId));
  await appendAuditEventForUser({ organizationId: input.organizationId, actorUserId: input.userId, action: "PGC_VERSION_ACTIVATED", entityType: "pgcVersion", entityId: String(input.versionId), beforeState: JSON.stringify({ status: version.status, previousActiveVersionId: active[0]?.id ?? null }), afterState: JSON.stringify({ status: "ACTIVE" }), correlationId: `pgc-version:${input.versionId}` });
  return { versionId: input.versionId, status: "ACTIVE" as const, previousActiveVersionId: active[0]?.id ?? null };
}
