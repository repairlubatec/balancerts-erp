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
    expect(catalog.summary.ivaConfirmed).toBe(1);
    expect(catalog.summary.ivaNeedsHumanConfirmation).toBe(8);
    expect(catalog.pgcaAccounts.every((a: { status: string }) => ["CONFIRMED", "NEEDS_HUMAN_CONFIRMATION"].includes(a.status))).toBe(true);
    expect(catalog.ivaRules.every((r: { status: string }) => ["CONFIRMED", "NEEDS_HUMAN_CONFIRMATION"].includes(r.status))).toBe(true);
  });

  it("não permite considerar candidato pendente como activado", () => {
    const catalog = JSON.parse(readFileSync("docs/normative-catalog-complete-review.json", "utf8"));
    const pending = catalog.pgcaAccounts.filter((a: { status: string }) => a.status !== "CONFIRMED");
    const pendingIva = catalog.ivaRules.filter((r: { status: string }) => r.status !== "CONFIRMED");
    expect(pending.length).toBe(733);
    expect(pendingIva.length).toBe(8);
    expect([...pending, ...pendingIva].every((item: { status: string }) => item.status === "NEEDS_HUMAN_CONFIRMATION")).toBe(true);
  });
});
