import { describe, expect, it } from "vitest";
import { calculatePayrollAmounts, calculateProgressiveIrt, parseIrtBrackets } from "./payroll";

describe("cálculo salarial parametrizado", () => {
  const brackets = parseIrtBrackets('[{"upTo":100000,"rate":0},{"upTo":200000,"rate":5},{"upTo":null,"rate":10}]');

  it("calcula Segurança Social, IRT progressivo e líquido", () => {
    const result = calculatePayrollAmounts({ grossAmount: 300000, socialEmployeeRate: 3, socialEmployerRate: 8, irtBrackets: brackets });
    expect(result.socialEmployeeAmount).toBe(9000);
    expect(result.socialEmployerAmount).toBe(24000);
    expect(result.taxableAmount).toBe(291000);
    expect(result.irtAmount).toBe(14100);
    expect(result.netAmount).toBe(276900);
  });

  it("mantém zero quando o rendimento não atinge a faixa tributável", () => {
    expect(calculateProgressiveIrt(80000, brackets)).toBe(0);
  });

  it("rejeita tabela sem faixa aberta ou com limites fora de ordem", () => {
    expect(() => parseIrtBrackets('[{"upTo":100000,"rate":5}]')).toThrow("IRT_TABLE_MUST_HAVE_OPEN_BAND");
    expect(() => parseIrtBrackets('[{"upTo":200000,"rate":5},{"upTo":100000,"rate":10},{"upTo":null,"rate":15}]')).toThrow("IRT_TABLE_INVALID");
  });
});
