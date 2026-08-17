import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { integrationOperations } from "../drizzle/schema";
import { getDb } from "./db";
import { executePersistedIdempotentIntegration } from "./integrations";

const TEST_ORGANIZATION_ID = 1;
const TEST_COMPANY_ID = 30001;
const TEST_USER_KEY = `persisted-recovery-${Date.now()}`;

describe("persisted integration recovery", () => {
  it("persists FAILED, retries to COMPLETED and replays without duplication", async () => {
    const db = await getDb();
    expect(db).toBeTruthy();
    const key = TEST_USER_KEY;
    try {
      const failed = await executePersistedIdempotentIntegration({ organizationId: TEST_ORGANIZATION_ID, companyId: TEST_COMPANY_ID, idempotencyKey: key, maxRetries: 0, execute: async () => { throw new Error("REMOTE_PARTIAL_FAILURE"); } });
      expect(failed).toMatchObject({ state: "FAILED", attempts: 1, error: "REMOTE_PARTIAL_FAILURE" });
      const failedRow = await db!.select({ state: integrationOperations.state, attempts: integrationOperations.attempts }).from(integrationOperations).where(and(eq(integrationOperations.companyId, TEST_COMPANY_ID), eq(integrationOperations.idempotencyKey, key)));
      expect(failedRow).toEqual([{ state: "FAILED", attempts: 1 }]);

      const completed = await executePersistedIdempotentIntegration({ organizationId: TEST_ORGANIZATION_ID, companyId: TEST_COMPANY_ID, idempotencyKey: key, maxRetries: 0, execute: async () => ({ remoteId: "AO-RECOVERED-1" }) });
      expect(completed).toMatchObject({ state: "COMPLETED", attempts: 2, result: { remoteId: "AO-RECOVERED-1" }, idempotent: false });
      const completedRow = await db!.select({ state: integrationOperations.state, attempts: integrationOperations.attempts, resultPayload: integrationOperations.resultPayload }).from(integrationOperations).where(and(eq(integrationOperations.companyId, TEST_COMPANY_ID), eq(integrationOperations.idempotencyKey, key)));
      expect(completedRow[0]).toMatchObject({ state: "COMPLETED", attempts: 2, resultPayload: JSON.stringify({ remoteId: "AO-RECOVERED-1" }) });

      const replayed = await executePersistedIdempotentIntegration({ organizationId: TEST_ORGANIZATION_ID, companyId: TEST_COMPANY_ID, idempotencyKey: key, execute: async () => { throw new Error("MUST_NOT_EXECUTE"); } });
      expect(replayed).toMatchObject({ state: "COMPLETED", attempts: 2, result: { remoteId: "AO-RECOVERED-1" }, idempotent: true });
      expect((await db!.select({ id: integrationOperations.id }).from(integrationOperations).where(eq(integrationOperations.idempotencyKey, key)))).toHaveLength(1);
      await expect(executePersistedIdempotentIntegration({ organizationId: TEST_ORGANIZATION_ID, companyId: 30002, idempotencyKey: key, execute: async () => ({ remoteId: "MUST_NOT_EXECUTE" }) })).rejects.toThrow("INTEGRATION_SCOPE_MISMATCH");
    } finally {
      await db?.delete(integrationOperations).where(eq(integrationOperations.idempotencyKey, key));
    }
  }, 15000);
});
