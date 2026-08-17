import { describe, expect, it } from "vitest";
import { resolveIdempotentRequest } from "./idempotency";

describe("idempotent requests", () => {
  it("executes new keys and returns completed results", () => {
    expect(resolveIdempotentRequest([], "k1")).toEqual({ action: "EXECUTE" });
    expect(resolveIdempotentRequest([{ key: "k1", status: "COMPLETED", result: { id: 1 } }], "k1")).toEqual({ action: "RETURN_EXISTING", result: { id: 1 } });
  });

  it("does not duplicate processing while in flight and allows failed retry", () => {
    expect(resolveIdempotentRequest([{ key: "k1", status: "PROCESSING" }], "k1")).toEqual({ action: "RETRY_LATER" });
    expect(resolveIdempotentRequest([{ key: "k1", status: "FAILED", error: "TIMEOUT" }], "k1")).toEqual({ action: "RETRY", error: "TIMEOUT" });
  });

  it("rejects blank keys before any operation can execute", () => {
    expect(() => resolveIdempotentRequest([], "   ")).toThrow("IDEMPOTENCY_KEY_REQUIRED");
  });
});
