import { describe, expect, it } from "vitest";
import { detectPotentialIdentifiers, exportFiscalCsv, exportFiscalWorkbook, parseFiscalTabular, validateFiscalImport } from "./fiscal-tabular";

describe("fiscal CSV/Excel workflows", () => {
  it("accepts valid Angolan counterparty and document rows", () => {
    expect(validateFiscalImport("counterparties", [{ name: "ANON Cliente", taxId: "ANON", kind: "CUSTOMER" }]).valid).toBe(true);
    expect(validateFiscalImport("documents", [{ documentNumber: "FT 2026/1", documentType: "FT", currency: "AOA", ivaRegime: "EXCLUSAO", netAmount: "100", taxAmount: "0", totalAmount: "100", lines: JSON.stringify([{ description: "Serviço", quantity: 1, unitPrice: 100, netAmount: 100, taxAmount: 0, totalAmount: 100 }]) }]).valid).toBe(true);
  });

  it("rejects invalid NIF, non-AOA currency and unreconciled totals", () => {
    const result = validateFiscalImport("documents", [{ documentNumber: "FT 1", documentType: "FT", currency: "USD", ivaRegime: "BAD", netAmount: "100", taxAmount: "5", totalAmount: "99" }]);
    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.field)).toEqual(expect.arrayContaining(["currency", "ivaRegime", "totalAmount"]));
    expect(validateFiscalImport("counterparties", [{ name: "X", taxId: "AO", kind: "CUSTOMER" }]).valid).toBe(false);
  });

  it("rejects invoice line and tax reconciliation differences", () => {
    const result = validateFiscalImport("documents", [{ documentNumber: "FT 2026/2", documentType: "FT", currency: "AOA", ivaRegime: "GERAL", netAmount: "100", taxAmount: "14", totalAmount: "114", lines: JSON.stringify([{ description: "Serviço", quantity: 1, unitPrice: 100, netAmount: 100, taxAmount: 10, totalAmount: 111 }]), taxes: JSON.stringify([{ amount: 12 }]) }]);
    expect(result.valid).toBe(false);
    expect(result.errors.map((error) => error.field)).toEqual(expect.arrayContaining(["lines[0].totalAmount", "taxAmount", "totalAmount", "taxes"]));
  });

  it("blocks identifiable data and accepts explicit anonymized placeholders", () => {
    const blocked = detectPotentialIdentifiers([{ taxId: "5001121871", email: "real@example.com", phone: "+244 921346544" }]);
    expect(blocked.safe).toBe(false);
    expect(blocked.findings.map((finding) => finding.field)).toEqual(expect.arrayContaining(["taxId", "email", "phone"]));
    expect(detectPotentialIdentifiers([{ taxId: "ANON", email: "anon@example.invalid", phone: "ANON" }]).safe).toBe(true);
  });

  it("round-trips CSV and XLSX exports through the parser", () => {
    const rows = [{ code: "SERV-1", name: "Serviço", kind: "SERVICE" }];
    const csv = exportFiscalCsv(rows);
    expect(csv).toContain("code");
    expect(parseFiscalTabular(csv, "products.csv")[0]).toMatchObject(rows[0]);
    const workbook = exportFiscalWorkbook("products", rows);
    expect(workbook.subarray(0, 2).toString("hex")).toBe("504b");
    expect(parseFiscalTabular(workbook, "products.xlsx")[0]).toMatchObject(rows[0]);
  });
});
