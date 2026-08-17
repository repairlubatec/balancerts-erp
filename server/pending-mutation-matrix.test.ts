import { describe, expect, it } from "vitest";
import { criticalMutationAuditMatrix } from "./audit-mutation-matrix";
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

  it("keeps every critical mutation aligned with an audit contract", () => {
    expect(new Set(pendingMutationPolicy.map((item) => item.mutation))).toEqual(new Set(criticalMutationAuditMatrix.map((item) => item.mutation)));
  });

  it("allows pending only for provisioning operations", () => {
    const expected = new Map([
      ["companies.create", true], ["companies.activate", true], ["inventory.record", false], ["files.register", false],
      ["documents.reserveNumber", false], ["documents.transition", false], ["accounting.post", false], ["reversal.post", false],
      ["fixedAssets.postDepreciation", false], ["closing.validateReopen", false],
    ]);
    for (const [mutation, allowsPending] of expected) expect(getPendingMutationPolicy(mutation)?.allowsPending).toBe(allowsPending);
    expect(pendingMutationPolicy.filter((item) => !item.allowsPending).length).toBe(8);
  });
});
