export type PostedLine = { accountId: number; debit: number; credit: number; currency: string; exchangeRate: number };

export function buildReversalLines(lines: PostedLine[]) {
  if (lines.length < 2) throw new Error("REVERSAL_REQUIRES_ENTRY_LINES");
  return lines.map((line) => ({ ...line, debit: line.credit, credit: line.debit }));
}

export function reversalDescription(originalEntryId: number, reason: string) {
  if (!reason.trim()) throw new Error("REVERSAL_REASON_REQUIRED");
  return `Estorno do lançamento ${originalEntryId}: ${reason.trim()}`;
}
