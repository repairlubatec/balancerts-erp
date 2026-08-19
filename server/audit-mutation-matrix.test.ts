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

  it("validates event action/entity and explicit snapshot presence for every critical mutation", () => {
    const fixtures = [
      ["companies.create", "COMPANY_CREATED_PENDING", "company"],
      ["companies.activate", "COMPANY_ACTIVATED", "company"],
      ["inventory.record", "STOCK_MOVEMENT_RECORDED", "stockMovement"],
      ["files.register", "FILE_ASSET_REGISTERED", "fileAsset"],
      ["purchases.receive", "PURCHASE_RECEIPT_REGISTERED", "purchaseReceipt"],
      ["documents.reserveNumber", "DOCUMENT_NUMBER_RESERVED", "documentSeries"],
      ["documents.transition", "DOCUMENT_ISSUED", "businessDocument"],
      ["accounting.post", "JOURNAL_ENTRY_POSTED", "journalEntry"],
      ["reversal.post", "JOURNAL_ENTRY_REVERSED", "journalEntry"],
      ["fixedAssets.postDepreciation", "FIXED_ASSET_DEPRECIATION_POST", "FIXED_ASSET"],
      ["closing.validateReopen", "PERIOD_REOPEN", "FISCAL_PERIOD"],
    ] as const;
    for (const [mutation, action, entityType] of fixtures) {
      expect(validateCriticalMutationAuditEvent({ mutation, action, entityType, beforeState: null, afterState: JSON.stringify({ fixture: true }) })).toEqual({ valid: true, reason: null });
    }
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
