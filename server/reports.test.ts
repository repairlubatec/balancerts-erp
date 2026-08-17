import { describe, expect, it } from "vitest";
import { buildBalanceSheet, buildFiscalRegister, buildIncomeStatement, buildJournal, buildLedger, buildReportReconciliation, buildTrialBalance, buildVatSummary } from "./reports";

describe("reconciliable reports", () => {
  it("aggregates account movements and reconciles totals", () => {
    const result = buildTrialBalance([
      { accountCode: "11.1", accountName: "Caixa", debit: 100, credit: 0 },
      { accountCode: "11.1", accountName: "Caixa", debit: 0, credit: 20 },
      { accountCode: "21.1", accountName: "Clientes", debit: 0, credit: 80 },
    ]);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toMatchObject({ accountCode: "11.1", debit: 100, credit: 20 });
    expect(result.totals).toEqual({ debit: 100, credit: 100 });
    expect(result.reconciled).toBe(true);
  });

  it("flags an unreconciled report", () => {
    expect(buildTrialBalance([{ accountCode: "11.1", accountName: "Caixa", debit: 100, credit: 99 }]).reconciled).toBe(false);
  });

  it("builds chronological journal and running ledger", () => {
    const rows = [
      { entryId: 2, accountCode: "11.1", accountName: "Caixa", debit: 0, credit: 20, description: "Venda", createdAt: new Date("2026-01-02"), sourceDocumentId: 9 },
      { entryId: 1, accountCode: "11.1", accountName: "Caixa", debit: 100, credit: 0, description: "Saldo inicial", createdAt: new Date("2026-01-01"), sourceDocumentId: null },
    ];
    expect(buildJournal(rows).entries[0].entryId).toBe(1);
    expect(buildLedger(rows, "11.1").closingBalance).toBe(80);
  });

  it("summarizes IVA by regime and document status", () => {
    const result = buildVatSummary([
      { status: "ISSUED", ivaRegime: "GERAL", netAmount: 100, taxAmount: 14, totalAmount: 114 },
      { status: "ISSUED", ivaRegime: "GERAL", netAmount: 50, taxAmount: 7, totalAmount: 57 },
      { status: "ISSUED", ivaRegime: "EXCLUSAO", netAmount: 80, taxAmount: 0, totalAmount: 80 },
    ]);
    expect(result.rows).toHaveLength(2);
    expect(result.totals).toEqual({ netAmount: 230, taxAmount: 21, totalAmount: 251 });
  });

  it("reconciles the aggregate report contract and flags divergence", () => {
    const lines = [
      { entryId: 1, accountCode: "11.1", accountName: "Caixa", debit: 120, credit: 0, description: "Caixa", createdAt: new Date("2026-01-01"), sourceDocumentId: null },
      { entryId: 1, accountCode: "51.1", accountName: "Capital", debit: 0, credit: 100, description: "Capital", createdAt: new Date("2026-01-01"), sourceDocumentId: null },
      { entryId: 1, accountCode: "71.1", accountName: "Vendas", debit: 0, credit: 50, description: "Venda", createdAt: new Date("2026-01-01"), sourceDocumentId: null },
      { entryId: 1, accountCode: "61.1", accountName: "Custos", debit: 30, credit: 0, description: "Custo", createdAt: new Date("2026-01-01"), sourceDocumentId: null },
    ];
    const trialBalance = buildTrialBalance(lines);
    const journal = buildJournal(lines);
    const balanceSheet = buildBalanceSheet(lines);
    const vatSummary = buildVatSummary([{ status: "ISSUED", ivaRegime: "GERAL", netAmount: 100, taxAmount: 14, totalAmount: 114 }]);
    const fiscalRegister = buildFiscalRegister([{ documentId: 1, documentNumber: "FT/000001", issueDate: new Date("2026-01-01"), customerNif: null, status: "ISSUED", ivaRegime: "GERAL", netAmount: 100, taxAmount: 14, totalAmount: 114 }]);
    expect(buildReportReconciliation({ trialBalance, journal, balanceSheet, vatSummary, fiscalRegister }).reconciled).toBe(true);
    expect(buildReportReconciliation({ trialBalance: { ...trialBalance, reconciled: false }, journal, balanceSheet, vatSummary, fiscalRegister }).reconciled).toBe(false);
  });

  it("reconciles income statement and balance sheet", () => {
    const lines = [
      { accountCode: "11.1", accountName: "Caixa", debit: 120, credit: 0 },
      { accountCode: "51.1", accountName: "Capital", debit: 0, credit: 100 },
      { accountCode: "71.1", accountName: "Vendas", debit: 0, credit: 50 },
      { accountCode: "61.1", accountName: "Custos", debit: 30, credit: 0 },
    ];
    expect(buildIncomeStatement(lines)).toMatchObject({ revenue: 50, expenses: 30, netIncome: 20 });
    expect(buildBalanceSheet(lines)).toMatchObject({ assets: 120, liabilities: 0, equity: 120, netIncome: 20, reconciled: true });
  });
});
