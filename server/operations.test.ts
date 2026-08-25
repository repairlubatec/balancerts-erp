import { describe, expect, it } from "vitest";
import { normalizeWarehouseCode, validateStockCountLine, validateStockMovement, validateStockReferenceScope } from "./operations";

describe("regras de operações", () => {
  it("normaliza códigos de armazém e rejeita formatos inválidos", () => {
    expect(normalizeWarehouseCode("  armazem-01 ")).toBe("ARMAZEM-01");
    expect(() => normalizeWarehouseCode("armazém 1")).toThrow("WAREHOUSE_CODE_INVALID");
  });

  it("valida linhas de contagem física e normaliza o artigo", () => {
    expect(validateStockCountLine({ productCode: " mat-01 ", expectedQuantity: 10.123456, countedQuantity: 9.99999, unitCost: 250.98765 })).toEqual({ productCode: "MAT-01", expectedQuantity: 10.1235, countedQuantity: 10, unitCost: 250.9877 });
    expect(() => validateStockCountLine({ productCode: "", expectedQuantity: 1, countedQuantity: 1, unitCost: 1 })).toThrow("STOCK_COUNT_PRODUCT_REQUIRED");
    expect(() => validateStockCountLine({ productCode: "MAT-01", expectedQuantity: -1, countedQuantity: 1, unitCost: 1 })).toThrow("STOCK_COUNT_EXPECTED_INVALID");
  });

  it("bloqueia referências de Stock ausentes ou incompatíveis", () => {
    const valid = { periodFound: true, productFound: true, sourceDocumentFound: true, journalEntryFound: true, sourceDocumentMatchesJournal: true };
    expect(validateStockReferenceScope(valid)).toBe(true);
    expect(() => validateStockReferenceScope({ ...valid, periodFound: false })).toThrow("STOCK_PERIOD_NOT_FOUND_OR_FORBIDDEN");
    expect(() => validateStockReferenceScope({ ...valid, productFound: false })).toThrow("STOCK_PRODUCT_NOT_FOUND_OR_FORBIDDEN");
    expect(() => validateStockReferenceScope({ ...valid, sourceDocumentFound: false })).toThrow("STOCK_SOURCE_DOCUMENT_NOT_FOUND_OR_FORBIDDEN");
    expect(() => validateStockReferenceScope({ ...valid, journalEntryFound: false })).toThrow("STOCK_JOURNAL_ENTRY_NOT_FOUND_OR_FORBIDDEN");
    expect(() => validateStockReferenceScope({ ...valid, sourceDocumentMatchesJournal: false })).toThrow("STOCK_SOURCE_JOURNAL_MISMATCH");
  });

  it("valida e arredonda movimentos de stock", () => {
    expect(validateStockMovement({ type: "IN", quantity: 2.123456, unitCost: 10.98765 })).toMatchObject({ quantity: 2.1235, unitCost: 10.9877 });
    expect(() => validateStockMovement({ type: "OUT", quantity: 0, unitCost: 1 })).toThrow("STOCK_QUANTITY_INVALID");
    expect(() => validateStockMovement({ type: "IN", quantity: 1, unitCost: -1 })).toThrow("STOCK_UNIT_COST_INVALID");
  });
});
