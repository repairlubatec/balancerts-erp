export type PostedLine = {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
};

export type JournalRow = PostedLine & {
  entryId: number;
  description: string;
  createdAt: Date;
  sourceDocumentId: number | null;
};

const money = (value: number) => Math.round(value * 100) / 100;

export function buildTrialBalance(lines: PostedLine[]) {
  const byAccount = new Map<string, { accountCode: string; accountName: string; debit: number; credit: number }>();
  for (const line of lines) {
    const current = byAccount.get(line.accountCode) ?? { accountCode: line.accountCode, accountName: line.accountName, debit: 0, credit: 0 };
    current.debit = money(current.debit + line.debit);
    current.credit = money(current.credit + line.credit);
    byAccount.set(line.accountCode, current);
  }
  const rows = Array.from(byAccount.values()).sort((a, b) => a.accountCode.localeCompare(b.accountCode));
  const debit = rows.reduce((sum, row) => sum + row.debit, 0);
  const credit = rows.reduce((sum, row) => sum + row.credit, 0);
  return { rows, totals: { debit: money(debit), credit: money(credit) }, reconciled: Math.abs(debit - credit) <= 0.005 };
}

export function buildJournal(rows: JournalRow[]) {
  const entries = [...rows].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.entryId - b.entryId);
  return { entries, totals: { debit: money(entries.reduce((sum, row) => sum + row.debit, 0)), credit: money(entries.reduce((sum, row) => sum + row.credit, 0)) } };
}

export function buildLedger(rows: JournalRow[], accountCode?: string) {
  const filtered = accountCode ? rows.filter((row) => row.accountCode === accountCode) : rows;
  const entries = [...filtered].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.entryId - b.entryId);
  let balance = 0;
  const movements = entries.map((row) => {
    balance = money(balance + row.debit - row.credit);
    return { ...row, balance };
  });
  return { accountCode: accountCode ?? null, entries: movements, closingBalance: money(balance) };
}

export function buildIncomeStatement(lines: PostedLine[]) {
  const rows = buildTrialBalance(lines).rows.filter((row) => row.accountCode.startsWith("6") || row.accountCode.startsWith("7"));
  const expenses = money(rows.filter((row) => row.accountCode.startsWith("6")).reduce((sum, row) => sum + row.debit - row.credit, 0));
  const revenue = money(rows.filter((row) => row.accountCode.startsWith("7")).reduce((sum, row) => sum + row.credit - row.debit, 0));
  return { rows, revenue, expenses, netIncome: money(revenue - expenses) };
}

export function buildBalanceSheet(lines: PostedLine[]) {
  const rows = buildTrialBalance(lines).rows;
  const assets = money(rows.filter((row) => row.accountCode.startsWith("1") || row.accountCode.startsWith("2")).reduce((sum, row) => sum + row.debit - row.credit, 0));
  const liabilities = money(rows.filter((row) => row.accountCode.startsWith("3") || row.accountCode.startsWith("4")).reduce((sum, row) => sum + row.credit - row.debit, 0));
  const equity = money(rows.filter((row) => row.accountCode.startsWith("5")).reduce((sum, row) => sum + row.credit - row.debit, 0));
  const netIncome = buildIncomeStatement(lines).netIncome;
  return { rows, assets, liabilities, equity: money(equity + netIncome), netIncome, reconciled: Math.abs(assets - liabilities - equity - netIncome) <= 0.005 };
}
