import { describe, expect, it } from "vitest";
import { assertCreditLimit, calculateSettledAmount, isSaftDocumentType } from "./commercial";

describe("regras comerciais", () => {
  it("reconhece tipos documentais SAF-T AO e rejeita códigos desconhecidos", () => {
    expect(isSaftDocumentType("FT")).toBe(true);
    expect(isSaftDocumentType("AF")).toBe(true);
    expect(isSaftDocumentType("PAGAMENTO")).toBe(false);
  });

  it("bloqueia ultrapassagem do limite de crédito", () => {
    expect(assertCreditLimit(800, 150, 1000).available).toBe(50);
    expect(() => assertCreditLimit(900, 150, 1000)).toThrow("CUSTOMER_CREDIT_LIMIT_EXCEEDED");
    expect(assertCreditLimit(900, 150, 0).available).toBeNull();
  });

  it("limita a liquidação ao total do documento", () => {
    expect(calculateSettledAmount(1000, 400, 300)).toBe(700);
    expect(calculateSettledAmount(1000, 900, 300)).toBe(1000);
    expect(() => calculateSettledAmount(1000, -1, 10)).toThrow("SETTLEMENT_VALUES_INVALID");
  });
});
