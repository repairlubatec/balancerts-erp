import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("lotes de confirmação humana PGCA/IVA", () => {
  it("separa as oito classes PGCA e os artigos/anexos IVA", () => {
    const path = "docs/normative-human-confirmation-batches.json";
    expect(existsSync(path)).toBe(true);
    const review = JSON.parse(readFileSync(path, "utf8"));
    expect(review.totalBatches).toBe(17);
    expect(review.batches.filter((b: { domain: string }) => b.domain === "PGCA")).toHaveLength(9);
    expect(review.batches.filter((b: { domain: string }) => b.domain === "IVA")).toHaveLength(8);
    expect(review.batches.every((b: { status: string }) => b.status === "PENDING_HUMAN_CONFIRMATION")).toBe(true);
    expect(review.batches.find((b: { batchId: string }) => b.batchId === "PGCA-CLASSE-4").confirmed).toBe(7);
    expect(review.batches.find((b: { batchId: string }) => b.batchId === "PGCA-CLASSE-6").confirmed).toBe(13);
    expect(review.batches.find((b: { batchId: string }) => b.batchId === "IVA-19").confirmed).toBe(1);
  });
});
