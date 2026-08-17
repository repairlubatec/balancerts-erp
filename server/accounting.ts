export type JournalLineInput = { debit: number; credit: number; accountId: number; postable: boolean; validFrom: Date; validTo?: Date | null };

export function validateBalancedEntry(lines: JournalLineInput[], at = new Date()) {
  if (lines.length < 2) return { ok: false as const, reason: "ENTRY_REQUIRES_TWO_LINES" };
  const debit = lines.reduce((sum, line) => sum + line.debit, 0);
  const credit = lines.reduce((sum, line) => sum + line.credit, 0);
  if (Math.abs(debit - credit) > 0.005) return { ok: false as const, reason: "DEBIT_MUST_EQUAL_CREDIT" };
  if (lines.some((line) => line.debit < 0 || line.credit < 0 || (line.debit > 0 && line.credit > 0))) return { ok: false as const, reason: "LINE_SIDE_INVALID" };
  if (lines.some((line) => !line.postable)) return { ok: false as const, reason: "ACCOUNT_NOT_POSTABLE" };
  if (lines.some((line) => line.validFrom > at || (line.validTo && line.validTo < at))) return { ok: false as const, reason: "ACCOUNT_NOT_VALID" };
  return { ok: true as const, debit, credit };
}

export const documentTransitions = {
  DRAFT: ["VALIDATED"],
  VALIDATED: ["ISSUED", "DRAFT"],
  ISSUED: ["ACCOUNTED", "CANCELLED"],
  ACCOUNTED: ["CANCELLED"],
  CANCELLED: [],
} as const;

export function validateDocumentTransition(from: keyof typeof documentTransitions, to: string) {
  return (documentTransitions[from] as readonly string[]).includes(to);
}
