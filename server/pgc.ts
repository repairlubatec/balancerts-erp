import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb, appendAuditEventForUser, createFileAsset } from "./db";
import { accountingRules, chartAccounts, companies, fileAssets, fiscalPeriods, organizations, pgcAccounts, pgcAuditFindings, pgcAuditRuns, pgcEvidenceSubmissions, pgcMigrationMaps, pgcSources, pgcVersions } from "../drizzle/schema";
import { randomUUID } from "node:crypto";
import { angolaNormativeSources } from "./normative";

export type PgcAccountDraft = {
  code: string;
  name: string;
  description?: string;
  classCode: string;
  parentCode?: string | null;
  level: number;
  accountType: "CLASS" | "GROUP" | "MOVEMENT" | "ANALYTICAL";
  nature: "DEBIT" | "CREDIT" | "MIXED" | "NOT_APPLICABLE";
  balanceType: "DEBIT" | "CREDIT" | "VARIABLE" | "NOT_APPLICABLE";
  acceptsEntries: boolean;
  acceptsChildren: boolean;
  fiscal?: boolean;
  iva?: boolean;
  balanceSheet?: boolean;
  incomeStatement?: boolean;
  validFrom: Date;
  validTo?: Date | null;
  sourceId?: number | null;
  notes?: string;
};

async function assertCompanyScope(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ company: companies, organization: organizations }).from(companies).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(companies.id, companyId), sql`(${organizations.ownerUserId} = ${userId} OR EXISTS (SELECT 1 FROM organizationMemberships AS om WHERE om.organizationId = ${organizations.id} AND om.userId = ${userId} AND om.status = 'ACTIVE'))`)).limit(1);
  if (!rows[0]) throw new Error("COMPANY_NOT_FOUND_OR_FORBIDDEN");
  return rows[0];
}

export async function listPgcVersionsForUser(input: { userId: number; organizationId: number }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ version: pgcVersions }).from(pgcVersions).where(and(eq(pgcVersions.organizationId, input.organizationId), sql`(${organizations.ownerUserId} = ${input.userId} OR EXISTS (SELECT 1 FROM organizationMemberships AS om WHERE om.organizationId = ${organizations.id} AND om.userId = ${input.userId} AND om.status = 'ACTIVE'))`)).leftJoin(organizations, eq(pgcVersions.organizationId, organizations.id)).orderBy(desc(pgcVersions.id)).limit(100);
  return rows.map((row) => row.version);
}

export async function createPgcVersionForUser(input: { userId: number; organizationId: number; code: string; name: string; description: string; sourceType: "PGC_BASE" | "LEGISLATIVE_CHANGE" | "FISCAL_RULE" | "SECTOR_PLAN"; effectiveFrom: Date }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const access = await db.select({ organization: organizations }).from(organizations).where(and(eq(organizations.id, input.organizationId), sql`(${organizations.ownerUserId} = ${input.userId} OR EXISTS (SELECT 1 FROM organizationMemberships AS om WHERE om.organizationId = ${organizations.id} AND om.userId = ${input.userId} AND om.status = 'ACTIVE'))`)).limit(1);
  if (!access[0]) throw new Error("ORGANIZATION_NOT_FOUND_OR_FORBIDDEN");
  const duplicate = await db.select({ id: pgcVersions.id }).from(pgcVersions).where(and(eq(pgcVersions.organizationId, input.organizationId), eq(pgcVersions.code, input.code.trim()))).limit(1);
  if (duplicate[0]) throw new Error("PGC_VERSION_CODE_ALREADY_EXISTS");
  const result = await db.insert(pgcVersions).values({ organizationId: input.organizationId, code: input.code.trim(), name: input.name.trim(), description: input.description.trim(), sourceType: input.sourceType, effectiveFrom: input.effectiveFrom, status: "DRAFT", createdBy: input.userId });
  const id = Number(result[0].insertId);
  await appendAuditEventForUser({ organizationId: input.organizationId, actorUserId: input.userId, action: "PGC_VERSION_CREATED", entityType: "pgcVersion", entityId: String(id), beforeState: null, afterState: JSON.stringify(input), correlationId: `pgc-version:${id}` });
  return { id, status: "DRAFT" as const };
}

export async function addPgcSourceForUser(input: { userId: number; organizationId: number; versionId: number; instrument: string; instrumentNumber?: string; article?: string; title: string; sourceUrl?: string; issuedAt?: Date; effectiveFrom?: Date; verificationStatus?: "PENDING" | "CONFIRMED" | "CONFLICT" | "REJECTED"; conflictNote?: string }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const version = await db.select({ version: pgcVersions }).from(pgcVersions).innerJoin(organizations, eq(pgcVersions.organizationId, organizations.id)).where(and(eq(pgcVersions.id, input.versionId), eq(pgcVersions.organizationId, input.organizationId), sql`(${organizations.ownerUserId} = ${input.userId} OR EXISTS (SELECT 1 FROM organizationMemberships AS om WHERE om.organizationId = ${organizations.id} AND om.userId = ${input.userId} AND om.status = 'ACTIVE'))`)).limit(1);
  if (!version[0]) throw new Error("PGC_VERSION_NOT_FOUND_OR_FORBIDDEN");
  const result = await db.insert(pgcSources).values({ organizationId: input.organizationId, versionId: input.versionId, instrument: input.instrument.trim(), instrumentNumber: input.instrumentNumber?.trim() || null, article: input.article?.trim() || null, title: input.title.trim(), sourceUrl: input.sourceUrl?.trim() || null, issuedAt: input.issuedAt ?? null, effectiveFrom: input.effectiveFrom ?? null, verificationStatus: input.verificationStatus ?? "PENDING", conflictNote: input.conflictNote?.trim() || null, createdBy: input.userId });
  const id = Number(result[0].insertId);
  await appendAuditEventForUser({ organizationId: input.organizationId, actorUserId: input.userId, action: "PGC_SOURCE_REGISTERED", entityType: "pgcSource", entityId: String(id), beforeState: null, afterState: JSON.stringify(input), correlationId: `pgc-source:${id}` });
  return { id };
}

