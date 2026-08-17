import { describe, expect, it } from "vitest";
import { buildDepreciationPosting } from "./fixed-assets-posting";

describe("fixed asset depreciation posting", () => {
  it("creates an auditable balanced posting", () => {
    const result = buildDepreciationPosting({ assetId: 5, periodId: 9, depreciationAmount: 250, expenseAccountId: 68, accumulatedDepreciationAccountId: 39, correlationId: "dep-5-9" });
    expect(result).toMatchObject({ source: "FIXED_ASSET_DEPRECIATION", sourceId: "5", periodId: 9, correlationId: "dep-5-9" });
    expect(result.lines[0]?.debit).toBe(250);
    expect(result.lines[1]?.credit).toBe(250);
  });

  it("rejects missing asset context", () => {
    expect(() => buildDepreciationPosting({ assetId: 0, periodId: 9, depreciationAmount: 250, expenseAccountId: 68, accumulatedDepreciationAccountId: 39, correlationId: "dep" })).toThrow("INVALID_DEPRECIATION_POSTING");
  });
});
