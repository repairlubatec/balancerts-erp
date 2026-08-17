import { describe, expect, it } from "vitest";
import { buildBalanceSheet, buildIncomeStatement, buildJournal, buildLedger } from "./report-suite";

const lines = [
  { entryId: 2, date: "2026-01-02", accountCode: "71", accountName: "Vendas", accountType: "REVENUE" as const, description: "Venda", debit: 0, credit: 200 },
  { entryId: 1, date: "2026-01-01", accountCode: "11", accountName: "Caixa", accountType: "ASSET" as const, description: "Entrada", debit: 200, credit: 0 },
  { entryId: 2, date: "2026-01-02", accountCode: "61", accountName: "Custo", accountType: "EXPENSE" as const, description: "Custo", debit: 80, credit: 0 },
  { entryId: 2, date: "2026-01-02", accountCode: "51", accountName: "Capital", accountType: "EQUITY" as const, description: "Capital", debit: 0, credit: 80 },
];

describe("financial report suite", () => {
  it("builds journal and account ledger deterministically", () => {
    expect(buildJournal(lines)[0]?.entryId).toBe(1);
    expect(buildLedger(lines, "71")).toHaveLength(1);
  });

  it("derives income statement and balanced sheet", () => {
    expect(buildIncomeStatement(lines)).toEqual({ revenue: 200, expenses: 80, netResult: 120 });
    expect(buildBalanceSheet(lines).balanced).toBe(true);
  });
});
