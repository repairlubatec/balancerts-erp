import { describe, expect, it } from "vitest";
import { calculateReceiptTotals, formatInternalReceiptPeriod } from "./payrollReceipt";

describe("recibo interno de RH", () => {
  it("formata o período salarial em português", () => {
    expect(formatInternalReceiptPeriod({ year: 2026, month: 9 })).toBe("09/2026");
    expect(formatInternalReceiptPeriod(null)).toBe("—");
  });

  it("reconcilia bruto, descontos e líquido", () => {
    expect(calculateReceiptTotals([
      { grossAmount: "100000", socialEmployeeAmount: "3000", irtAmount: "5000", netAmount: "92000" },
      { grossAmount: 50000, socialEmployeeAmount: 1500, irtAmount: 2500, netAmount: 46000 },
    ])).toEqual({ gross: 150000, socialSecurity: 4500, irt: 7500, net: 138000 });
  });
});