export async function registerPendingNormativeSourcesForUser(input: { userId: number; organizationId: number; versionId: number }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const version = await db.select({ version: pgcVersions }).from(pgcVersions).innerJoin(organizations, eq(pgcVersions.organizationId, organizations.id)).where(and(eq(pgcVersions.id, input.versionId), eq(pgcVersions.organizationId, input.organizationId), sql`(${organizations.ownerUserId} = ${input.userId} OR EXISTS (SELECT 1 FROM organizationMemberships AS om WHERE om.organizationId = ${organizations.id} AND om.userId = ${input.userId} AND om.status = 'ACTIVE'))`)).limit(1);
  if (!version[0]) throw new Error("PGC_VERSION_NOT_FOUND_OR_FORBIDDEN");
  const existing = await db.select({ instrumentNumber: pgcSources.instrumentNumber }).from(pgcSources).where(and(eq(pgcSources.organizationId, input.organizationId), eq(pgcSources.versionId, input.versionId)));
  const existingKeys = new Set(existing.map((row) => row.instrumentNumber).filter(Boolean));
  const pendingSources = angolaNormativeSources.filter((source) => !existingKeys.has(source.code));
  const createdIds: number[] = [];
  for (const source of pendingSources) {
    const result = await db.insert(pgcSources).values({ organizationId: input.organizationId, versionId: input.versionId, instrument: source.title, instrumentNumber: source.code, article: null, title: source.scope, sourceUrl: source.url, issuedAt: null, effectiveFrom: null, verificationStatus: "PENDING", conflictNote: null, createdBy: input.userId });
    createdIds.push(Number(result[0].insertId));
    await appendAuditEventForUser({ organizationId: input.organizationId, actorUserId: input.userId, action: "PGC_SOURCE_REGISTERED", entityType: "pgcSource", entityId: String(result[0].insertId), beforeState: null, afterState: JSON.stringify({ instrumentNumber: source.code, verificationStatus: "PENDING" }), correlationId: `pgc-source:${input.versionId}:${source.code}` });
  }
  return { versionId: input.versionId, createdIds, createdCount: createdIds.length, status: "PENDING" as const };
}

export function validatePgcEvidenceSubmissionMetadata(input: { classCode: string; targetCodes: string[]; size: number; sha256: string; mimeType: string; filename: string; pageFrom?: number | null; pageTo?: number | null }) {
  if (!/^[1-9]$/.test(input.classCode)) throw new Error("PGC_EVIDENCE_CLASS_INVALID");
  const codes = Array.from(new Set(input.targetCodes.map((code) => code.trim()).filter(Boolean)));
  if (codes.length === 0 || codes.length > 100 || codes.some((code) => code.length > 32)) throw new Error("PGC_EVIDENCE_TARGET_CODES_INVALID");
  if (input.size < 1 || input.size > 25 * 1024 * 1024) throw new Error("PGC_EVIDENCE_FILE_SIZE_INVALID");
  if (!/^[a-f0-9]{64}$/.test(input.sha256)) throw new Error("PGC_EVIDENCE_HASH_INVALID");
  const normalizedMime = input.mimeType.trim().toLowerCase();
  if (!["application/pdf", "image/png", "image/jpeg", "image/webp"].includes(normalizedMime)) throw new Error("PGC_EVIDENCE_MIME_INVALID");
  const safeFilename = input.filename.trim().split("/").join("").split(String.fromCharCode(92)).join("").replace(/\u0000/g, "");
  if (!safeFilename || safeFilename.length > 255) throw new Error("PGC_EVIDENCE_FILENAME_INVALID");
  if ((input.pageFrom != null && (!Number.isInteger(input.pageFrom) || input.pageFrom < 1 || input.pageFrom > 20000)) || (input.pageTo != null && (!Number.isInteger(input.pageTo) || input.pageTo < 1 || input.pageTo > 20000)) || (input.pageFrom != null && input.pageTo != null && input.pageTo < input.pageFrom)) throw new Error("PGC_EVIDENCE_PAGES_INVALID");
  return { codes, normalizedMime, safeFilename };
}

export async function submitPgcEvidenceForUser(input: {
  userId: number;
  organizationId: number;
  companyId: number;
  versionId: number;
  sourceId?: number | null;
  classCode: string;
  targetCodes: string[];
  evidenceType: "DIPLOMA" | "ANEXO" | "QUADRO" | "DIAGRAMA" | "OUTRO";
  pageFrom?: number | null;
  pageTo?: number | null;
  notes?: string | null;
  filename: string;
  mimeType: string;
  size: number;
  sha256: string;
  storageKey: string;
}) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const scope = await assertCompanyScope(input.userId, input.companyId);
  if (scope.company.organizationId !== input.organizationId) throw new Error("PGC_EVIDENCE_ORGANIZATION_MISMATCH");
  const validated = validatePgcEvidenceSubmissionMetadata(input);
  const { codes, normalizedMime, safeFilename } = validated;
  const versionRows = await db.select({ version: pgcVersions }).from(pgcVersions).innerJoin(organizations, eq(pgcVersions.organizationId, organizations.id)).where(and(eq(pgcVersions.id, input.versionId), eq(pgcVersions.organizationId, input.organizationId), sql`(${organizations.ownerUserId} = ${input.userId} OR EXISTS (SELECT 1 FROM organizationMemberships AS om WHERE om.organizationId = ${organizations.id} AND om.userId = ${input.userId} AND om.status = 'ACTIVE')`)).limit(1);
  if (!versionRows[0]) throw new Error("PGC_VERSION_NOT_FOUND_OR_FORBIDDEN");
  if (input.sourceId != null) {
    const source = await db.select({ id: pgcSources.id }).from(pgcSources).where(and(eq(pgcSources.id, input.sourceId), eq(pgcSources.organizationId, input.organizationId), eq(pgcSources.versionId, input.versionId))).limit(1);
    if (!source[0]) throw new Error("PGC_EVIDENCE_SOURCE_NOT_FOUND_OR_FORBIDDEN");
  }
  const file = await createFileAsset({ userId: input.userId, organizationId: input.organizationId, companyId: input.companyId, storageKey: input.storageKey, filename: safeFilename, mimeType: input.mimeType, size: input.size, sha256: input.sha256, category: "CONTABILISTICO", description: `Evidência primária PGCA — Classe ${input.classCode}`, reference: `pgc-evidence:${input.versionId}:${input.classCode}` });
  const correlationId = `pgc-evidence:${randomUUID()}`;
  const result = await db.insert(pgcEvidenceSubmissions).values({ organizationId: input.organizationId, companyId: input.companyId, versionId: input.versionId, sourceId: input.sourceId ?? null, fileAssetId: file.id, classCode: input.classCode, targetCodes: JSON.stringify(codes), evidenceType: input.evidenceType, pageFrom: input.pageFrom ?? null, pageTo: input.pageTo ?? null, notes: input.notes?.trim().slice(0, 4000) || null, status: "PENDING_REVIEW", submittedBy: input.userId, reviewedBy: null, reviewedAt: null, reviewNote: null, correlationId });
  const id = Number(result[0].insertId);
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "PGC_EVIDENCE_SUBMITTED", entityType: "pgcEvidenceSubmission", entityId: String(id), beforeState: null, afterState: JSON.stringify({ classCode: input.classCode, targetCodes: codes, evidenceType: input.evidenceType, pageFrom: input.pageFrom ?? null, pageTo: input.pageTo ?? null, fileAssetId: file.id, sha256: input.sha256, status: "PENDING_REVIEW" }), correlationId });
  return { id, fileId: file.id, status: "PENDING_REVIEW" as const, sha256: input.sha256, correlationId };
}

