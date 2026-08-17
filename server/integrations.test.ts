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
});
