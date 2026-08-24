import { describe, expect, it } from "vitest";
import { buildPgcComplianceMatrix, matrixCsv } from "./pgc-document-matrix.mjs";

describe("matriz preliminar de conformidade PGCA", () => {
  it("produz uma linha por conta e conserva reservas e duplicações como pendências", () => {
    const result = buildPgcComplianceMatrix([
      "1 — Classe",
      "1.1 — Conta válida",
      "1.1.1 — RESERVED_PGC_EXTENSION",
      "1.1 — Conta repetida",
      "FIM DO DOCUMENTO",
      "mensagem posterior",
    ].join("\n"));

    expect(result.rows).toHaveLength(4);
    expect(result.rows.filter(row => row.duplicate)).toHaveLength(2);
    expect(result.rows.find(row => row.reserved)?.implementationDecision).toBe("STAGING_ONLY_NOT_ACTIVATED");
    expect(result.analysis.hasConcatenatedContent).toBe(true);
    expect(result.analysis.safeForActivation).toBe(false);
    expect(result.analysis.prohibitedGenericAccounts).toHaveLength(0);
  });

  it("emite cabeçalhos portugueses e não cria fonte ou activação por omissão", () => {
    const csv = matrixCsv(["1 — Classe", "FIM DO DOCUMENTO"].join("\n"));
    expect(csv).toContain('"codigo","designacao","codigo_pai"');
    expect(csv).toContain('"REQUIRES_PRIMARY_SOURCE_CONFIRMATION"');
    expect(csv).toContain('"STAGING_ONLY_NOT_ACTIVATED"');
  });

  it("sinaliza códigos genéricos proibidos pelo documento", () => {
    const result = buildPgcComplianceMatrix([
      "1 — Classe",
      "999 — Diversos",
      "9999 — Conta automática",
      "FIM DO DOCUMENTO",
    ].join("\n"));

    expect(result.analysis.prohibitedGenericAccounts.map(row => row.code)).toEqual(["999", "9999"]);
    expect(result.rows.filter(row => row.prohibitedGeneric).every(row => row.validationStatus === "REQUIRES_HUMAN_VALIDATION")).toBe(true);
    expect(result.analysis.safeForNormativeImport).toBe(false);
    expect(result.analysis.safeForActivation).toBe(false);
  });
});
