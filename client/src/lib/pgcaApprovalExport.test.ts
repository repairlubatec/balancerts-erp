import { describe, expect, it } from "vitest";
import { buildPgcaApprovalCsv, buildPgcaApprovalExcel } from "./pgcaApprovalExport";

describe("exportação PGCA aprovada", () => {
  const accounts = [{ code: "11.1", name: "Caixa", accountType: "MOVEMENT", nature: "DEBIT", acceptsEntries: 1, validationStatus: "CONFIRMED" }];
  const rules = [
    { operation: "COMPRAS", active: 1, taxType: "IVA", calculationBase: "NET", taxRate: "14.0000", priority: 10, effectiveFrom: "2026-01-01", effectiveTo: null },
    { operation: "VENDAS", active: 0, taxType: "IVA", calculationBase: "NET", taxRate: "14.0000", priority: 20, effectiveFrom: "2026-01-01", effectiveTo: null },
  ];

  it("exporta contas e apenas regras activas em CSV", () => {
    const csv = buildPgcaApprovalCsv(accounts, rules);
    expect(csv).toContain("CONTA");
    expect(csv).toContain("COMPRAS");
    expect(csv).not.toContain("VENDAS");
    expect(csv).toContain("14.0000");
  });

  it("produz um ficheiro Excel HTML com cabeçalho UTF-8", () => {
    const excel = buildPgcaApprovalExcel(accounts, rules);
    expect(excel).toContain("<table>");
    expect(excel).toContain("Caixa");
    expect(excel).toContain("COMPRAS");
    expect(excel).not.toContain("VENDAS");
  });
});
