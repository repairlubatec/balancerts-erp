import { describe, expect, it } from "vitest";
import { calculateWeightedAverage } from "./inventory";

describe("stock valuation", () => {
  it("calculates weighted average cost across entries and exits", () => {
    expect(calculateWeightedAverage([
      { type: "IN", quantity: 10, unitCost: 100 },
      { type: "IN", quantity: 10, unitCost: 140 },
      { type: "OUT", quantity: 5, unitCost: 0 },
    ])).toEqual({ quantity: 15, value: 1800, averageCost: 120 });
  });

  it("rejects negative stock and invalid quantities", () => {
    expect(() => calculateWeightedAverage([{ type: "OUT", quantity: 1, unitCost: 0 }])).toThrow("NEGATIVE_STOCK_NOT_ALLOWED");
    expect(() => calculateWeightedAverage([{ type: "IN", quantity: 0, unitCost: 10 }])).toThrow("INVALID_STOCK_MOVEMENT");
  });
});
