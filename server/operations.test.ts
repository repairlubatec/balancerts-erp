import { describe, expect, it } from "vitest";
import { normalizeWarehouseCode, validateStockMovement } from "./operations";

describe("regras de operações", () => {
  it("normaliza códigos de armazém e rejeita formatos inválidos", () => {
    expect(normalizeWarehouseCode("  armazem-01 ")).toBe("ARMAZEM-01");
    expect(() => normalizeWarehouseCode("armazém 1")).toThrow("WAREHOUSE_CODE_INVALID");
  });

  it("valida e arredonda movimentos de stock", () => {
    expect(validateStockMovement({ type: "IN", quantity: 2.123456, unitCost: 10.98765 })).toMatchObject({ quantity: 2.1235, unitCost: 10.9877 });
    expect(() => validateStockMovement({ type: "OUT", quantity: 0, unitCost: 1 })).toThrow("STOCK_QUANTITY_INVALID");
    expect(() => validateStockMovement({ type: "IN", quantity: 1, unitCost: -1 })).toThrow("STOCK_UNIT_COST_INVALID");
  });
});
