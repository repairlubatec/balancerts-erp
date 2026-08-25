import { describe, expect, it } from "vitest";
import { getPgcaV2PreflightBlockers, pgcaV2Decision, pgcaV2Preflight } from "./pgcaV2Preflight";

describe("PGCA V2 preflight", () => {
  it("expõe todos os bloqueios da matriz actual sem os converter em aprovação", () => {
    expect(getPgcaV2PreflightBlockers()).toEqual([
      "DUPLICATE_CODES",
      "RESERVED_EXTENSIONS",
      "SOURCE_DOCUMENT_INCOMPLETE",
      "NORMATIVE_IMPORT_NOT_SAFE",
      "ACTIVATION_NOT_SAFE",
    ]);
    expect(pgcaV2Decision()).toBe("STAGING_ONLY_NOT_ACTIVATED");
  });

  it("só permite decisão de revisão humana quando a fonte está completa e segura", () => {
    const safe = {
      ...pgcaV2Preflight,
      duplicateCodes: [],
      reservedExtensions: 0,
      documentEndLine: 855,
      safeForNormativeImport: true,
      safeForActivation: false,
    } as const;
    expect(getPgcaV2PreflightBlockers(safe)).toEqual(["ACTIVATION_NOT_SAFE"]);
    expect(pgcaV2Decision(safe)).toBe("STAGING_ONLY_NOT_ACTIVATED");
  });
});

// Este teste é deliberadamente read-only: o preflight não altera contas, fontes ou regras.
