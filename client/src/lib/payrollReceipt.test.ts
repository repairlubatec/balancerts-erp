import { describe, expect, it } from "vitest";
import { buildPayrollReceiptPdf, buildReceiptExportRows, buildReceiptZip, calculateReceiptTotals, formatInternalReceiptPeriod, formatPayrollActor, formatReceiptMode } from "./payrollReceipt";

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

  it("prepara linhas e total para CSV e Excel", () => {
    const result = buildReceiptExportRows([{ employee: { fullName: "Ana Silva", employeeNumber: "001" }, item: { grossAmount: "100000", socialEmployeeAmount: "3000", irtAmount: "5000", netAmount: "92000" } }]);
    expect(result.rows[0]).toEqual({ Colaborador: "Ana Silva", Numero: "001", Bruto_AOA: 100000, Seguranca_Social_AOA: 3000, IRT_AOA: 5000, Liquido_AOA: 92000 });
    expect(result.totals).toEqual({ gross: 100000, socialSecurity: 3000, irt: 5000, net: 92000 });
  });

  it("gera PDF individual válido para o pacote de recibos", () => {
    const bytes = buildPayrollReceiptPdf({ companyName: "Repair Lubatec", period: "09/2026", issuedOn: "19/08/2026", employeeName: "Ana Silva", employeeNumber: "001", gross: 100000, socialSecurity: 3000, irt: 5000, net: 92000 });
    expect(new TextDecoder().decode(bytes)).toContain("%PDF-1.4");
    expect(bytes.length).toBeGreaterThan(500);
  });

  it("gera um pacote ZIP válido para vários recibos", () => {
    const archive = buildReceiptZip({ "recibos/001-Ana-Silva.pdf": buildPayrollReceiptPdf({ companyName: "Repair Lubatec", period: "09/2026", issuedOn: "19/08/2026", employeeName: "Ana Silva", employeeNumber: "001", gross: 100000, socialSecurity: 3000, irt: 5000, net: 92000 }), "recibos/002-Joao-Costa.pdf": buildPayrollReceiptPdf({ companyName: "Repair Lubatec", period: "09/2026", issuedOn: "19/08/2026", employeeName: "Joao Costa", employeeNumber: "002", gross: 120000, socialSecurity: 3600, irt: 7000, net: 109400 }) });
    expect(new TextDecoder().decode(archive.slice(0, 2))).toBe("PK");
    expect(archive.length).toBeGreaterThan(900);
  });
});
