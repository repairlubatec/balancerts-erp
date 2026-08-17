import { describe, expect, it } from "vitest";
import { convertToFunctionalCurrency } from "./currency";

describe("multi-currency conversion", () => {
  it("preserves operation and functional currency evidence", () => {
    expect(convertToFunctionalCurrency(100, "USD", "AOA", { from: "USD", to: "AOA", rate: 850, source: "BNA", date: "2026-01-15" })).toEqual({ operationAmount: 100, operationCurrency: "USD", functionalAmount: 85000, functionalCurrency: "AOA", rate: 850, source: "BNA", date: "2026-01-15" });
  });

  it("rejects mismatched currency context", () => {
    expect(() => convertToFunctionalCurrency(100, "EUR", "AOA", { from: "USD", to: "AOA", rate: 900, source: "BNA", date: "2026-01-15" })).toThrow("INVALID_EXCHANGE_RATE_CONTEXT");
  });
});
