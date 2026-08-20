import { createHash } from "node:crypto";
import { and, desc, eq, or, sql } from "drizzle-orm";
import { getDb } from "./db";
import { companies, organizations, saadiSnapshots, saadiStudies } from "../drizzle/schema";
import { saadiSnapshotSchema, saadiSnapshotRequestSchema, type SaadiSnapshot as SaadiSnapshotContract, type SaadiSnapshotRequest } from "../shared/saadi-contracts";

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
    baseCurrency: (input.baseCurrency ?? "AOA").trim().toUpperCase(),
    createdBy: input.userId,
  });
  const rows = await db.select().from(saadiStudies)
    .where(and(eq(saadiStudies.organizationId, input.organizationId), eq(saadiStudies.companyId, input.companyId), eq(saadiStudies.studyCode, studyCode)))
    .orderBy(desc(saadiStudies.id)).limit(1);
  return rows[0];
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
  return { snapshot: created[0], alreadyExists: false } as const;
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