export async function listPgcEvidenceSubmissionsForUser(input: { userId: number; organizationId: number; companyId: number; versionId: number; status?: "PENDING_REVIEW" | "UNDER_REVIEW" | "ACCEPTED" | "REJECTED" }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const scope = await assertCompanyScope(input.userId, input.companyId);
  if (scope.company.organizationId !== input.organizationId) throw new Error("PGC_EVIDENCE_ORGANIZATION_MISMATCH");
  const conditions = [eq(pgcEvidenceSubmissions.organizationId, input.organizationId), eq(pgcEvidenceSubmissions.companyId, input.companyId), eq(pgcEvidenceSubmissions.versionId, input.versionId)];
  if (input.status) conditions.push(eq(pgcEvidenceSubmissions.status, input.status));
  const rows = await db.select({ submission: pgcEvidenceSubmissions, file: fileAssets }).from(pgcEvidenceSubmissions).innerJoin(fileAssets, eq(pgcEvidenceSubmissions.fileAssetId, fileAssets.id)).where(and(...conditions)).orderBy(desc(pgcEvidenceSubmissions.id)).limit(100);
  return rows.map(({ submission, file }) => ({ ...submission, targetCodes: JSON.parse(submission.targetCodes) as string[], file: { id: file.id, filename: file.filename, mimeType: file.mimeType, size: file.size, sha256: file.sha256, storageKey: file.storageKey } }));
}

export async function listPgcSourcesForUser(input: { userId: number; organizationId: number; versionId: number }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const access = await db.select({ id: pgcVersions.id }).from(pgcVersions).innerJoin(organizations, eq(pgcVersions.organizationId, organizations.id)).where(and(eq(pgcVersions.id, input.versionId), eq(pgcVersions.organizationId, input.organizationId), sql`(${organizations.ownerUserId} = ${input.userId} OR EXISTS (SELECT 1 FROM organizationMemberships AS om WHERE om.organizationId = ${organizations.id} AND om.userId = ${input.userId} AND om.status = 'ACTIVE'))`)).limit(1);
  if (!access[0]) throw new Error("PGC_VERSION_NOT_FOUND_OR_FORBIDDEN");
  return db.select().from(pgcSources).where(and(eq(pgcSources.organizationId, input.organizationId), eq(pgcSources.versionId, input.versionId))).orderBy(desc(pgcSources.id)).limit(100);
}

export async function reviewPgcSourceForUser(input: { userId: number; organizationId: number; versionId: number; sourceId: number; verificationStatus: "CONFIRMED" | "CONFLICT" | "REJECTED"; conflictNote?: string }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const version = await db.select({ version: pgcVersions }).from(pgcVersions).innerJoin(organizations, eq(pgcVersions.organizationId, organizations.id)).where(and(eq(pgcVersions.id, input.versionId), eq(pgcVersions.organizationId, input.organizationId), sql`(${organizations.ownerUserId} = ${input.userId} OR EXISTS (SELECT 1 FROM organizationMemberships AS om WHERE om.organizationId = ${organizations.id} AND om.userId = ${input.userId} AND om.status = 'ACTIVE'))`)).limit(1);
  if (!version[0]) throw new Error("PGC_VERSION_NOT_FOUND_OR_FORBIDDEN");
  if (version[0].version.status !== "UNDER_REVIEW") throw new Error("PGC_VERSION_NOT_REVIEWABLE");
  const source = await db.select().from(pgcSources).where(and(eq(pgcSources.id, input.sourceId), eq(pgcSources.organizationId, input.organizationId), eq(pgcSources.versionId, input.versionId))).limit(1);
  if (!source[0]) throw new Error("PGC_SOURCE_NOT_FOUND_OR_FORBIDDEN");
  if (input.verificationStatus !== "CONFIRMED" && !input.conflictNote?.trim()) throw new Error("PGC_SOURCE_REVIEW_NOTE_REQUIRED");
  await db.update(pgcSources).set({ verificationStatus: input.verificationStatus, conflictNote: input.conflictNote?.trim() || null }).where(eq(pgcSources.id, input.sourceId));
  await appendAuditEventForUser({ organizationId: input.organizationId, actorUserId: input.userId, action: "PGC_SOURCE_REVIEWED", entityType: "pgcSource", entityId: String(input.sourceId), beforeState: JSON.stringify({ verificationStatus: source[0].verificationStatus }), afterState: JSON.stringify({ verificationStatus: input.verificationStatus, conflictNote: input.conflictNote ?? null }), correlationId: `pgc-source-review:${input.sourceId}` });
  return { sourceId: input.sourceId, verificationStatus: input.verificationStatus };
}

export async function reviewPgcAccountForUser(input: { userId: number; organizationId: number; versionId: number; accountId: number; validationStatus: "CONFIRMED" | "INVALID" | "DUPLICATE" | "MISSING_PARENT"; notes?: string }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const version = await db.select({ version: pgcVersions }).from(pgcVersions).innerJoin(organizations, eq(pgcVersions.organizationId, organizations.id)).where(and(eq(pgcVersions.id, input.versionId), eq(pgcVersions.organizationId, input.organizationId), sql`(${organizations.ownerUserId} = ${input.userId} OR EXISTS (SELECT 1 FROM organizationMemberships AS om WHERE om.organizationId = ${organizations.id} AND om.userId = ${input.userId} AND om.status = 'ACTIVE'))`)).limit(1);
  if (!version[0]) throw new Error("PGC_VERSION_NOT_FOUND_OR_FORBIDDEN");
  if (version[0].version.status !== "UNDER_REVIEW") throw new Error("PGC_VERSION_NOT_REVIEWABLE");
  const account = await db.select().from(pgcAccounts).where(and(eq(pgcAccounts.id, input.accountId), eq(pgcAccounts.organizationId, input.organizationId), eq(pgcAccounts.versionId, input.versionId))).limit(1);
  if (!account[0]) throw new Error("PGC_ACCOUNT_NOT_FOUND_OR_FORBIDDEN");
  if (input.validationStatus !== "CONFIRMED" && !input.notes?.trim()) throw new Error("PGC_ACCOUNT_REVIEW_NOTE_REQUIRED");
  await db.update(pgcAccounts).set({ validationStatus: input.validationStatus, notes: input.notes?.trim() || account[0].notes }).where(eq(pgcAccounts.id, input.accountId));
  await appendAuditEventForUser({ organizationId: input.organizationId, actorUserId: input.userId, action: "PGC_ACCOUNT_REVIEWED", entityType: "pgcAccount", entityId: String(input.accountId), beforeState: JSON.stringify({ validationStatus: account[0].validationStatus }), afterState: JSON.stringify({ validationStatus: input.validationStatus, notes: input.notes ?? account[0].notes }), correlationId: `pgc-account-review:${input.accountId}` });
  return { accountId: input.accountId, validationStatus: input.validationStatus };
}

