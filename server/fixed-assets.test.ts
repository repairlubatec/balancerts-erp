import { describe, expect, it } from "vitest";
import { calculateStraightLineDepreciation } from "./fixed-assets";

describe("fixed asset depreciation", () => {
  it("calculates monthly and accumulated straight-line depreciation", () => {
    expect(calculateStraightLineDepreciation({ acquisitionCost: 1200, residualValue: 0, usefulLifeMonths: 12, elapsedMonths: 3 })).toEqual({ depreciable: 1200, monthly: 100, accumulated: 300, netBookValue: 900 });
  });

  it("caps depreciation at the depreciable value", () => {
    expect(calculateStraightLineDepreciation({ acquisitionCost: 1000, residualValue: 100, usefulLifeMonths: 10, elapsedMonths: 20 }).netBookValue).toBe(100);
    expect(() => calculateStraightLineDepreciation({ acquisitionCost: 100, residualValue: 120, usefulLifeMonths: 10, elapsedMonths: 1 })).toThrow("INVALID_DEPRECIATION_PARAMETERS");
  });
});
