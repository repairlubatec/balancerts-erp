import { describe, expect, it } from "vitest";
import { normativeEvidence, validateNormativeCoverage } from "./normative";

describe("Angola normative evidence", () => {
  it("resolves the Presidential Decree 71/25 evidence", () => {
    expect(normativeEvidence("DP-71-25")).toMatchObject({ title: "Decreto Presidencial n.º 71/25, de 20 de Março" });
  });

  it("does not fabricate unknown normative rules", () => {
    expect(normativeEvidence("UNKNOWN")).toBeUndefined();
  });

  it("mantém fontes não confirmadas pendentes e regista a Lei n.º 14/23 confirmada", () => {
    expect(normativeEvidence("PGC-AO-82-01")).toMatchObject({ verificationStatus: "CONFIRMED", url: "https://cnnca.minfin.gov.ao/legislacao/sector-empresarial" });
    expect(normativeEvidence("LAW-14-23")).toMatchObject({ verificationStatus: "CONFIRMED", url: "https://lex.ao/docs/assembleia-nacional/2023/lei-n-o-14-23-de-28-de-dezembro/" });
    expect(normativeEvidence("AGT-IVA-SAF-T-2025")).toMatchObject({ verificationStatus: "PENDING" });
  });

  it("requires the appropriate evidence set by operational area", () => {
    expect(validateNormativeCoverage({ area: "FISCAL_DOCUMENT", evidenceCodes: ["DP-71-25", "AGT-FAT-DOC"] }).valid).toBe(true);
    expect(validateNormativeCoverage({ area: "ACCOUNTING", evidenceCodes: [] })).toMatchObject({ valid: false, missing: ["PGC-AO-82-01"] });
  });

  it("regista as cinco fontes oficiais do IVA com papéis distintos", () => {
    expect(normativeEvidence("IVA-LAW-7-19")).toMatchObject({ verificationStatus: "CONFIRMED", title: expect.stringContaining("Lei n.º 7/19"), scope: expect.stringContaining("histórica") });
    expect(normativeEvidence("IVA-LAW-17-19")).toMatchObject({ verificationStatus: "CONFIRMED", title: expect.stringContaining("Lei n.º 17/19"), scope: expect.stringContaining("1 de Outubro de 2019") });
    expect(normativeEvidence("IVA-DP-180-19")).toMatchObject({ verificationStatus: "CONFIRMED", scope: expect.stringContaining("34.5-IVA") });
    expect(normativeEvidence("IVA-DE-134-19")).toMatchObject({ verificationStatus: "CONFIRMED", scope: expect.stringContaining("Modelos") });
    expect(normativeEvidence("IVA-LAW-14-23")).toMatchObject({ verificationStatus: "CONFIRMED", scope: expect.stringContaining("consolidada") });
  });

  it("keeps the official PGCA evidence and review boundary", async () => {
    const { existsSync, readFileSync } = await import("node:fs");
    expect(existsSync("docs/normative-sources/decreto-82-01-pgca.pdf")).toBe(true);
    expect(existsSync("docs/normative-sources/decreto-82-01-pgca-ocr.txt")).toBe(true);
    const report = readFileSync("docs/pgca-official-analysis-2026-08-21.md", "utf8");
    expect(report).toContain("4511 Caixa");
    expect(report).toContain("6131 Mercado nacional");
    expect(report).toContain("Nenhuma alteração operacional foi feita nesta fase");
    expect(existsSync("docs/normative-sources/lei-14-23-iva.pdf")).toBe(true);
    expect(existsSync("docs/normative-sources/lei-14-23-iva-ocr.txt")).toBe(true);
    const ivaText = readFileSync("docs/normative-sources/lei-14-23-iva-ocr.txt", "utf8");
    expect(ivaText).toContain("14%, como taxa geral");
    expect(ivaText).toContain("7% para o regime simplificado");
    expect(ivaText).toContain("ARTIGO 19");
    expect(report).toContain("4511 Caixa");
    expect(report).toContain("manter **4511 — Caixa** como designação normativa oficial");
  });
});
