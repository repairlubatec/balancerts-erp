import { describe, expect, it } from "vitest";
import { assertSecondApprover, calculatePayrollAmounts, calculateProgressiveIrt, parseIrtBrackets, requirePgcPayrollMappings } from "./payroll";

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

  it("impede que a mesma pessoa prepare e aprove a ligação contabilística", () => {
    expect(() => assertSecondApprover(7, 7)).toThrow("PAYROLL_ACCOUNTING_SECOND_APPROVER_REQUIRED");
    expect(() => assertSecondApprover(7, 8)).not.toThrow();
  });

  it("exige PGCA activa e mapeamentos operacionais completos", () => {
    expect(() => requirePgcPayrollMappings({ hasActiveVersion: false, configuredCodes: ["SALARIOS"], mappings: new Map() })).toThrow("PAYROLL_PGC_ACTIVE_VERSION_REQUIRED");
    expect(() => requirePgcPayrollMappings({ hasActiveVersion: true, configuredCodes: ["SALARIOS", "SS"], mappings: new Map([["SALARIOS", 68]]) })).toThrow("PAYROLL_PGC_OPERATIONAL_MAPPING_REQUIRED");
    expect(requirePgcPayrollMappings({ hasActiveVersion: true, configuredCodes: ["SALARIOS"], mappings: new Map([["SALARIOS", 68]]) })).toBe(true);
  });

  it("rejeita tabela sem faixa aberta ou com limites fora de ordem", () => {
    expect(() => parseIrtBrackets('[{"upTo":100000,"rate":5}]')).toThrow("IRT_TABLE_MUST_HAVE_OPEN_BAND");
    expect(() => parseIrtBrackets('[{"upTo":200000,"rate":5},{"upTo":100000,"rate":10},{"upTo":null,"rate":15}]')).toThrow("IRT_TABLE_INVALID");
  });
});
