export type BankMovement = { id: string; reference?: string; amount: number; date: string };
export type LedgerMovement = { id: string; reference?: string; amount: number; date: string };

export function applyReconciliationAdjustment(rawDifference: number, adjustmentAmount = 0, adjustmentReason?: string) {
  const roundedAdjustment = Number(adjustmentAmount.toFixed(2));
  if (Math.abs(roundedAdjustment) > 0.01 && !adjustmentReason?.trim()) throw new Error("RECONCILIATION_ADJUSTMENT_REASON_REQUIRED");
  if (Math.abs(roundedAdjustment) > 1_000_000_000) throw new Error("RECONCILIATION_ADJUSTMENT_TOO_LARGE");
  const difference = Number((rawDifference - roundedAdjustment).toFixed(2));
  return { adjustmentAmount: roundedAdjustment, difference, reconciled: Math.abs(difference) <= 0.01, adjustmentReason: adjustmentReason?.trim() ?? null };
}

export function reconcileBankMovements(bank: BankMovement[], ledger: LedgerMovement[], tolerance = 0.01) {
  const used = new Set<string>();
  const matches: Array<{ bankId: string; ledgerId: string; confidence: "REFERENCE" | "AMOUNT_DATE" }> = [];
  const unmatchedBank: BankMovement[] = [];
  for (const movement of bank) {
    const byReference = movement.reference && ledger.find((candidate) => !used.has(candidate.id) && candidate.reference === movement.reference && Math.abs(candidate.amount - movement.amount) <= tolerance);
    const byAmountDate = !byReference && ledger.find((candidate) => !used.has(candidate.id) && Math.abs(candidate.amount - movement.amount) <= tolerance && candidate.date === movement.date);
    const match = byReference ?? byAmountDate;
    if (!match) unmatchedBank.push(movement);
    else {
      used.add(match.id);
      matches.push({ bankId: movement.id, ledgerId: match.id, confidence: byReference ? "REFERENCE" : "AMOUNT_DATE" });
    }
  }
  return { matches, unmatchedBank, unmatchedLedger: ledger.filter((entry) => !used.has(entry.id)), reconciled: unmatchedBank.length === 0 && used.size === ledger.length };
}
