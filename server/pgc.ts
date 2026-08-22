import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { getDb, appendAuditEventForUser } from "./db";
import { accountingRules, chartAccounts, companies, organizations, pgcAccounts, pgcAuditFindings, pgcAuditRuns, pgcMigrationMaps, pgcSources, pgcVersions } from "../drizzle/schema";
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
