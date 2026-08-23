import { describe, expect, it } from "vitest";
import { buildIvaReadinessPdf } from "./iva-readiness-pdf";

describe("relatório PDF de prontidão IVA", () => {
  it("gera um PDF de consulta com estado e cadeia incompleta", async () => {
    const result = await buildIvaReadinessPdf({
      organizationName: "Organização de teste",
      asOf: new Date("2026-08-23T00:00:00Z"),
      readiness: {
        ready: false,
        activeRules: 2,
        activeMappings: 0,
        confirmedSources: 3,
        missingChainSources: ["IVA-DP-180-19", "IVA-LAW-14-23"],
        activeByRegime: { GERAL: 2, SIMPLIFICADO: 0, EXCLUSAO: 0 },
        blockers: ["IVA_CADEIA_NORMATIVA_INCOMPLETA"],
      },
    });

    expect(result.mimeType).toBe("application/pdf");
    expect(result.buffer.subarray(0, 5).toString()).toBe("%PDF-");
    expect(result.buffer.length).toBeGreaterThan(500);
  });
});
