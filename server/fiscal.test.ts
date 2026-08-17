import { describe, expect, it } from "vitest";
import { activeFiscalRule, calculateIva } from "./fiscal";

const at = new Date("2026-01-15");

describe("Angola IVA rule engine", () => {
  it("calculates a versioned general-regime rule", () => {
    const rule = { code: "IVA-GER-2026", regime: "GERAL" as const, validFrom: new Date("2026-01-01"), rate: 0.14, evidence: "normative-config" };
    expect(activeFiscalRule([rule], "GERAL", at)).toEqual(rule);
    expect(calculateIva({ netAmount: 1000, regime: "GERAL", rule })).toEqual({ netAmount: 1000, taxAmount: 140, totalAmount: 1140 });
  });

  it("keeps exclusion without liquidation and requires configuration for simplified", () => {
    const exclusion = { code: "IVA-EXC-2026", regime: "EXCLUSAO" as const, validFrom: new Date("2026-01-01"), evidence: "normative-config" };
    expect(calculateIva({ netAmount: 1000, regime: "EXCLUSAO", rule: exclusion }).taxAmount).toBe(0);
    const simplified = { code: "IVA-SIM-2026", regime: "SIMPLIFICADO" as const, validFrom: new Date("2026-01-01"), evidence: "requires-parametrisation" };
    expect(() => calculateIva({ netAmount: 1000, regime: "SIMPLIFICADO", rule: simplified })).toThrow("FISCAL_RULE_RATE_REQUIRED");
  });
});
