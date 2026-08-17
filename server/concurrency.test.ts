import { describe, expect, it } from "vitest";
import { resolveIdempotentRequest, type IdempotencyRecord } from "./idempotency";

describe("concurrency and idempotency", () => {
  it("allows only the first request to execute while the key is processing", async () => {
    const processing: IdempotencyRecord<unknown>[] = [{ key: "same-operation", status: "PROCESSING" }];
    const results = await Promise.all([
      Promise.resolve().then(() => resolveIdempotentRequest(processing, "same-operation")),
      Promise.resolve().then(() => resolveIdempotentRequest(processing, "same-operation")),
    ]);

    expect(results).toEqual([{ action: "RETRY_LATER" }, { action: "RETRY_LATER" }]);
    expect(processing).toHaveLength(1);
  });
});