export function validatePgcAccountDraft(account: PgcAccountDraft) {
  const segments = account.code.includes(".") ? account.code.split(".") : account.code.split("");
  if (!/^\d+(\.\d+)*$/.test(account.code) || segments.some((segment) => !/^\d+$/.test(segment)) || account.classCode !== segments[0]) throw new Error("PGC_ACCOUNT_CODE_INVALID");
  if (account.level !== segments.length) throw new Error("PGC_ACCOUNT_LEVEL_INVALID");
  if (account.accountType === "MOVEMENT" && !account.acceptsEntries) throw new Error("PGC_MOVEMENT_MUST_ACCEPT_ENTRIES");
  if (account.accountType !== "MOVEMENT" && account.acceptsEntries) throw new Error("PGC_GROUP_CANNOT_ACCEPT_ENTRIES");
  return true as const;
}

export async function addPgcAccountDraftForUser(input: { userId: number; organizationId: number; versionId: number; account: PgcAccountDraft }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const version = await db.select({ version: pgcVersions }).from(pgcVersions).innerJoin(organizations, eq(pgcVersions.organizationId, organizations.id)).where(and(eq(pgcVersions.id, input.versionId), eq(pgcVersions.organizationId, input.organizationId), eq(pgcVersions.status, "DRAFT"), sql`(${organizations.ownerUserId} = ${input.userId} OR EXISTS (SELECT 1 FROM organizationMemberships AS om WHERE om.organizationId = ${organizations.id} AND om.userId = ${input.userId} AND om.status = 'ACTIVE'))`)).limit(1);
  if (!version[0]) throw new Error("PGC_VERSION_NOT_DRAFT_OR_FORBIDDEN");
  const account = input.account;
  validatePgcAccountDraft(account);
  const parent = account.parentCode ? await db.select({ id: pgcAccounts.id }).from(pgcAccounts).where(and(eq(pgcAccounts.versionId, input.versionId), eq(pgcAccounts.code, account.parentCode))).limit(1) : [];
  if (account.parentCode && !parent[0]) throw new Error("PGC_PARENT_NOT_FOUND");
  const duplicate = await db.select({ id: pgcAccounts.id }).from(pgcAccounts).where(and(eq(pgcAccounts.versionId, input.versionId), eq(pgcAccounts.code, account.code))).limit(1);
  if (duplicate[0]) throw new Error("PGC_ACCOUNT_CODE_ALREADY_EXISTS");
  const result = await db.insert(pgcAccounts).values({ organizationId: input.organizationId, versionId: input.versionId, sourceId: account.sourceId ?? null, code: account.code, name: account.name.trim(), description: account.description?.trim() || null, classCode: account.classCode, parentId: parent[0]?.id ?? null, parentCode: account.parentCode ?? null, level: account.level, accountType: account.accountType, nature: account.nature, balanceType: account.balanceType, acceptsEntries: account.acceptsEntries ? 1 : 0, acceptsChildren: account.acceptsChildren ? 1 : 0, active: 1, fiscal: account.fiscal ? 1 : 0, iva: account.iva ? 1 : 0, balanceSheet: account.balanceSheet ? 1 : 0, incomeStatement: account.incomeStatement ? 1 : 0, validFrom: account.validFrom, validTo: account.validTo ?? null, validationStatus: "NEEDS_NORMATIVE_VALIDATION", notes: account.notes?.trim() || null, createdBy: input.userId });
  const id = Number(result[0].insertId);
  await appendAuditEventForUser({ organizationId: input.organizationId, actorUserId: input.userId, action: "PGC_ACCOUNT_DRAFT_CREATED", entityType: "pgcAccount", entityId: String(id), beforeState: null, afterState: JSON.stringify(account), correlationId: `pgc-account:${id}` });
  return { id, validationStatus: "NEEDS_NORMATIVE_VALIDATION" as const };
}

export function validateVisualPgcEvidence(input: { sourceId?: number | null; evidencePages: number[]; sourceSha256: string }) {
  if (!input.sourceId || !Number.isInteger(input.sourceId) || input.sourceId < 1) throw new Error("PGC_VISUAL_SOURCE_REQUIRED");
  if (!/^[a-f0-9]{64}$/.test(input.sourceSha256) || input.evidencePages.length === 0) throw new Error("PGC_VISUAL_EVIDENCE_INVALID");
  return true as const;
}

export async function addPgcAccountVisualConfirmedForUser(input: { userId: number; organizationId: number; versionId: number; account: PgcAccountDraft; evidencePages: number[]; sourceSha256: string }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const version = await db.select({ version: pgcVersions }).from(pgcVersions).innerJoin(organizations, eq(pgcVersions.organizationId, organizations.id)).where(and(eq(pgcVersions.id, input.versionId), eq(pgcVersions.organizationId, input.organizationId), eq(pgcVersions.status, "UNDER_REVIEW"), sql`(${organizations.ownerUserId} = ${input.userId} OR EXISTS (SELECT 1 FROM organizationMemberships AS om WHERE om.organizationId = ${organizations.id} AND om.userId = ${input.userId} AND om.status = 'ACTIVE'))`)).limit(1);
  if (!version[0]) throw new Error("PGC_VERSION_NOT_REVIEWABLE_OR_FORBIDDEN");
  validateVisualPgcEvidence({ sourceId: input.account.sourceId, evidencePages: input.evidencePages, sourceSha256: input.sourceSha256 });
  const source = await db.select().from(pgcSources).where(and(eq(pgcSources.id, input.account.sourceId!), eq(pgcSources.organizationId, input.organizationId), eq(pgcSources.versionId, input.versionId))).limit(1);
  if (!source[0] || source[0].verificationStatus !== "CONFIRMED") throw new Error("PGC_VISUAL_SOURCE_NOT_CONFIRMED");
  const account = input.account;
  validatePgcAccountDraft(account);
  const parent = account.parentCode ? await db.select({ id: pgcAccounts.id }).from(pgcAccounts).where(and(eq(pgcAccounts.versionId, input.versionId), eq(pgcAccounts.organizationId, input.organizationId), eq(pgcAccounts.code, account.parentCode))).limit(1) : [];
  if (account.parentCode && !parent[0]) throw new Error("PGC_PARENT_NOT_FOUND");
  const duplicate = await db.select({ id: pgcAccounts.id }).from(pgcAccounts).where(and(eq(pgcAccounts.organizationId, input.organizationId), eq(pgcAccounts.versionId, input.versionId), eq(pgcAccounts.code, account.code))).limit(1);
  if (duplicate[0]) throw new Error("PGC_ACCOUNT_CODE_ALREADY_EXISTS");
  const result = await db.insert(pgcAccounts).values({ organizationId: input.organizationId, versionId: input.versionId, sourceId: account.sourceId ?? null, code: account.code, name: account.name.trim(), description: account.description?.trim() || null, classCode: account.classCode, parentId: parent[0]?.id ?? null, parentCode: account.parentCode ?? null, level: account.level, accountType: account.accountType, nature: account.nature, balanceType: account.balanceType, acceptsEntries: account.acceptsEntries ? 1 : 0, acceptsChildren: account.acceptsChildren ? 1 : 0, active: 1, fiscal: account.fiscal ? 1 : 0, iva: account.iva ? 1 : 0, balanceSheet: account.balanceSheet ? 1 : 0, incomeStatement: account.incomeStatement ? 1 : 0, validFrom: account.validFrom, validTo: account.validTo ?? null, validationStatus: "CONFIRMED", notes: `${account.notes?.trim() || ""} Evidência visual: páginas ${input.evidencePages.join(", ")}; SHA-256 ${input.sourceSha256}.`.trim(), createdBy: input.userId });
  const id = Number(result[0].insertId);
  await appendAuditEventForUser({ organizationId: input.organizationId, actorUserId: input.userId, action: "PGC_ACCOUNT_VISUAL_CONFIRMED", entityType: "pgcAccount", entityId: String(id), beforeState: null, afterState: JSON.stringify({ account, evidencePages: input.evidencePages, sourceSha256: input.sourceSha256 }), correlationId: `pgc-visual-account:${id}` });
  return { id, code: account.code, validationStatus: "CONFIRMED" as const };
}

