export type ReportLine = { entryId: number; date: string; accountCode: string; accountName: string; accountType: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE"; description: string; debit: number; credit: number };

export function buildJournal(lines: ReportLine[]) {
  return [...lines].sort((a, b) => a.date.localeCompare(b.date) || a.entryId - b.entryId);
}

export function buildLedger(lines: ReportLine[], accountCode: string) {
  return buildJournal(lines.filter((line) => line.accountCode === accountCode));
}

export function buildIncomeStatement(lines: ReportLine[]) {
  const revenue = lines.filter((line) => line.accountType === "REVENUE").reduce((sum, line) => sum + line.credit - line.debit, 0);
  const expenses = lines.filter((line) => line.accountType === "EXPENSE").reduce((sum, line) => sum + line.debit - line.credit, 0);
  return { revenue: Math.round(revenue * 100) / 100, expenses: Math.round(expenses * 100) / 100, netResult: Math.round((revenue - expenses) * 100) / 100 };
}

export function buildBalanceSheet(lines: ReportLine[]) {
  const total = (type: ReportLine["accountType"]) => lines.filter((line) => line.accountType === type).reduce((sum, line) => sum + line.debit - line.credit, 0);
  const assets = total("ASSET");
  const liabilities = -total("LIABILITY");
  const equity = -total("EQUITY");
  const netResult = buildIncomeStatement(lines).netResult;
  const totalEquity = equity + netResult;
  return { assets: Math.round(assets * 100) / 100, liabilities: Math.round(liabilities * 100) / 100, equity: Math.round(totalEquity * 100) / 100, balanced: Math.abs(assets - (liabilities + totalEquity)) <= 0.005 };
}
