import { and, eq, inArray } from "drizzle-orm";
import { appendAuditEventForUser, getDb } from "../server/db";
import { auditEvents, chartAccounts, companies, journalEntries, journalLines, organizations } from "../drizzle/schema";

const COMPANY_ID = 1;
const ORGANIZATION_ID = 1;
const ACTOR_USER_ID = 1;
const ENTRY_ID = 3420001;
const CORRELATION_ID = "repair:journal-entry:3420001:pgc-20260820";

async function main() {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");

  const entryScope = await db.select({ entry: journalEntries, organizationId: organizations.id }).from(journalEntries).innerJoin(companies, eq(journalEntries.companyId, companies.id)).innerJoin(organizations, eq(companies.organizationId, organizations.id)).where(and(eq(journalEntries.id, ENTRY_ID), eq(journalEntries.companyId, COMPANY_ID), eq(organizations.id, ORGANIZATION_ID))).limit(1);
  if (!entryScope[0]) throw new Error("JOURNAL_ENTRY_NOT_FOUND_OR_FORBIDDEN");
  if (entryScope[0].entry.status !== "POSTED" || entryScope[0].entry.reviewStatus !== "APPROVED") throw new Error("JOURNAL_ENTRY_NOT_APPROVED_POSTED");

  const orphanLines = await db.select({ line: journalLines }).from(journalLines).innerJoin(journalEntries, eq(journalLines.entryId, journalEntries.id)).where(and(eq(journalLines.entryId, ENTRY_ID), eq(journalEntries.companyId, COMPANY_ID), inArray(journalLines.accountId, [4511, 6131]))).orderBy(journalLines.id);
  if (orphanLines.length !== 2) {
    const current = await db.select({ line: journalLines, account: chartAccounts }).from(journalLines).leftJoin(chartAccounts, eq(journalLines.accountId, chartAccounts.id)).where(eq(journalLines.entryId, ENTRY_ID)).orderBy(journalLines.id);
    if (current.every(({ account }) => account)) {
      console.log(JSON.stringify({ status: "ALREADY_REPAIRED", entryId: ENTRY_ID, lines: current.map(({ line, account }) => ({ lineId: line.id, accountId: line.accountId, code: account?.code })) }, null, 2));
      return;
    }
    throw new Error("ORPHAN_LINE_SCOPE_CHANGED");
  }

  const cash = await db.select({ account: chartAccounts }).from(chartAccounts).where(and(eq(chartAccounts.companyId, COMPANY_ID), eq(chartAccounts.code, "45.1.1"), eq(chartAccounts.postable, 1))).limit(1);
  if (!cash[0]) throw new Error("PGC_4511_ACCOUNT_NOT_FOUND");

  const createdAccounts: Array<{ id: number; code: string; name: string; parentCode: string | null }> = [];
  const salesAccount = await db.transaction(async (tx) => {
    const ensure = async (code: string, name: string, parentCode: string | null, postable: number) => {
      const existing = await tx.select({ account: chartAccounts }).from(chartAccounts).where(and(eq(chartAccounts.companyId, COMPANY_ID), eq(chartAccounts.code, code))).limit(1);
      if (existing[0]) {
        if (existing[0].account.postable !== postable) throw new Error(`PGC_ACCOUNT_NOT_POSTABLE:${code}`);
        return existing[0].account;
      }
      if (parentCode) {
        const parent = await tx.select({ id: chartAccounts.id }).from(chartAccounts).where(and(eq(chartAccounts.companyId, COMPANY_ID), eq(chartAccounts.code, parentCode))).limit(1);
        if (!parent[0]) throw new Error(`PGC_PARENT_ACCOUNT_NOT_FOUND:${parentCode}`);
      }
      const inserted = await tx.insert(chartAccounts).values({ companyId: COMPANY_ID, code, name, parentCode, postable, validFrom: new Date("2023-09-01T00:00:00.000Z"), validTo: null });
      const id = Number(inserted[0].insertId);
      const account = { id, companyId: COMPANY_ID, code, name, parentCode, postable, validFrom: new Date("2023-09-01T00:00:00.000Z"), validTo: null };
      createdAccounts.push({ id, code, name, parentCode });
      return account;
    };

    await ensure("61", "Vendas", null, 0);
    await ensure("61.3", "Mercadorias", "61", 0);
    return ensure("61.3.1", "Mercadorias — Mercado nacional", "61.3", 1);
  });

  const beforeState = orphanLines.map(({ line }) => ({ lineId: line.id, accountId: line.accountId, debit: line.debit, credit: line.credit, currency: line.currency }));
  const afterMappings = { [String(orphanLines.find(({ line }) => line.accountId === 4511)?.line.id)]: cash[0].account.id, [String(orphanLines.find(({ line }) => line.accountId === 6131)?.line.id)]: salesAccount.id };
  await db.transaction(async (tx) => {
    await tx.update(journalLines).set({ accountId: cash[0].account.id }).where(and(eq(journalLines.id, orphanLines.find(({ line }) => line.accountId === 4511)!.line.id), eq(journalLines.accountId, 4511)));
    await tx.update(journalLines).set({ accountId: salesAccount.id }).where(and(eq(journalLines.id, orphanLines.find(({ line }) => line.accountId === 6131)!.line.id), eq(journalLines.accountId, 6131)));
  });

  for (const account of createdAccounts) {
    await appendAuditEventForUser({ organizationId: ORGANIZATION_ID, companyId: COMPANY_ID, actorUserId: ACTOR_USER_ID, action: "CHART_ACCOUNT_CREATED", entityType: "chartAccount", entityId: String(account.id), beforeState: null, afterState: JSON.stringify({ ...account, source: "PGC_ORPHAN_REPAIR", normalizedPgcCode: account.code.replace(/\./g, "") }), correlationId: `${CORRELATION_ID}:account:${account.code}` });
  }
  await appendAuditEventForUser({ organizationId: ORGANIZATION_ID, companyId: COMPANY_ID, actorUserId: ACTOR_USER_ID, action: "JOURNAL_ORPHAN_REFERENCES_REPAIRED", entityType: "journalEntry", entityId: String(ENTRY_ID), beforeState: JSON.stringify({ lines: beforeState }), afterState: JSON.stringify({ lineAccountMappings: afterMappings, preservedValues: true, source: "PGC_ORPHAN_REPAIR", normalizedPgcCodes: { "4511": "45.1.1", "6131": "61.3.1" } }), correlationId: CORRELATION_ID });

  console.log(JSON.stringify({ status: "REPAIRED", entryId: ENTRY_ID, cashAccountId: cash[0].account.id, salesAccountId: salesAccount.id, createdAccounts, beforeState, afterMappings }, null, 2));
}

main().catch((error) => { console.error(`REPAIR_FAILED:${error instanceof Error ? error.message : String(error)}`); process.exitCode = 1; });