export async function listPgcAccountsForUser(input: { userId: number; organizationId: number; versionId: number; search?: string }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const access = await db.select({ id: pgcVersions.id }).from(pgcVersions).innerJoin(organizations, eq(pgcVersions.organizationId, organizations.id)).where(and(eq(pgcVersions.id, input.versionId), eq(pgcVersions.organizationId, input.organizationId), sql`(${organizations.ownerUserId} = ${input.userId} OR EXISTS (SELECT 1 FROM organizationMemberships AS om WHERE om.organizationId = ${organizations.id} AND om.userId = ${input.userId} AND om.status = 'ACTIVE'))`)).limit(1);
  if (!access[0]) throw new Error("PGC_VERSION_NOT_FOUND_OR_FORBIDDEN");
  const conditions = [eq(pgcAccounts.versionId, input.versionId), eq(pgcAccounts.organizationId, input.organizationId)];
  if (input.search?.trim()) conditions.push(sql`(${pgcAccounts.code} LIKE ${`%${input.search.trim()}%`} OR ${pgcAccounts.name} LIKE ${`%${input.search.trim()}%`})` as never);
  return db.select().from(pgcAccounts).where(and(...conditions)).orderBy(pgcAccounts.code).limit(500);
}

export async function auditLegacyChartForUser(input: { userId: number; companyId: number; versionId?: number }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const scope = await assertCompanyScope(input.userId, input.companyId);
  const run = await db.insert(pgcAuditRuns).values({ organizationId: scope.company.organizationId, companyId: input.companyId, versionId: input.versionId ?? null, status: "RUNNING", startedBy: input.userId }).then((result) => Number(result[0].insertId));
  const legacy = await db.select().from(chartAccounts).where(eq(chartAccounts.companyId, input.companyId)).limit(5000);
  const findings: Array<{ classification: "CORRECT" | "WRONG_CODE" | "WRONG_NAME" | "NO_PARENT" | "GROUP_WITH_MOVEMENTS" | "UNVALIDATED"; legacyAccountId: number; legacyCode: string; details: string }> = [];
  const codes = new Set<string>();
  let validCount = 0; let duplicateCount = 0; let needsValidationCount = 0;
  for (const account of legacy) {
    const duplicate = codes.has(account.code); codes.add(account.code);
    const hasParent = !account.parentCode || legacy.some((candidate) => candidate.code === account.parentCode);
    let classification: typeof findings[number]["classification"] = "UNVALIDATED";
    let details = "Conta legada localizada; requer confirmação contra a fonte normativa do PGC.";
    if (duplicate) { classification = "WRONG_CODE"; details = "Código duplicado no plano legado."; duplicateCount += 1; }
    else if (!hasParent) { classification = "NO_PARENT"; details = `Conta-pai ${account.parentCode} não encontrada no plano legado.`; }
    else if (!account.postable && legacy.some((candidate) => candidate.parentCode === account.code)) { classification = "CORRECT"; details = "Conta de agrupamento com filhos identificados; confirmação normativa ainda necessária."; validCount += 1; }
    else { needsValidationCount += 1; }
    findings.push({ classification, legacyAccountId: account.id, legacyCode: account.code, details });
  }
  for (const finding of findings) await db.insert(pgcAuditFindings).values({ auditRunId: run, organizationId: scope.company.organizationId, companyId: input.companyId, legacyAccountId: finding.legacyAccountId, legacyCode: finding.legacyCode, classification: finding.classification, details: finding.details, requiresReview: finding.classification !== "CORRECT" ? 1 : 0 });
  await db.update(pgcAuditRuns).set({ status: "COMPLETED", totalChecked: legacy.length, validCount, duplicateCount, needsValidationCount, unclassifiedCount: legacy.length - validCount - duplicateCount - needsValidationCount, completedAt: new Date() }).where(eq(pgcAuditRuns.id, run));
  await appendAuditEventForUser({ organizationId: scope.company.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "PGC_LEGACY_AUDIT_COMPLETED", entityType: "pgcAuditRun", entityId: String(run), beforeState: null, afterState: JSON.stringify({ totalChecked: legacy.length, validCount, duplicateCount, needsValidationCount }), correlationId: `pgc-audit:${run}` });
  return { auditRunId: run, totalChecked: legacy.length, validCount, duplicateCount, needsValidationCount, activationBlocked: needsValidationCount > 0 || duplicateCount > 0 };
}

export async function createPgcMigrationMapForUser(input: { userId: number; companyId: number; versionId: number; legacyAccountId: number; legacyCode: string; newAccountId?: number; newCode?: string; action: "KEEP" | "REPLACE" | "MERGE" | "SPLIT" | "DEACTIVATE" | "MAP" | "NEEDS_REVIEW"; reason: string; sourceId?: number }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const scope = await assertCompanyScope(input.userId, input.companyId);
  if (input.action !== "NEEDS_REVIEW" && !input.reason.trim()) throw new Error("PGC_MIGRATION_REASON_REQUIRED");
  const legacy = await db.select({ id: chartAccounts.id }).from(chartAccounts).where(and(eq(chartAccounts.id, input.legacyAccountId), eq(chartAccounts.companyId, input.companyId))).limit(1);
  if (!legacy[0]) throw new Error("LEGACY_ACCOUNT_NOT_FOUND");
  const result = await db.insert(pgcMigrationMaps).values({ organizationId: scope.company.organizationId, companyId: input.companyId, versionId: input.versionId, legacyAccountId: input.legacyAccountId, legacyCode: input.legacyCode.trim(), newAccountId: input.newAccountId ?? null, newCode: input.newCode?.trim() || null, action: input.action, reason: input.reason.trim(), sourceId: input.sourceId ?? null, status: "DRAFT", createdBy: input.userId });
  const id = Number(result[0].insertId);
  await appendAuditEventForUser({ organizationId: scope.company.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "PGC_MIGRATION_MAP_CREATED", entityType: "pgcMigrationMap", entityId: String(id), beforeState: null, afterState: JSON.stringify(input), correlationId: `pgc-migration-map:${id}` });
  return { id, status: "DRAFT" as const };
}

