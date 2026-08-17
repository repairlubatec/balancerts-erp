import { describe, expect, it } from "vitest";
import { reconcileBankMovements } from "./reconciliation";

describe("bank reconciliation", () => {
  it("matches by reference before falling back to amount and date", () => {
    const result = reconcileBankMovements(
      [{ id: "b1", reference: "FT-1", amount: 100, date: "2026-01-15" }, { id: "b2", amount: 50, date: "2026-01-16" }],
      [{ id: "l1", reference: "FT-1", amount: 100, date: "2026-01-01" }, { id: "l2", amount: 50, date: "2026-01-16" }],
    );
    expect(result.matches).toEqual([{ bankId: "b1", ledgerId: "l1", confidence: "REFERENCE" }, { bankId: "b2", ledgerId: "l2", confidence: "AMOUNT_DATE" }]);
    expect(result.reconciled).toBe(true);
  });

  it("keeps unmatched movements explicit", () => {
    const result = reconcileBankMovements([{ id: "b1", amount: 100, date: "2026-01-15" }], [{ id: "l1", amount: 90, date: "2026-01-15" }]);
    expect(result.reconciled).toBe(false);
    expect(result.unmatchedBank).toHaveLength(1);
    expect(result.unmatchedLedger).toHaveLength(1);
  });
});
