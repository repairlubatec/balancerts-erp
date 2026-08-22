import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("catálogo integral PGCA/IVA", () => {
  it("preserva fontes, hashes e estados de confirmação humana", () => {
    const path = "docs/normative-catalog-complete-review.json";
    expect(existsSync(path)).toBe(true);
    const catalog = JSON.parse(readFileSync(path, "utf8"));
    expect(catalog.policy.humanConfirmationRequired).toBe(true);
    expect(catalog.policy.operationalActivation).toBe("CONFIRMED_ONLY");
    expect(catalog.sources.pgca.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(catalog.sources.iva.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(catalog.summary.pgcaTotalCandidates).toBe(760);
    expect(catalog.summary.pgcaConfirmed).toBe(27);
    expect(catalog.summary.pgcaNeedsHumanConfirmation).toBe(733);
    expect(catalog.summary.ivaTotalRules).toBe(9);
    expect(catalog.summary.ivaConfirmed).toBe(2);
    expect(catalog.summary.ivaNeedsHumanConfirmation).toBe(7);
    const article19 = catalog.ivaRules.find((r: { id: string }) => r.id === "IVA-14-23-ART19-GERAL");
    expect(article19.rateTiers).toEqual(expect.arrayContaining([
      expect.objectContaining({ regime: "GERAL", rate: 0.14 }),
      expect.objectContaining({ regime: "SIMPLIFICADO", rate: 0.07 }),
      expect.objectContaining({ regime: "HOTELARIA_RESTAURACAO", rate: 0.07 }),
      expect.objectContaining({ regime: "BENS_ALIMENTARES_INSUMOS_AGRICOLAS", rate: 0.05 }),
      expect.objectContaining({ regime: "CABINDA_ESPECIAL", rate: 0.01 }),
    ]));
    expect(catalog.pgcaAccounts.every((a: { status: string }) => ["CONFIRMED", "NEEDS_HUMAN_CONFIRMATION"].includes(a.status))).toBe(true);
    expect(catalog.ivaRules.every((r: { status: string }) => ["CONFIRMED", "NEEDS_HUMAN_CONFIRMATION"].includes(r.status))).toBe(true);
  });

  it("regista evidência primária de classes sem promover movimentos auxiliares", () => {
    const catalog = JSON.parse(readFileSync("docs/normative-catalog-complete-review.json", "utf8"));
    for (const [code, page] of [["2", 44], ["3", 45], ["5", 48]] as const) {
      const account = catalog.pgcaAccounts.find((item: { code: string }) => item.code === code);
      expect(account).toBeDefined();
      expect(account.evidencePages).toContain(page);
      expect(account.evidence).toBe("visual-name-hierarchy-only");
      expect(account.status).toBe("NEEDS_HUMAN_CONFIRMATION");
    }
    expect(catalog.summary.accountingMovementRulesConfirmed ?? 0).toBe(0);
  });

  it("mantém o lote formal restrito às contas conferidas e sem movimentos confirmados", () => {
    const manifest = JSON.parse(readFileSync("docs/normative-sources/pgca-visually-confirmed-accounts.json", "utf8"));
    const catalog = JSON.parse(readFileSync("docs/normative-catalog-complete-review.json", "utf8"));
    expect(manifest.accounts).toHaveLength(27);
    expect(catalog.summary.pgcaConfirmed).toBe(manifest.accounts.length);
    expect(catalog.summary.accountingMovementRulesConfirmed ?? 0).toBe(0);
    expect(manifest.source.sha256).toBe(catalog.sources.pgca.sha256);
    expect(new Set(manifest.accounts.map((account: { code: string }) => account.code)).size).toBe(27);
  });

  it("não permite considerar candidato pendente como activado", () => {
    const catalog = JSON.parse(readFileSync("docs/normative-catalog-complete-review.json", "utf8"));
    const pending = catalog.pgcaAccounts.filter((a: { status: string }) => a.status !== "CONFIRMED");
    const pendingIva = catalog.ivaRules.filter((r: { status: string }) => r.status !== "CONFIRMED");
    expect(pending.length).toBe(733);
    expect(pendingIva.length).toBe(7);
    expect([...pending, ...pendingIva].every((item: { status: string }) => item.status === "NEEDS_HUMAN_CONFIRMATION")).toBe(true);
  });
});