export async function listPgcAuditRunsForUser(input: { userId: number; companyId: number }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await assertCompanyScope(input.userId, input.companyId);
  return db.select().from(pgcAuditRuns).where(eq(pgcAuditRuns.companyId, input.companyId)).orderBy(desc(pgcAuditRuns.id)).limit(50);
}

export async function listPgcMigrationMapsForUser(input: { userId: number; companyId: number; versionId: number }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  await assertCompanyScope(input.userId, input.companyId);
  return db.select().from(pgcMigrationMaps).where(and(eq(pgcMigrationMaps.companyId, input.companyId), eq(pgcMigrationMaps.versionId, input.versionId))).orderBy(desc(pgcMigrationMaps.id)).limit(500);
}

export async function createAccountingRuleForUser(input: { userId: number; organizationId: number; versionId: number; companyId?: number; operation: string; documentType?: string; debitAccountId: number; creditAccountId: number; ivaAccountId?: number; nature?: string; costCenterCode?: string; priority?: number; effectiveFrom: Date; effectiveTo?: Date | null; sourceId?: number; notes?: string }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const version = await db.select({ version: pgcVersions }).from(pgcVersions).innerJoin(organizations, eq(pgcVersions.organizationId, organizations.id)).where(and(eq(pgcVersions.id, input.versionId), eq(pgcVersions.organizationId, input.organizationId), sql`(${organizations.ownerUserId} = ${input.userId} OR EXISTS (SELECT 1 FROM organizationMemberships AS om WHERE om.organizationId = ${organizations.id} AND om.userId = ${input.userId} AND om.status = 'ACTIVE'))`)).limit(1);
  if (!version[0]) throw new Error("PGC_VERSION_NOT_FOUND_OR_FORBIDDEN");
  if (version[0].version.status === "ARCHIVED" || version[0].version.status === "SUPERSEDED") throw new Error("PGC_VERSION_NOT_EDITABLE");
  const ids = [input.debitAccountId, input.creditAccountId, ...(input.ivaAccountId ? [input.ivaAccountId] : [])];
  const accounts = await db.select({ id: pgcAccounts.id, organizationId: pgcAccounts.organizationId, versionId: pgcAccounts.versionId, acceptsEntries: pgcAccounts.acceptsEntries, validationStatus: pgcAccounts.validationStatus }).from(pgcAccounts).where(inArray(pgcAccounts.id, ids));
  if (accounts.length !== new Set(ids).size || accounts.some((account) => account.organizationId !== input.organizationId || account.versionId !== input.versionId || account.acceptsEntries !== 1 || account.validationStatus !== "CONFIRMED")) throw new Error("PGC_RULE_ACCOUNTS_NOT_CONFIRMED");
  const result = await db.insert(accountingRules).values({ organizationId: input.organizationId, companyId: input.companyId ?? null, versionId: input.versionId, operation: input.operation.trim(), documentType: input.documentType?.trim() || null, debitAccountId: input.debitAccountId, creditAccountId: input.creditAccountId, ivaAccountId: input.ivaAccountId ?? null, nature: input.nature?.trim() || null, costCenterCode: input.costCenterCode?.trim() || null, priority: input.priority ?? 100, effectiveFrom: input.effectiveFrom, effectiveTo: input.effectiveTo ?? null, sourceId: input.sourceId ?? null, active: 1, notes: input.notes?.trim() || null, createdBy: input.userId });
  const id = Number(result[0].insertId);
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId ?? null, actorUserId: input.userId, action: "ACCOUNTING_RULE_CREATED", entityType: "accountingRule", entityId: String(id), beforeState: null, afterState: JSON.stringify(input), correlationId: `accounting-rule:${id}` });
  return { id, active: true };
}

export async function listAccountingRulesForUser(input: { userId: number; organizationId: number; versionId: number; companyId?: number }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const access = await db.select({ id: pgcVersions.id }).from(pgcVersions).innerJoin(organizations, eq(pgcVersions.organizationId, organizations.id)).where(and(eq(pgcVersions.id, input.versionId), eq(pgcVersions.organizationId, input.organizationId), sql`(${organizations.ownerUserId} = ${input.userId} OR EXISTS (SELECT 1 FROM organizationMemberships AS om WHERE om.organizationId = ${organizations.id} AND om.userId = ${input.userId} AND om.status = 'ACTIVE'))`)).limit(1);
  if (!access[0]) throw new Error("PGC_VERSION_NOT_FOUND_OR_FORBIDDEN");
  return db.select().from(accountingRules).where(and(eq(accountingRules.organizationId, input.organizationId), eq(accountingRules.versionId, input.versionId), ...(input.companyId ? [eq(accountingRules.companyId, input.companyId)] : []))).orderBy(accountingRules.priority).limit(500);
}


export type PgcEvidenceReviewDecision = "CONFIRM" | "KEEP_PENDING" | "REQUEST_NEW_EVIDENCE" | "REJECT";

export function validatePgcEvidenceReviewDecision(input: { status: string; decision: PgcEvidenceReviewDecision; reviewNote?: string | null; hasPrimaryMetadata: boolean }) {
  if (input.status !== "UNDER_REVIEW") throw new Error("PGC_EVIDENCE_REVIEW_REQUIRED");
  if (input.decision !== "CONFIRM" && !input.reviewNote?.trim()) throw new Error("PGC_EVIDENCE_REVIEW_NOTE_REQUIRED");
  if (input.decision === "CONFIRM" && !input.hasPrimaryMetadata) throw new Error("PGC_EVIDENCE_PRIMARY_METADATA_REQUIRED");
  return input.decision === "CONFIRM" ? "ACCEPTED" as const : input.decision === "REJECT" ? "REJECTED" as const : "PENDING_REVIEW" as const;
}

