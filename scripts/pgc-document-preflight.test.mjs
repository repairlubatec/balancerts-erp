import { describe, expect, it } from "vitest";
import { analysePgcDocument } from "./pgc-document-preflight.mjs";

describe("análise não destrutiva do documento PGCA/IVA", () => {
  it("detecta códigos duplicados e impede importação normativa directa", () => {
    const result = analysePgcDocument([
      "1.1 — Conta A",
      "1.1 — Conta B",
      "1.1.1 — Filha",
      "FIM DO DOCUMENTO",
    ].join("\n"));

    expect(result.accountCount).toBe(3);
    expect(result.duplicateCodes).toEqual([
      { code: "1.1", lines: [1, 2], names: ["Conta A", "Conta B"] },
    ]);
    expect(result.safeForNormativeImport).toBe(false);
    expect(result.safeForActivation).toBe(false);
  });

  it("detecta documento concatenado após o fim formal", () => {
    const result = analysePgcDocument([
      "1 — Classe",
      "1.1 — Conta",
      "FIM DO DOCUMENTO",
      "COMANDO V2.2 FINAL",
    ].join("\n"));

    expect(result.sourceShape).toBe("CONCATENATED_DOCUMENTS");
    expect(result.hasConcatenatedContent).toBe(true);
    expect(result.activationBlockers).toContain("DOCUMENTOS_CONCATENADOS");
  });

  it("classifica extensões reservadas sem as activar", () => {
    const result = analysePgcDocument([
      "1 — Classe",
      "1.1 — RESERVED_PGC_EXTENSION",
      "1.2 — Conta válida",
      "FIM DO DOCUMENTO",
    ].join("\n"));

    expect(result.reservedExtensions).toHaveLength(1);
    expect(result.safeForNormativeImport).toBe(true);
    expect(result.safeForActivation).toBe(false);
    expect(result.activationBlockers).toContain("EXTENSOES_RESERVADAS_NAO_MOVIMENTAVEIS");
  });

  it("identifica pais ausentes sem inventar a hierarquia", () => {
    const result = analysePgcDocument([
      "1 — Classe",
      "1.2.1 — Conta sem pai directo",
      "FIM DO DOCUMENTO",
    ].join("\n"));

    expect(result.missingParents).toEqual([
      { code: "1.2.1", name: "Conta sem pai directo", line: 2, parentCode: "1.2" },
    ]);
    expect(result.safeForActivation).toBe(false);
  });
});
