import { describe, expect, it } from "vitest";
import { buildInventoryPosting, reconcileInventoryToLedger } from "./inventory-posting";

describe("inventory accounting posting", () => {
  it("posts an inventory receipt", () => {
    const result = buildInventoryPosting({ type: "IN", quantity: 5, unitCost: 100 }, 10, 20);
    expect(result).toEqual({ amount: 500, lines: [{ accountId: 10, debit: 500, credit: 0 }, { accountId: 20, debit: 0, credit: 500 }] });
  });

  it("posts an inventory issue to the offset account", () => {
    const result = buildInventoryPosting({ type: "OUT", quantity: 2, unitCost: 100 }, 10, 60);
    expect(result.lines[0]).toEqual({ accountId: 60, debit: 200, credit: 0 });
    expect(result.lines[1]).toEqual({ accountId: 10, debit: 0, credit: 200 });
  });

  it("reconciles stock value against the ledger", () => {
    expect(reconcileInventoryToLedger([{ type: "IN", quantity: 5, unitCost: 100 }, { type: "OUT", quantity: 2, unitCost: 100 }], 300)).toMatchObject({ reconciled: true, difference: 0 });
    expect(reconcileInventoryToLedger([{ type: "IN", quantity: 5, unitCost: 100 }], 450).reconciled).toBe(false);
  });
});
