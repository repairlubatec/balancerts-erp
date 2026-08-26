import { describe, expect, it } from "vitest";
import { activeFiscalRule, calculateIva, getFiscalTaxCoverage, validateFiscalActivation } from "./fiscal";

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
        article: "19.º",
        evidencePage: 12,
        evidenceHash: "a".repeat(64),
        verificationStatus: "ACTIVE",
      },
    });
    expect(result).toMatchObject({ taxType: "IVA", taxBase: 1000, ruleId: "IVA-GER-2026", ruleVersion: "2026.1", legalReference: null, article: "19.º", evidencePage: 12, evidenceHash: "a".repeat(64), taxAmount: 140 });
    expect(result.warnings).toContain("FISCAL_RULE_LEGAL_REFERENCE_REQUIRED");
    expect(result.validationErrors).toEqual([]);
  });
});

import { validateFiscalInput } from "./fiscal";

describe("catálogo integral de cobertura fiscal", () => {
  it("mapeia os impostos angolanos institucionais sem activar regras não configuradas", () => {
    const coverage = getFiscalTaxCoverage();
    expect(coverage.map((tax) => tax.code)).toEqual(["IVA", "INDUSTRIAL", "IRT", "IAC", "IS", "IP", "SISA", "IEC", "IVM"]);
    expect(coverage.find((tax) => tax.code === "IVA")?.status).toBe("IMPLEMENTADO_PARCIAL");
    expect(coverage.find((tax) => tax.code === "IVA")?.configurationState).toBe("HOMOLOGAÇÃO PENDENTE");
    expect(coverage.filter((tax) => tax.code !== "IVA").every((tax) => tax.status === "NAO_CONFIGURADO")).toBe(true);
    expect(coverage.filter((tax) => tax.code !== "IVA").every((tax) => tax.configurationState === "NÃO CONFIGURADO")).toBe(true);
    expect(coverage.every((tax) => tax.sourceUrls.length > 0)).toBe(true);
    expect(coverage.find((tax) => tax.code === "IRT")?.missingCapabilities).toContain("Grupos A/B/C");
  });
});

describe("guarda de activação V2", () => {
  const validInput = {
    configurationState: "VALIDADO" as const,
    hasLegalBasis: true,
    hasActiveVigency: true,
    testsPassed: true,
    hasCriticalBlocks: false,
    homologationRequired: false,
    homologationComplete: false,
  };

  it("bloqueia a activação quando falta qualquer critério crítico", () => {
    const result = validateFiscalActivation({ ...validInput, hasLegalBasis: false, homologationRequired: true });
    expect(result.allowed).toBe(false);
    expect(result.reasons).toEqual(expect.arrayContaining(["FISCAL_ACTIVATION_LEGAL_BASIS_REQUIRED", "FISCAL_ACTIVATION_HOMOLOGATION_REQUIRED"]));
  });

  it("autoriza somente uma configuração validada e sem bloqueios", () => {
    expect(validateFiscalActivation(validInput)).toEqual({ allowed: true, reasons: [] });
    expect(validateFiscalActivation({ ...validInput, homologationRequired: true, homologationComplete: true })).toEqual({ allowed: true, reasons: [] });
  });
});

describe("validação fiscal comum", () => {
  it("classifica regra ausente, base inválida e não inventa uma taxa", () => {
    const findings = validateFiscalInput({ netAmount: -1, regime: "GERAL", at: new Date("2026-01-01") });
    expect(findings.map((finding) => finding.code)).toEqual(expect.arrayContaining(["FISCAL_BASE_INVALID", "FISCAL_RULE_MISSING"]));
    expect(findings.every((finding) => finding.severity === "ERROR")).toBe(true);
  });

  it("classifica a referência jurídica ausente como aviso e detecta regra fora de vigência", () => {
    const findings = validateFiscalInput({
      netAmount: 100,
      regime: "GERAL",
      at: new Date("2027-01-01"),
      rule: {
        code: "IVA-GER",
        regime: "GERAL",
        validFrom: new Date("2026-01-01"),
        validTo: new Date("2026-12-31"),
        rate: 0.14,
        evidence: "fonte pendente",
        verificationStatus: "ACTIVE",
      },
    });
    expect(findings.find((finding) => finding.code === "FISCAL_RULE_EXPIRED_OR_NOT_YET_VALID")?.severity).toBe("ERROR");
    expect(findings.find((finding) => finding.code === "FISCAL_RULE_LEGAL_REFERENCE_REQUIRED")?.severity).toBe("WARNING");
  });
});
