import { describe, expect, it } from "vitest";
import { calculateReceiptTotals, formatInternalReceiptPeriod, formatPayrollActor, formatReceiptMode } from "./payrollReceipt";

describe("recibo interno de RH", () => {
  it("formata o período salarial em português", () => {
    expect(formatInternalReceiptPeriod({ year: 2026, month: 9 })).toBe("09/2026");
    expect(formatInternalReceiptPeriod(null)).toBe("—");
  });

  it("apresenta actor e data e mantém estado pendente sem actor", () => {
    expect(formatPayrollActor({ name: "Ana Contabilista", email: "ana@example.com" }, new Date("2026-08-19T10:30:00Z"), "Ainda não aprovado")).toContain("Ana Contabilista");
    expect(formatPayrollActor(null, null, "Ainda não aprovado")).toBe("Ainda não aprovado");
  });

  it("reconcilia bruto, descontos e líquido", () => {
    expect(calculateReceiptTotals([
      { grossAmount: "100000", socialEmployeeAmount: "3000", irtAmount: "5000", netAmount: "92000" },
      { grossAmount: 50000, socialEmployeeAmount: 1500, irtAmount: 2500, netAmount: 46000 },
    ])).toEqual({ gross: 150000, socialSecurity: 4500, irt: 7500, net: 138000 });
  });

  it("distingue mapa colectivo de recibo individual", () => {
    expect(formatReceiptMode("", 3)).toBe("Mapa colectivo (3)");
    expect(formatReceiptMode("17", 1)).toBe("Recibo individual");
  });
});
