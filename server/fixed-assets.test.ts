import { describe, expect, it } from "vitest";
import { calculateStraightLineDepreciation, validateFixedAssetLifecycle } from "./fixed-assets";

describe("fixed asset depreciation", () => {
  it("calculates monthly and accumulated straight-line depreciation", () => {
    expect(calculateStraightLineDepreciation({ acquisitionCost: 1200, residualValue: 0, usefulLifeMonths: 12, elapsedMonths: 3 })).toEqual({ depreciable: 1200, monthly: 100, accumulated: 300, netBookValue: 900 });
  });

  it("caps depreciation at the depreciable value", () => {
    expect(calculateStraightLineDepreciation({ acquisitionCost: 1000, residualValue: 100, usefulLifeMonths: 10, elapsedMonths: 20 }).netBookValue).toBe(100);
    expect(() => calculateStraightLineDepreciation({ acquisitionCost: 100, residualValue: 120, usefulLifeMonths: 10, elapsedMonths: 1 })).toThrow("INVALID_DEPRECIATION_PARAMETERS");
  });
});


describe("fixed asset lifecycle", () => {
  const acquisitionDate = new Date("2026-01-10T00:00:00.000Z");

  it("accepts an in-service date after acquisition", () => {
    expect(validateFixedAssetLifecycle({ acquisitionDate, inServiceDate: new Date("2026-01-15T00:00:00.000Z"), status: "ACTIVE" })).toBe(true);
  });

  it("rejects disposal without date and reason", () => {
    expect(() => validateFixedAssetLifecycle({ acquisitionDate, status: "DISPOSED", disposalProceeds: 0 })).toThrow("FIXED_ASSET_DISPOSAL_EVIDENCE_REQUIRED");
  });

  it("rejects dates before the asset lifecycle predecessor", () => {
    expect(() => validateFixedAssetLifecycle({ acquisitionDate, inServiceDate: new Date("2026-01-05T00:00:00.000Z"), status: "ACTIVE" })).toThrow("INVALID_FIXED_ASSET_SERVICE_DATE");
    expect(() => validateFixedAssetLifecycle({ acquisitionDate, inServiceDate: new Date("2026-01-15T00:00:00.000Z"), status: "DISPOSED", disposalDate: new Date("2026-01-12T00:00:00.000Z"), disposalReason: "Alienação" })).toThrow("INVALID_FIXED_ASSET_DISPOSAL_DATE");
  });
});
