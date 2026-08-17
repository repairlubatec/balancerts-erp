import { describe, expect, it } from "vitest";
import { buildTrialBalance } from "./reports";

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
});
