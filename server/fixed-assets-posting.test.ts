import { describe, expect, it } from "vitest";
import { buildDepreciationPosting, validateDepreciationPostingReferences } from "./fixed-assets-posting";

describe("fixed asset depreciation posting", () => {
  it("creates an auditable balanced posting", () => {
    const result = buildDepreciationPosting({ assetId: 5, periodId: 9, depreciationAmount: 250, expenseAccountId: 68, accumulatedDepreciationAccountId: 39, correlationId: "dep-5-9" });
    expect(result).toMatchObject({ source: "FIXED_ASSET_DEPRECIATION", sourceId: "5", periodId: 9, correlationId: "dep-5-9" });
    expect(result.lines[0]?.debit).toBe(250);
    expect(result.lines[1]?.credit).toBe(250);
  });

  it("blocks depreciation when references or remaining value are invalid", () => {
    const valid = { assetFound: true, assetIsActive: true, assetIsInService: true, periodIsOpen: true, expenseAccountFound: true, accumulatedAccountFound: true, accountsAreDistinct: true, amountWithinRemaining: true };
    expect(validateDepreciationPostingReferences(valid)).toBe(true);
    expect(() => validateDepreciationPostingReferences({ ...valid, assetFound: false })).toThrow("FIXED_ASSET_NOT_FOUND_OR_FORBIDDEN");
    expect(() => validateDepreciationPostingReferences({ ...valid, assetIsActive: false })).toThrow("FIXED_ASSET_NOT_ACTIVE");
    expect(() => validateDepreciationPostingReferences({ ...valid, assetIsInService: false })).toThrow("FIXED_ASSET_NOT_IN_SERVICE");
    expect(() => validateDepreciationPostingReferences({ ...valid, periodIsOpen: false })).toThrow("FIXED_ASSET_PERIOD_NOT_OPEN");
    expect(() => validateDepreciationPostingReferences({ ...valid, accountsAreDistinct: false })).toThrow("FIXED_ASSET_DEPRECIATION_ACCOUNTS_MUST_DIFFER");
    expect(() => validateDepreciationPostingReferences({ ...valid, amountWithinRemaining: false })).toThrow("FIXED_ASSET_DEPRECIATION_EXCEEDS_REMAINING_VALUE");
  });

  it("rejects missing asset context", () => {
    expect(() => buildDepreciationPosting({ assetId: 0, periodId: 9, depreciationAmount: 250, expenseAccountId: 68, accumulatedDepreciationAccountId: 39, correlationId: "dep" })).toThrow("INVALID_DEPRECIATION_POSTING");
  });
});
