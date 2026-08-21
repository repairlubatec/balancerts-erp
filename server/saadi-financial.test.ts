import { describe, expect, it } from "vitest";
import { calculateFeasibility, calculateFinancing } from "./saadi-financial";

describe("motor financeiro SAADI", () => {
  it("calcula VPL, TIR, payback e ROI de um investimento viável", () => {
    const result = calculateFeasibility({ initialInvestment: 1000, discountRate: 0.1, cashFlows: [500, 600, 700] });
    expect(result.npv).toBeGreaterThan(400);
    expect(result.irr).not.toBeNull();
    expect(result.paybackMonths).toBeGreaterThan(1);
    expect(result.roi).toBeGreaterThan(0.5);
    expect(result.decision).toBe("PROSSEGUIR");
  });

  it("rejeita investimento inválido", () => {
    expect(() => calculateFeasibility({ initialInvestment: 0, discountRate: 0.1, cashFlows: [100] })).toThrow("SAADI_INVESTIMENTO_INVALIDO");
  });

  it("bloqueia taxa menor ou igual a -100%", () => {
    expect(() => calculateFeasibility({ initialInvestment: 100, discountRate: -1, cashFlows: [100] })).toThrow("SAADI_TAXA_INVALIDA");
  });

  it("calcula o serviço mensal e o custo total da dívida", () => {
    const financing = calculateFinancing(120000, 80000, 0.12, 12);
    expect(financing.monthlyPayment).toBeGreaterThan(10000);
    expect(financing.totalDebtService).toBeGreaterThan(120000);
    expect(financing.totalInterest).toBeGreaterThan(0);
  });

  it("exige prazo quando existe financiamento externo", () => {
    expect(() => calculateFinancing(1000, 0, 0.1, 0)).toThrow("SAADI_PRAZO_DIVIDA_OBRIGATORIO");
  });
});
