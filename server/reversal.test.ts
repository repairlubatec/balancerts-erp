import { describe, expect, it } from "vitest";
import { buildReversalLines, reversalDescription } from "./reversal";

describe("controlled reversal", () => {
  it("inverts all journal lines without changing the original", () => {
    const original = [{ accountId: 1, debit: 100, credit: 0, currency: "AOA", exchangeRate: 1 }, { accountId: 2, debit: 0, credit: 100, currency: "AOA", exchangeRate: 1 }];
    expect(buildReversalLines(original)).toEqual([{ ...original[0], debit: 0, credit: 100 }, { ...original[1], debit: 100, credit: 0 }]);
    expect(original[0].debit).toBe(100);
  });

  it("requires a reason linked to the original entry", () => {
    expect(reversalDescription(42, "Correcção de documento")).toContain("42");
    expect(() => reversalDescription(42, "")).toThrow("REVERSAL_REASON_REQUIRED");
  });
});
