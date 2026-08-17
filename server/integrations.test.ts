import { describe, expect, it } from "vitest";
import { executeIdempotentIntegration } from "./integrations";

describe("external integrations", () => {
  it("acknowledges a successful idempotent operation", async () => {
    const result = await executeIdempotentIntegration({ idempotencyKey: "agt-1", execute: async () => "OK" });
    expect(result).toMatchObject({ state: "ACKNOWLEDGED", idempotencyKey: "agt-1", attempts: 1, result: "OK" });
  });

  it("retries bounded failures and requests reconciliation", async () => {
    const result = await executeIdempotentIntegration({ idempotencyKey: "agt-2", maxRetries: 1, timeoutMs: 20, execute: async () => { throw new Error("UPSTREAM_UNAVAILABLE"); } });
    expect(result).toMatchObject({ state: "RECONCILIATION_REQUIRED", attempts: 2, error: "UPSTREAM_UNAVAILABLE" });
  });

  it("aborts the timed-out attempt before requesting reconciliation", async () => {
    let aborted = false;
    const result = await executeIdempotentIntegration({ idempotencyKey: "agt-abort", maxRetries: 0, timeoutMs: 5, execute: async (signal) => {
      signal?.addEventListener("abort", () => { aborted = true; });
      await new Promise((resolve) => setTimeout(resolve, 25));
      return "late";
    } });
    expect(result).toMatchObject({ state: "RECONCILIATION_REQUIRED", attempts: 1, error: "INTEGRATION_TIMEOUT" });
    expect(aborted).toBe(true);
  });

  it("converts repeated upstream timeouts into an explicit reconciliation state", async () => {
    const result = await executeIdempotentIntegration({ idempotencyKey: "agt-timeout", maxRetries: 2, timeoutMs: 5, execute: async () => new Promise((resolve) => setTimeout(() => resolve("late"), 25)) });
    expect(result).toMatchObject({ state: "RECONCILIATION_REQUIRED", attempts: 3, error: "INTEGRATION_TIMEOUT" });
  });
});