export async function startPgcEvidenceReviewForUser(input: { userId: number; organizationId: number; companyId: number; versionId: number; submissionId: number }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const scope = await assertCompanyScope(input.userId, input.companyId);
  if (scope.company.organizationId !== input.organizationId) throw new Error("PGC_EVIDENCE_ORGANIZATION_MISMATCH");
  const rows = await db.select().from(pgcEvidenceSubmissions).where(and(eq(pgcEvidenceSubmissions.id, input.submissionId), eq(pgcEvidenceSubmissions.organizationId, input.organizationId), eq(pgcEvidenceSubmissions.companyId, input.companyId), eq(pgcEvidenceSubmissions.versionId, input.versionId))).limit(1);
  const submission = rows[0];
  if (!submission) throw new Error("PGC_EVIDENCE_SUBMISSION_NOT_FOUND_OR_FORBIDDEN");
  if (submission.status !== "PENDING_REVIEW") throw new Error("PGC_EVIDENCE_INVALID_STATE_TRANSITION");
  await db.update(pgcEvidenceSubmissions).set({ status: "UNDER_REVIEW" }).where(eq(pgcEvidenceSubmissions.id, input.submissionId));
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "PGC_EVIDENCE_REVIEW_STARTED", entityType: "pgcEvidenceSubmission", entityId: String(input.submissionId), beforeState: JSON.stringify({ status: submission.status }), afterState: JSON.stringify({ status: "UNDER_REVIEW" }), correlationId: submission.correlationId });
  return { submissionId: input.submissionId, status: "UNDER_REVIEW" as const };
}

export async function reviewPgcEvidenceSubmissionForUser(input: { userId: number; organizationId: number; companyId: number; versionId: number; submissionId: number; decision: PgcEvidenceReviewDecision; reviewNote?: string | null }) {
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const scope = await assertCompanyScope(input.userId, input.companyId);
  if (scope.company.organizationId !== input.organizationId) throw new Error("PGC_EVIDENCE_ORGANIZATION_MISMATCH");
  const rows = await db.select().from(pgcEvidenceSubmissions).where(and(eq(pgcEvidenceSubmissions.id, input.submissionId), eq(pgcEvidenceSubmissions.organizationId, input.organizationId), eq(pgcEvidenceSubmissions.companyId, input.companyId), eq(pgcEvidenceSubmissions.versionId, input.versionId))).limit(1);
  const submission = rows[0];
  if (!submission) throw new Error("PGC_EVIDENCE_SUBMISSION_NOT_FOUND_OR_FORBIDDEN");
  const note = input.reviewNote?.trim() || null;
  const nextStatus = validatePgcEvidenceReviewDecision({ status: submission.status, decision: input.decision, reviewNote: note, hasPrimaryMetadata: Boolean(submission.pageFrom && submission.pageTo && submission.sourceId) });
  await db.update(pgcEvidenceSubmissions).set({ status: nextStatus, reviewDecision: input.decision, reviewedBy: input.userId, reviewedAt: new Date(), reviewNote: note }).where(eq(pgcEvidenceSubmissions.id, input.submissionId));
  await appendAuditEventForUser({ organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.userId, action: "PGC_EVIDENCE_REVIEWED", entityType: "pgcEvidenceSubmission", entityId: String(input.submissionId), beforeState: JSON.stringify({ status: submission.status, reviewDecision: submission.reviewDecision }), afterState: JSON.stringify({ status: nextStatus, reviewDecision: input.decision, reviewNote: note, fileAssetId: submission.fileAssetId, targetCodes: JSON.parse(submission.targetCodes) }), correlationId: submission.correlationId });
  return { submissionId: input.submissionId, status: nextStatus, reviewDecision: input.decision };
}


export type PgcSimulationLevelStatus = "PASS" | "BLOCKED";
export type PgcSimulationLevel = {
  code: "STRUCTURAL" | "NORMATIVE" | "OPERATIONAL";
  label: string;
  status: PgcSimulationLevelStatus;
  checks: Array<{ code: string; label: string; status: PgcSimulationLevelStatus; detail: string }>;
};

export type PgcMovementSimulationInput = {
  userId: number;
  organizationId: number;
  companyId: number;
  versionId: number;
  debitAccountId: number;
  creditAccountId: number;
  amount: number;
  operation: string;
  documentType?: string | null;
  transactionDate: Date;
  ivaRate?: number | null;
  ivaAmount?: number | null;
};

export function validatePgcMovementSimulationInput(input: Omit<PgcMovementSimulationInput, "userId" | "organizationId" | "companyId" | "versionId" | "debitAccountId" | "creditAccountId"> & { debitAccountId: number; creditAccountId: number }) {
  if (!Number.isInteger(input.debitAccountId) || input.debitAccountId < 1 || !Number.isInteger(input.creditAccountId) || input.creditAccountId < 1) throw new Error("PGC_SIMULATION_ACCOUNTS_INVALID");
  if (input.debitAccountId === input.creditAccountId) throw new Error("PGC_SIMULATION_ACCOUNTS_MUST_DIFFER");
  if (!Number.isFinite(input.amount) || input.amount <= 0 || Math.round(input.amount * 100) !== input.amount * 100) throw new Error("PGC_SIMULATION_AMOUNT_INVALID");
  if (!input.operation.trim() || input.operation.trim().length > 80) throw new Error("PGC_SIMULATION_OPERATION_INVALID");
  if (Number.isNaN(input.transactionDate.getTime())) throw new Error("PGC_SIMULATION_DATE_INVALID");
  if (input.ivaRate != null && (!Number.isFinite(input.ivaRate) || input.ivaRate < 0 || input.ivaRate > 100)) throw new Error("PGC_SIMULATION_IVA_RATE_INVALID");
  if (input.ivaAmount != null && (!Number.isFinite(input.ivaAmount) || input.ivaAmount < 0 || Math.round(input.ivaAmount * 100) !== input.ivaAmount * 100)) throw new Error("PGC_SIMULATION_IVA_AMOUNT_INVALID");
  return true as const;
}

