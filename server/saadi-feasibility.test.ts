import { describe, expect, it } from "vitest";
import { calculateFinancingBalance, calculateInvestmentTotal } from "./saadi-feasibility";

describe("SAADI — estrutura financeira do estudo", () => {
  it("totaliza itens por quantidade e valor unitário", () => {
    expect(calculateInvestmentTotal([
      { quantity: "2", unitValue: "1000" },
      { quantity: 3, unitValue: 500 },
    ])).toBe(3500);
  });

  it("usa o total persistido quando disponível", () => {
    expect(calculateInvestmentTotal([
      { quantity: 2, unitValue: 1000, totalValue: "2100" },
    ])).toBe(2100);
  });

  it("classifica fontes equilibradas, insuficientes e excedentes", () => {
    expect(calculateFinancingBalance(1000, [{ amount: 600 }, { amount: "400" }])).toMatchObject({ balanced: true, insufficient: false, excess: false, difference: 0 });
    expect(calculateFinancingBalance(1000, [{ amount: 600 }])).toMatchObject({ balanced: false, insufficient: true, excess: false, difference: -400 });
    expect(calculateFinancingBalance(1000, [{ amount: 1200 }])).toMatchObject({ balanced: false, insufficient: false, excess: true, difference: 200 });
  });
});
