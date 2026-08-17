import { describe, expect, it } from "vitest";
import { getPendingMutationPolicy, pendingMutationPolicy } from "./pending-mutation-matrix";

describe("pending mutation policy", () => {
  it("enumerates every persistent critical mutation", () => {
    expect(pendingMutationPolicy.map((item) => item.mutation)).toEqual([
      "companies.create",
      "companies.activate",
      "inventory.record",
      "files.register",
      "documents.reserveNumber",
      "documents.transition",
      "accounting.post",
      "reversal.post",
      "fixedAssets.postDepreciation",
      "closing.validateReopen",
    ]);
    expect(pendingMutationPolicy.every((item) => item.guard.length > 0)).toBe(true);
  });

  it("allows pending only for provisioning operations", () => {
    expect(getPendingMutationPolicy("companies.create")?.allowsPending).toBe(true);
    expect(getPendingMutationPolicy("companies.activate")?.allowsPending).toBe(true);
    expect(pendingMutationPolicy.filter((item) => !item.allowsPending).length).toBe(8);
  });
});
