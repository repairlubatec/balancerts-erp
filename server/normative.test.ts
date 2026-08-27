import { describe, expect, it } from "vitest";
import {
  evaluateIvaReadiness,
  evaluateTaxReadiness,
  getOfficialTaxParameterReferences,
  getOfficialOge2026MeasureReferences,
  getOfficialTaxObligationReferences,
  canActivateTaxParameterReference,
  normativeEvidence,
  validateNormativeCoverage,
} from "./normative";

describe("Angola normative evidence", () => {
  it("resolves the Presidential Decree 71/25 evidence", () => {
    expect(normativeEvidence("DP-71-25")).toMatchObject({
      title: "Decreto Presidencial n.º 71/25, de 20 de Março",
    });
  });

  it("does not fabricate unknown normative rules", () => {
    expect(normativeEvidence("UNKNOWN")).toBeUndefined();
  });

  it("mantém fontes não confirmadas pendentes e regista a Lei n.º 14/23 confirmada", () => {
    expect(normativeEvidence("PGC-AO-82-01")).toMatchObject({
      verificationStatus: "CONFIRMED",
      url: "https://cnnca.minfin.gov.ao/legislacao/sector-empresarial",
    });
    expect(normativeEvidence("LAW-14-23")).toMatchObject({
      verificationStatus: "CONFIRMED",
      url: "https://lex.ao/docs/assembleia-nacional/2023/lei-n-o-14-23-de-28-de-dezembro/",
    });
    expect(normativeEvidence("AGT-IVA-SAF-T-2025")).toMatchObject({
      verificationStatus: "PENDING",
    });
  });

  it("requires the appropriate evidence set by operational area", () => {
    expect(
      validateNormativeCoverage({
        area: "FISCAL_DOCUMENT",
        evidenceCodes: ["DP-71-25", "AGT-FAT-DOC"],
      }).valid
    ).toBe(true);
    expect(
      validateNormativeCoverage({ area: "ACCOUNTING", evidenceCodes: [] })
    ).toMatchObject({ valid: false, missing: ["PGC-AO-82-01"] });
  });

  it("regista as cinco fontes oficiais do IVA com papéis distintos", () => {
    expect(normativeEvidence("IVA-LAW-7-19")).toMatchObject({
      verificationStatus: "CONFIRMED",
      title: expect.stringContaining("Lei n.º 7/19"),
      scope: expect.stringContaining("histórica"),
    });
    expect(normativeEvidence("IVA-LAW-17-19")).toMatchObject({
      verificationStatus: "CONFIRMED",
      title: expect.stringContaining("Lei n.º 17/19"),
      scope: expect.stringContaining("1 de Outubro de 2019"),
    });
    expect(normativeEvidence("IVA-DP-180-19")).toMatchObject({
      verificationStatus: "CONFIRMED",
      scope: expect.stringContaining("34.5-IVA"),
    });
    expect(normativeEvidence("IVA-DE-134-19")).toMatchObject({
      verificationStatus: "CONFIRMED",
      scope: expect.stringContaining("Modelos"),
    });
    expect(normativeEvidence("IVA-LAW-14-23")).toMatchObject({
      verificationStatus: "CONFIRMED",
      scope: expect.stringContaining("consolidada"),
    });
  });

  it("reconhece os quatro diplomas primários submetidos no escopo exacto", () => {
    for (const code of ["II-LAW-19-14", "IRT-LAW-28-20", "IP-LAW-20-20", "IS-DLP-3-14"]) {
      expect(normativeEvidence(code)).toMatchObject({ verificationStatus: "CONFIRMED" });
    }
    expect(normativeEvidence("II-LAW-19-14")?.scope).toContain("alterações posteriores");
    expect(normativeEvidence("IRT-LAW-28-20")?.scope).toContain("tabelas");
    expect(normativeEvidence("IP-LAW-20-20")?.scope).toContain("tabelas");
    expect(normativeEvidence("IS-DLP-3-14")?.scope).toContain("tabela anexa");
  });

  it("mantém OGE 2026 e regimes MPME como fontes pendentes", () => {
    expect(normativeEvidence("AGT-OGE-2026")).toMatchObject({ verificationStatus: "PENDING" });
    expect(normativeEvidence("AGT-MPME-REGIMES")).toMatchObject({ verificationStatus: "PENDING" });
    expect(normativeEvidence("AGT-MPME-REGIMES")?.scope).toContain("elegibilidade");
  });

  it("avalia II, IRT, IP e IS sem activar regras por inferência documental", () => {
    const sourceByTax = {
      II: "II-LAW-19-14",
      IRT: "IRT-LAW-28-20",
      IP: "IP-LAW-20-20",
      IS: "IS-DLP-3-14",
    } as const;
    for (const tax of ["II", "IRT", "IP", "IS"] as const) {
      const result = evaluateTaxReadiness({
        tax,
        rules: [],
        sources: [{ verificationStatus: "CONFIRMED", code: sourceByTax[tax] }],
      });
      expect(result).toMatchObject({ tax, ready: false, activeRules: 0, missingSourceCodes: [] });
      expect(result.blockers).toContain(`${tax}_SEM_REGRA_ACTIVE`);
    }
  });

  it("expõe os parâmetros oficiais pesquisados por imposto sem os activar", () => {
    expect(getOfficialTaxParameterReferences("II")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "II-GERAL-25", ratePercent: 25, status: "REFERENCE_ONLY" }),
        expect.objectContaining({ code: "II-PROVISORIO-VENDAS-2", ratePercent: 2, status: "REFERENCE_ONLY" }),
      ])
    );
    expect(getOfficialTaxParameterReferences("IP")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "IP-TRANSMISSAO-2", ratePercent: 2 }),
      ])
    );
  });

  it("expõe as medidas fiscais do OGE 2026 como camada anual não activa", () => {
    expect(getOfficialOge2026MeasureReferences("IRT")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "OGE26-IRT-GC-6_5", article: "21.º/1", status: "REFERENCE_ONLY" }),
        expect.objectContaining({ code: "OGE26-IRT-GC-ISENCAO-150K", status: "REFERENCE_ONLY" }),
      ])
    );
    expect(getOfficialOge2026MeasureReferences("IVA")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "OGE26-IVA-EQUIPAMENTO-5", status: "REFERENCE_ONLY" }),
      ])
    );
    expect(getOfficialOge2026MeasureReferences("IS")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "OGE26-IS-MMI-VERBA-16-ISENCAO", status: "REFERENCE_ONLY" }),
        expect.objectContaining({ code: "OGE26-IS-AUMENTO-CAPITAL-VERBA-7_3-ISENCAO", status: "REFERENCE_ONLY" }),
      ])
    );
  });

  it("mantém a cadeia CEC separada e bloqueada pela camada anual pendente", () => {
    expect(getOfficialOge2026MeasureReferences("CEC")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "OGE26-CEC-PESSOA-SINGULAR-2_5", status: "REFERENCE_ONLY" }),
        expect.objectContaining({ code: "OGE26-CEC-PESSOA-COLECTIVA-10", status: "REFERENCE_ONLY" }),
      ])
    );
    expect(evaluateTaxReadiness({ tax: "CEC", rules: [], sources: [] })).toMatchObject({
      tax: "CEC",
      ready: false,
      activeRules: 0,
      missingSourceCodes: ["AGT-OGE-2026"],
    });
  });

  it("regista as obrigações oficiais do IS como referências de calendário", () => {
    expect(getOfficialTaxObligationReferences("IS")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "IS-PAYMENT-END-NEXT-MONTH", status: "REFERENCE_ONLY" }),
        expect.objectContaining({ code: "IS-ANNUAL-DECLARATION-END-MARCH", status: "REFERENCE_ONLY" }),
      ])
    );
  });

  it("regista a referência condicionada do IS sem a transformar em taxa universal", () => {
    expect(getOfficialTaxParameterReferences("IS")).toEqual([
      expect.objectContaining({
        code: "IS-VERBA-23-3-RECIBO-1",
        ratePercent: 1,
        status: "REFERENCE_ONLY",
        note: expect.stringContaining("tabela integral"),
      }),
    ]);
  });

  it("bloqueia activação de parâmetro sem cadeia, vigência e aprovação", () => {
    const result = canActivateTaxParameterReference({
      parameterCode: "IVA-GERAL-14",
      sourceConfirmed: true,
      chainComplete: false,
      ruleApproved: false,
    });
    expect(result.eligible).toBe(false);
    expect(result.blockers).toEqual(
      expect.arrayContaining(["CADEIA_INCOMPLETA", "REGRA_NAO_APROVADA", "VIGENCIA_NAO_DEFINIDA"])
    );
  });

  it("reconhece medidas OGE e CEC no guard sem permitir activação incompleta", () => {
    for (const parameterCode of ["OGE26-IVA-EQUIPAMENTO-5", "OGE26-CEC-PESSOA-COLECTIVA-10"]) {
      const result = canActivateTaxParameterReference({
        parameterCode,
        sourceConfirmed: false,
        chainComplete: false,
        ruleApproved: false,
      });
      expect(result.parameter).toBeDefined();
      expect(result.eligible).toBe(false);
      expect(result.blockers).toEqual(
        expect.arrayContaining(["FONTE_NAO_CONFIRMADA", "CADEIA_INCOMPLETA", "REGRA_NAO_APROVADA", "VIGENCIA_NAO_DEFINIDA"])
      );
      expect(result.blockers).not.toContain("PARAMETRO_INEXISTENTE");
    }
  });

  it("não aceita parâmetro desconhecido mesmo com todos os sinais fornecidos", () => {
    const result = canActivateTaxParameterReference({
      parameterCode: "UNKNOWN",
      sourceConfirmed: true,
      chainComplete: true,
      ruleApproved: true,
      effectiveFrom: "2026-01-01",
    });
    expect(result.eligible).toBe(false);
    expect(result.blockers).toContain("PARAMETRO_INEXISTENTE");
  });

  it("avalia prontidão IVA bloqueada quando não existem entradas activas", () => {
    expect(
      evaluateIvaReadiness({ rules: [], mappings: [], sources: [] })
    ).toMatchObject({
      ready: false,
      activeRules: 0,
      activeMappings: 0,
      confirmedSources: 0,
      blockers: [
        "IVA_SEM_REGRA_ACTIVE",
        "IVA_SEM_MAPEAMENTO_34_5_ACTIVE",
        "IVA_SEM_FONTE_CONFIRMADA",
        "IVA_CADEIA_NORMATIVA_INCOMPLETA",
      ],
    });
  });

  it("avalia prontidão IVA parcial e não confunde aprovação humana com activação", () => {
    const result = evaluateIvaReadiness({
      rules: [{ verificationStatus: "HUMAN_APPROVED", regime: "GERAL" }],
      mappings: [{ verificationStatus: "ACTIVE" }],
      sources: [{ verificationStatus: "CONFIRMED", code: "IVA-LAW-14-23" }],
    });
    expect(result).toMatchObject({
      ready: false,
      activeRules: 0,
      activeMappings: 1,
      confirmedSources: 1,
      blockers: ["IVA_SEM_REGRA_ACTIVE", "IVA_CADEIA_NORMATIVA_INCOMPLETA"],
    });
  });

  it("avalia prontidão IVA completa por estado activo e fonte confirmada", () => {
    const result = evaluateIvaReadiness({
      rules: [
        { verificationStatus: "ACTIVE", regime: "GERAL" },
        { verificationStatus: "ACTIVE", regime: "SIMPLIFICADO" },
      ],
      mappings: [{ verificationStatus: "ACTIVE" }],
      sources: [
        { verificationStatus: "CONFIRMED", code: "IVA-LAW-7-19" },
        { verificationStatus: "CONFIRMED", code: "IVA-DP-180-19" },
        { verificationStatus: "CONFIRMED", code: "IVA-DE-134-19" },
        { verificationStatus: "CONFIRMED", code: "IVA-LAW-17-19" },
        { verificationStatus: "CONFIRMED", code: "IVA-LAW-14-23" },
      ],
    });
    expect(result).toMatchObject({
      ready: true,
      activeRules: 2,
      activeMappings: 1,
      confirmedSources: 5,
      missingChainSources: [],
      activeByRegime: { GERAL: 1, SIMPLIFICADO: 1, EXCLUSAO: 0 },
      blockers: [],
    });
  });

  it("keeps the official PGCA evidence and review boundary", async () => {
    const { existsSync, readFileSync } = await import("node:fs");
    expect(existsSync("docs/normative-sources/decreto-82-01-pgca.pdf")).toBe(
      true
    );
    expect(
      existsSync("docs/normative-sources/decreto-82-01-pgca-ocr.txt")
    ).toBe(true);
    const report = readFileSync(
      "docs/pgca-official-analysis-2026-08-21.md",
      "utf8"
    );
    expect(report).toContain("4511 Caixa");
    expect(report).toContain("6131 Mercado nacional");
    expect(report).toContain(
      "Nenhuma alteração operacional foi feita nesta fase"
    );
    expect(existsSync("docs/normative-sources/lei-14-23-iva.pdf")).toBe(true);
    expect(existsSync("docs/normative-sources/lei-14-23-iva-ocr.txt")).toBe(
      true
    );
    const ivaText = readFileSync(
      "docs/normative-sources/lei-14-23-iva-ocr.txt",
      "utf8"
    );
    expect(ivaText).toContain("14%, como taxa geral");
    expect(ivaText).toContain("7% para o regime simplificado");
    expect(ivaText).toContain("ARTIGO 19");
    expect(report).toContain("4511 Caixa");
    expect(report).toContain(
      "manter **4511 — Caixa** como designação normativa oficial"
    );
  });
});

it("bloqueia uma cadeia IVA incompleta mesmo com regras e mapeamentos activos", () => {
  const result = evaluateIvaReadiness({
    rules: [{ verificationStatus: "ACTIVE", regime: "GERAL" }],
    mappings: [{ verificationStatus: "ACTIVE" }],
    sources: [{ verificationStatus: "CONFIRMED", code: "IVA-LAW-14-23" }],
  });
  expect(result.ready).toBe(false);
  expect(result.missingChainSources).toContain("IVA-DP-180-19");
  expect(result.blockers).toContain("IVA_CADEIA_NORMATIVA_INCOMPLETA");
});
