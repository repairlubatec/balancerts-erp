export type PostedLine = { accountCode: string; accountName: string; debit: number; credit: number };

export function buildTrialBalance(lines: PostedLine[]) {
  const byAccount = new Map<string, { accountCode: string; accountName: string; debit: number; credit: number }>();
  for (const line of lines) {
    const current = byAccount.get(line.accountCode) ?? { accountCode: line.accountCode, accountName: line.accountName, debit: 0, credit: 0 };
    current.debit = Math.round((current.debit + line.debit) * 100) / 100;
    current.credit = Math.round((current.credit + line.credit) * 100) / 100;
    byAccount.set(line.accountCode, current);
  }
  const rows = Array.from(byAccount.values()).sort((a, b) => a.accountCode.localeCompare(b.accountCode));
  const debit = rows.reduce((sum, row) => sum + row.debit, 0);
  const credit = rows.reduce((sum, row) => sum + row.credit, 0);
  return { rows, totals: { debit: Math.round(debit * 100) / 100, credit: Math.round(credit * 100) / 100 }, reconciled: Math.abs(debit - credit) <= 0.005 };
}
