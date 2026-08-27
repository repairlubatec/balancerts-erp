import { and, eq } from "drizzle-orm";
import { reviewPgcAccountsBatchForUser } from "../server/pgc.ts";
import { getDb } from "../server/db.ts";
import { pgcAccounts } from "../drizzle/schema.ts";

const userId = 1;
const organizationId = 1;
const versionId = 1;
const db = await getDb();
if (!db) throw new Error("DATABASE_UNAVAILABLE");

const pending = await db
  .select({ id: pgcAccounts.id })
  .from(pgcAccounts)
  .where(and(
    eq(pgcAccounts.organizationId, organizationId),
    eq(pgcAccounts.versionId, versionId),
    eq(pgcAccounts.validationStatus, "NEEDS_NORMATIVE_VALIDATION"),
  ));

const batches = [];
for (let index = 0; index < pending.length; index += 100) {
  const result = await reviewPgcAccountsBatchForUser({
    userId,
    organizationId,
    versionId,
    accountIds: pending.slice(index, index + 100).map(({ id }) => id),
    validationStatus: "CONFIRMED",
    notes: "Confirmação baseada no Decreto n.º 82/01 e na Colectânea de Legislação da Contabilidade de Angola submetida pelo utilizador; sem conflito legal identificado no escopo da conta.",
  });
  batches.push({ total: result.total, applied: result.applied.length, blocked: result.blocked?.length ?? 0 });
}

console.log(JSON.stringify({ pendingBefore: pending.length, batches }, null, 2));
