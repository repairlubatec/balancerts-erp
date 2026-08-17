import { describe, expect, it } from "vitest";
import { criticalMutationAuditMatrix, getCriticalMutationAuditContract } from "./audit-mutation-matrix";

describe("critical mutation audit matrix", () => {
  it("declares an audit contract for every supported critical mutation", () => {
    expect(criticalMutationAuditMatrix.length).toBeGreaterThanOrEqual(10);
    for (const contract of criticalMutationAuditMatrix) {
      expect(contract.mutation).toMatch(/\./);
      expect(contract.tables.length).toBeGreaterThan(0);
      expect(contract.action).toBeTruthy();
      expect(contract.entityType).toBeTruthy();
    }
  });

  it("resolves known contracts and rejects unknown mutations", () => {
    expect(getCriticalMutationAuditContract("documents.reserveNumber")).toMatchObject({
      action: "DOCUMENT_NUMBER_RESERVED",
      entityType: "documentSeries",
    });
    expect(getCriticalMutationAuditContract("unknown.mutation")).toBeNull();
  });
});
