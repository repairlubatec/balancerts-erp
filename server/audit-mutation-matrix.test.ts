import { describe, expect, it } from "vitest";
import { criticalMutationAuditMatrix, getCriticalMutationAuditContract, getCriticalMutationForAuditAction, validateCriticalMutationAuditEvent } from "./audit-mutation-matrix";

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

  it("validates event action/entity and explicit snapshot presence per mutation", () => {
    expect(validateCriticalMutationAuditEvent({ mutation: "documents.transition", action: "DOCUMENT_ISSUED", entityType: "businessDocument", beforeState: JSON.stringify({ status: "VALIDATED" }), afterState: JSON.stringify({ status: "ISSUED" }) })).toEqual({ valid: true, reason: null });
    expect(validateCriticalMutationAuditEvent({ mutation: "accounting.post", action: "JOURNAL_ENTRY_POSTED", entityType: "journalEntry", beforeState: null, afterState: JSON.stringify({ lineCount: 2 }) })).toEqual({ valid: true, reason: null });
    expect(validateCriticalMutationAuditEvent({ mutation: "accounting.post", action: "WRONG", entityType: "journalEntry", beforeState: null, afterState: null })).toEqual({ valid: false, reason: "AUDIT_CONTRACT_MISMATCH" });
    expect(validateCriticalMutationAuditEvent({ mutation: "unknown.mutation", action: "UNKNOWN", entityType: "unknown", beforeState: null, afterState: null })).toEqual({ valid: false, reason: "UNKNOWN_MUTATION" });
  });

  it("resolves known contracts and rejects unknown mutations", () => {
    expect(getCriticalMutationAuditContract("documents.reserveNumber")).toMatchObject({
      action: "DOCUMENT_NUMBER_RESERVED",
      entityType: "documentSeries",
    });
    expect(getCriticalMutationAuditContract("unknown.mutation")).toBeNull();
    expect(getCriticalMutationForAuditAction("DOCUMENT_ISSUED", "businessDocument")).toBe("documents.transition");
    expect(getCriticalMutationForAuditAction("JOURNAL_ENTRY_POSTED", "journalEntry")).toBe("accounting.post");
    expect(getCriticalMutationForAuditAction("UNKNOWN", "unknown")).toBeNull();
  });
});
