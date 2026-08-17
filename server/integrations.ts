export type IntegrationState = "PENDING" | "SENT" | "ACKNOWLEDGED" | "FAILED" | "RECONCILIATION_REQUIRED";

export async function executeIdempotentIntegration<T>(input: { idempotencyKey: string; execute: (signal?: AbortSignal) => Promise<T>; maxRetries?: number; timeoutMs?: number }) {
  const maxRetries = input.maxRetries ?? 2;
  const timeoutMs = input.timeoutMs ?? 5000;
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const controller = new AbortController();
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    try {
      const timeout = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error("INTEGRATION_TIMEOUT")), timeoutMs);
      });
      const result = await Promise.race([input.execute(controller.signal), timeout]);
      return { state: "ACKNOWLEDGED" as const, idempotencyKey: input.idempotencyKey, attempts: attempt + 1, result };
    } catch (error) {
      lastError = error;
      if (error instanceof Error && error.message === "INTEGRATION_TIMEOUT") controller.abort();
      if (attempt === maxRetries) break;
    } finally {
      if (timeoutHandle) clearTimeout(timeoutHandle);
    }
  }
  return { state: "RECONCILIATION_REQUIRED" as const, idempotencyKey: input.idempotencyKey, attempts: maxRetries + 1, error: lastError instanceof Error ? lastError.message : "INTEGRATION_FAILED" };
}


import { and, eq } from "drizzle-orm";
import { integrationOperations } from "../drizzle/schema";
import { getDb } from "./db";

export type PersistedIntegrationState = "PENDING" | "SENT" | "FAILED" | "RETRY" | "COMPLETED" | "RECONCILIATION_REQUIRED";

export async function executePersistedIdempotentIntegration<T>(input: { organizationId: number; companyId: number; idempotencyKey: string; execute: (signal?: AbortSignal) => Promise<T>; maxRetries?: number; timeoutMs?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await db.select().from(integrationOperations).where(and(eq(integrationOperations.organizationId, input.organizationId), eq(integrationOperations.companyId, input.companyId), eq(integrationOperations.idempotencyKey, input.idempotencyKey))).limit(1);
  let operation = existing[0];
  if (operation?.state === "COMPLETED") return { state: operation.state, idempotencyKey: input.idempotencyKey, attempts: operation.attempts, result: operation.resultPayload ? JSON.parse(operation.resultPayload) as T : undefined, idempotent: true };
  if (!operation) {
    const inserted = await db.insert(integrationOperations).values({ organizationId: input.organizationId, companyId: input.companyId, idempotencyKey: input.idempotencyKey, state: "PENDING", attempts: 0 });
    const created = await db.select().from(integrationOperations).where(eq(integrationOperations.id, Number(inserted[0].insertId))).limit(1);
    operation = created[0];
  }
  if (!operation) throw new Error("INTEGRATION_OPERATION_NOT_CREATED");
  const maxRetries = input.maxRetries ?? 2;
  const timeoutMs = input.timeoutMs ?? 5000;
  if (operation.state === "FAILED") await db.update(integrationOperations).set({ state: "RETRY" }).where(eq(integrationOperations.id, operation.id));
  for (let attempt = operation.attempts; attempt <= operation.attempts + maxRetries; attempt += 1) {
    await db.update(integrationOperations).set({ state: "SENT", attempts: attempt + 1, lastError: null }).where(eq(integrationOperations.id, operation.id));
    const controller = new AbortController();
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    try {
      const timeout = new Promise<never>((_, reject) => { timeoutHandle = setTimeout(() => reject(new Error("INTEGRATION_TIMEOUT")), timeoutMs); });
      const result = await Promise.race([input.execute(controller.signal), timeout]);
      await db.update(integrationOperations).set({ state: "COMPLETED", resultPayload: JSON.stringify(result), lastError: null }).where(eq(integrationOperations.id, operation.id));
      return { state: "COMPLETED" as const, idempotencyKey: input.idempotencyKey, attempts: attempt + 1, result, idempotent: false };
    } catch (error) {
      if (error instanceof Error && error.message === "INTEGRATION_TIMEOUT") controller.abort();
      const finalAttempt = attempt >= operation.attempts + maxRetries;
      await db.update(integrationOperations).set({ state: finalAttempt ? "FAILED" : "RETRY", lastError: error instanceof Error ? error.message : "INTEGRATION_FAILED" }).where(eq(integrationOperations.id, operation.id));
      if (finalAttempt) return { state: "FAILED" as const, idempotencyKey: input.idempotencyKey, attempts: attempt + 1, error: error instanceof Error ? error.message : "INTEGRATION_FAILED", idempotent: false };
    } finally {
      if (timeoutHandle) clearTimeout(timeoutHandle);
    }
  }
  throw new Error("INTEGRATION_RETRY_FLOW_INVALID");
}
