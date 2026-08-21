import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { buildDocumentIntelligenceWorkbook, classifyDocument, extractSpreadsheetText, extractStructuredDocument } from "./balancerts-ia/document-intelligence";

describe("Balancerts IA — Document Intelligence local", () => {
  it("classifica factura, imagem, PDF e Excel sem rede", () => {
    expect(classifyDocument("factura-2026.pdf", "application/pdf")).toBe("FACTURA");
    expect(classifyDocument("balancete.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")).toBe("BALANCETE");
    expect(classifyDocument("documento.png", "image/png")).toBe("IMAGEM");
  });

  it("extrai entidades e métricas por regras locais", () => {
    const result = extractStructuredDocument({ filename: "factura.pdf", mimeType: "application/pdf", text: "FACTURA Nº 2026/001\nFornecedor: XYZ Lda\nNIF: 500123456\nTotal: 5.000.000 Kz\nIVA: 810.000 Kz" });
    expect(result.documentType).toBe("FACTURA");
    expect(result.nif).toBe("500123456");
    expect(result.metrics.length).toBeGreaterThanOrEqual(2);
    expect(result.onlineCalls).toBe(false);
    expect(result.requiresHumanValidation).toBe(true);
  });

  it("lê uma folha Excel local e gera um ficheiro Excel de resultados", () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["Total", "5000"], ["IVA", "810"]]), "Dados");
    const input = Buffer.from(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }));
    expect(extractSpreadsheetText(input)).toContain("Total");
    const result = extractStructuredDocument({ filename: "dados.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", spreadsheetBuffer: input });
    expect(result.source).toBe("EXCEL_LOCAL");
    const output = buildDocumentIntelligenceWorkbook([{ field: "total", value: 5000, confidence: 0.8 }]);
    expect(Buffer.isBuffer(output)).toBe(true);
    expect(output.length).toBeGreaterThan(100);
  });
});
