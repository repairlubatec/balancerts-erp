import { describe, expect, it } from "vitest";
import { activeFiscalRule, calculateIva } from "./fiscal";

const at = new Date("2026-01-15");

describe("Angola IVA rule engine", () => {
  it("calculates a versioned general-regime rule", () => {
    const rule = { code: "IVA-GER-2026", regime: "GERAL" as const, validFrom: new Date("2026-01-01"), rate: 0.14, evidence: "normative-config" };
    expect(activeFiscalRule([rule], "GERAL", at)).toEqual(rule);
    expect(calculateIva({ netAmount: 1000, regime: "GERAL", rule })).toEqual({ netAmount: 1000, taxAmount: 140, totalAmount: 1140 });
  });

  it("selecciona versões históricas do mesmo código pela vigência", () => {
    const historical = { code: "IVA-GER", regime: "GERAL" as const, validFrom: new Date("2025-01-01"), validTo: new Date("2025-12-31"), rate: 0.14, evidence: "lei-14-23", verificationStatus: "ACTIVE" as const };
    const current = { code: "IVA-GER", regime: "GERAL" as const, validFrom: new Date("2026-01-01"), rate: 0.15, evidence: "fonte-confirmada", verificationStatus: "ACTIVE" as const };
    expect(activeFiscalRule([current, historical], "GERAL", new Date("2025-06-01"))).toEqual(historical);
    expect(activeFiscalRule([current, historical], "GERAL", new Date("2026-06-01"))).toEqual(current);
  });

  it("bloqueia regras ainda não activadas pelo fluxo CONFIRMED_ONLY", () => {
    const pending = { code: "IVA-GER-PENDING", regime: "GERAL" as const, validFrom: new Date("2026-01-01"), rate: 0.14, evidence: "official-pdf", verificationStatus: "HUMAN_APPROVED" as const };
    expect(() => calculateIva({ netAmount: 1000, regime: "GERAL", rule: pending })).toThrow("FISCAL_RULE_NOT_ACTIVE");
  });

  it("keeps exclusion without liquidation and requires configuration for simplified", () => {
    const exclusion = { code: "IVA-EXC-2026", regime: "EXCLUSAO" as const, validFrom: new Date("2026-01-01"), evidence: "normative-config" };
    expect(calculateIva({ netAmount: 1000, regime: "EXCLUSAO", rule: exclusion }).taxAmount).toBe(0);
    const simplified = { code: "IVA-SIM-2026", regime: "SIMPLIFICADO" as const, validFrom: new Date("2026-01-01"), evidence: "requires-parametrisation" };
    expect(() => calculateIva({ netAmount: 1000, regime: "SIMPLIFICADO", rule: simplified })).toThrow("FISCAL_RULE_RATE_REQUIRED");
  });
});

describe("validação de versões fiscais", () => {
  const version = (overrides: Partial<Parameters<typeof calculateIva>[0]["rule"]> = {}) => ({
    code: "IVA-GERAL",
    regime: "GERAL" as const,
    validFrom: new Date("2026-01-01T00:00:00.000Z"),
    validTo: new Date("2026-06-30T23:59:59.999Z"),
    rate: 0.14,
    evidence: "Lei 14/23, artigo validado",
    verificationStatus: "ACTIVE" as const,
    ...overrides,
  });

  it("resolve a versão mais recente vigente e activa", () => {
    const selected = activeFiscalRule(
      [version(), version({ validFrom: new Date("2026-07-01T00:00:00.000Z"), validTo: null, rate: 0.15 })],
      "GERAL",
      new Date("2026-08-25T00:00:00.000Z"),
    );
    expect(selected?.rate).toBe(0.15);
  });

  it("detecta sobreposição e vigência inválida sem inventar correcções", async () => {
    const { validateFiscalRuleSet } = await import("./fiscal");
    const result = validateFiscalRuleSet([
      version({ validTo: new Date("2026-08-31T23:59:59.999Z") }),
      version({ validFrom: new Date("2026-08-01T00:00:00.000Z"), validTo: null }),
      version({ code: "IVA-INVALIDA", validFrom: new Date("2026-09-02T00:00:00.000Z"), validTo: new Date("2026-09-01T00:00:00.000Z") }),
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining(["FISCAL_RULE_OVERLAP:IVA-GERAL:GERAL", "FISCAL_RULE_INVALID_VIGENCY:IVA-INVALIDA"]));
  });
});

import { calculateFiscalResult } from "./fiscal";

describe("resultado fiscal comum", () => {
  it("devolve identificação da regra e avisa quando falta referência jurídica explícita", () => {
    const result = calculateFiscalResult({
      netAmount: 1000,
      regime: "GERAL",
      rule: {
        code: "IVA-GER-2026",
        regime: "GERAL",
        validFrom: new Date("2026-01-01"),
        rate: 0.14,
        evidence: "fonte-confirmada",
        version: "2026.1",
        verificationStatus: "ACTIVE",
      },
    });
    expect(result).toMatchObject({ taxType: "IVA", taxBase: 1000, ruleId: "IVA-GER-2026", ruleVersion: "2026.1", legalReference: null, taxAmount: 140 });
    expect(result.warnings).toContain("FISCAL_RULE_LEGAL_REFERENCE_REQUIRED");
    expect(result.validationErrors).toEqual([]);
  });
});