export function buildPgcMovementSimulation(ctx: { debitAccount: { id: number; code: string; name: string; nature: string; validationStatus: string; acceptsEntries: number; active: number }; creditAccount: { id: number; code: string; name: string; nature: string; validationStatus: string; acceptsEntries: number; active: number }; rule: { id: number; operation: string; documentType: string | null; priority: number } | null; versionStatus: string; periodStatus: string | null; input: PgcMovementSimulationInput }) {
  const structuralChecks = [
    { code: "AMOUNT_POSITIVE", label: "Valor positivo e com duas casas decimais", status: "PASS" as const, detail: `${ctx.input.amount.toFixed(2)} Kz` },
    { code: "DOUBLE_ENTRY", label: "Partida dobrada definida", status: "PASS" as const, detail: `${ctx.debitAccount.code} a débito e ${ctx.creditAccount.code} a crédito` },
    { code: "OPERATION_IDENTIFIED", label: "Operação identificada", status: "PASS" as const, detail: ctx.input.operation.trim() },
  ];
  const debitCompatible = ctx.debitAccount.nature === "DEBIT" || ctx.debitAccount.nature === "MIXED";
  const creditCompatible = ctx.creditAccount.nature === "CREDIT" || ctx.creditAccount.nature === "MIXED";
  const normativeChecks = [
    { code: "VERSION_ACTIVE", label: "Versão PGCA activa", status: ctx.versionStatus === "ACTIVE" ? "PASS" as const : "BLOCKED" as const, detail: ctx.versionStatus === "ACTIVE" ? "Versão activa" : `Versão em estado ${ctx.versionStatus}` },
    { code: "DEBIT_CONFIRMED", label: "Conta a débito confirmada e lançável", status: ctx.debitAccount.validationStatus === "CONFIRMED" && ctx.debitAccount.acceptsEntries === 1 && ctx.debitAccount.active === 1 ? "PASS" as const : "BLOCKED" as const, detail: `${ctx.debitAccount.code} — ${ctx.debitAccount.name}` },
    { code: "CREDIT_CONFIRMED", label: "Conta a crédito confirmada e lançável", status: ctx.creditAccount.validationStatus === "CONFIRMED" && ctx.creditAccount.acceptsEntries === 1 && ctx.creditAccount.active === 1 ? "PASS" as const : "BLOCKED" as const, detail: `${ctx.creditAccount.code} — ${ctx.creditAccount.name}` },
    { code: "NATURE_COMPATIBLE", label: "Natureza das contas compatível", status: debitCompatible && creditCompatible ? "PASS" as const : "BLOCKED" as const, detail: `Débito ${ctx.debitAccount.nature}; crédito ${ctx.creditAccount.nature}` },
    { code: "ACCOUNTING_RULE", label: "Regra contabilística confirmada encontrada", status: ctx.rule ? "PASS" as const : "BLOCKED" as const, detail: ctx.rule ? `Regra #${ctx.rule.id}, prioridade ${ctx.rule.priority}` : "Nenhuma regra activa corresponde à operação e às contas" },
  ];
  const operationalChecks = [
    { code: "PERIOD_OPEN", label: "Período fiscal aberto", status: ctx.periodStatus === "OPEN" || ctx.periodStatus === "REOPENED" ? "PASS" as const : "BLOCKED" as const, detail: ctx.periodStatus ? `Período ${ctx.periodStatus}` : "Período fiscal não encontrado" },
    { code: "NO_POSTING", label: "Simulação sem publicação", status: "PASS" as const, detail: "Nenhum lançamento foi criado, alterado ou publicado" },
  ];
  return {
    simulationOnly: true as const,
    canPost: false as const,
    levels: [
      { code: "STRUCTURAL" as const, label: "Nível 1 — Estrutural", status: structuralChecks.every((check) => check.status === "PASS") ? "PASS" as const : "BLOCKED" as const, checks: structuralChecks },
      { code: "NORMATIVE" as const, label: "Nível 2 — Normativo PGCA", status: normativeChecks.every((check) => check.status === "PASS") ? "PASS" as const : "BLOCKED" as const, checks: normativeChecks },
      { code: "OPERATIONAL" as const, label: "Nível 3 — Operacional", status: operationalChecks.every((check) => check.status === "PASS") ? "PASS" as const : "BLOCKED" as const, checks: operationalChecks },
    ] satisfies PgcSimulationLevel[],
    summary: structuralChecks.every((check) => check.status === "PASS") && normativeChecks.every((check) => check.status === "PASS") && operationalChecks.every((check) => check.status === "PASS") ? "SIMULAÇÃO VÁLIDA — pronta para revisão, não para publicação" : "SIMULAÇÃO BLOQUEADA — corrigir os pontos indicados antes de qualquer revisão",
    plannedMovement: { debit: ctx.debitAccount.code, credit: ctx.creditAccount.code, amount: ctx.input.amount, ivaRate: ctx.input.ivaRate ?? null, ivaAmount: ctx.input.ivaAmount ?? null, operation: ctx.input.operation.trim(), documentType: ctx.input.documentType?.trim() || null, transactionDate: ctx.input.transactionDate },
  };
}

export async function simulatePgcMovementForUser(input: PgcMovementSimulationInput) {
  validatePgcMovementSimulationInput(input);
  const db = await getDb(); if (!db) throw new Error("Database unavailable");
  const scope = await assertCompanyScope(input.userId, input.companyId);
  if (scope.company.organizationId !== input.organizationId) throw new Error("PGC_SIMULATION_ORGANIZATION_MISMATCH");
  const versionRows = await db.select().from(pgcVersions).where(and(eq(pgcVersions.id, input.versionId), eq(pgcVersions.organizationId, input.organizationId))).limit(1);
  const version = versionRows[0]; if (!version) throw new Error("PGC_SIMULATION_VERSION_NOT_FOUND_OR_FORBIDDEN");
  const accountRows = await db.select({ id: pgcAccounts.id, code: pgcAccounts.code, name: pgcAccounts.name, nature: pgcAccounts.nature, validationStatus: pgcAccounts.validationStatus, acceptsEntries: pgcAccounts.acceptsEntries, active: pgcAccounts.active }).from(pgcAccounts).where(and(eq(pgcAccounts.organizationId, input.organizationId), eq(pgcAccounts.versionId, input.versionId), inArray(pgcAccounts.id, [input.debitAccountId, input.creditAccountId])));
  const debitAccount = accountRows.find((account) => account.id === input.debitAccountId); const creditAccount = accountRows.find((account) => account.id === input.creditAccountId);
  const fallbackAccount = (id: number) => ({ id, code: `ID-${id}`, name: "Conta não encontrada", nature: "NOT_APPLICABLE", validationStatus: "NOT_CONFIRMED", acceptsEntries: 0, active: 0 });
  const resolvedDebit = debitAccount ?? fallbackAccount(input.debitAccountId); const resolvedCredit = creditAccount ?? fallbackAccount(input.creditAccountId);
  const ruleRows = await db.select({ id: accountingRules.id, operation: accountingRules.operation, documentType: accountingRules.documentType, priority: accountingRules.priority }).from(accountingRules).where(and(eq(accountingRules.organizationId, input.organizationId), eq(accountingRules.versionId, input.versionId), eq(accountingRules.active, 1), eq(accountingRules.operation, input.operation.trim()), sql`(${accountingRules.companyId} IS NULL OR ${accountingRules.companyId} = ${input.companyId})`, eq(accountingRules.debitAccountId, input.debitAccountId), eq(accountingRules.creditAccountId, input.creditAccountId), sql`(${accountingRules.effectiveFrom} <= ${input.transactionDate})`, sql`(${accountingRules.effectiveTo} IS NULL OR ${accountingRules.effectiveTo} >= ${input.transactionDate})`)).orderBy(accountingRules.priority).limit(20);
  const rule = ruleRows.find((candidate) => !candidate.documentType || candidate.documentType === (input.documentType?.trim() || null)) ?? null;
  const period = await db.select({ status: fiscalPeriods.status }).from(fiscalPeriods).where(and(eq(fiscalPeriods.companyId, input.companyId), eq(fiscalPeriods.year, input.transactionDate.getUTCFullYear()), eq(fiscalPeriods.month, input.transactionDate.getUTCMonth() + 1))).limit(1);
  return buildPgcMovementSimulation({ debitAccount: resolvedDebit, creditAccount: resolvedCredit, rule, versionStatus: version.status, periodStatus: period[0]?.status ?? null, input });
}
