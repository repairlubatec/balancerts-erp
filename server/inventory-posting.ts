import type { StockMovement } from "./inventory";

export function reconcileInventoryToLedger(movements: Array<{ type: "IN" | "OUT"; quantity: number; unitCost: number }>, ledgerInventoryValue: number) {
  const expected = movements.reduce((total, movement) => total + (movement.type === "IN" ? 1 : -1) * movement.quantity * movement.unitCost, 0);
  const roundedExpected = Math.round(expected * 100) / 100;
  const roundedLedger = Math.round(ledgerInventoryValue * 100) / 100;
  return { reconciled: roundedExpected === roundedLedger, expected: roundedExpected, ledger: roundedLedger, difference: Math.round((roundedExpected - roundedLedger) * 100) / 100 };
}

export function buildInventoryPosting(movement: StockMovement, inventoryAccountId: number, offsetAccountId: number) {
  if (movement.quantity <= 0 || movement.unitCost < 0) throw new Error("INVALID_INVENTORY_MOVEMENT");
  const amount = Math.round(movement.quantity * movement.unitCost * 100) / 100;
  if (movement.type === "IN") return { amount, lines: [{ accountId: inventoryAccountId, debit: amount, credit: 0 }, { accountId: offsetAccountId, debit: 0, credit: amount }] };
  return { amount, lines: [{ accountId: offsetAccountId, debit: amount, credit: 0 }, { accountId: inventoryAccountId, debit: 0, credit: amount }] };
}
