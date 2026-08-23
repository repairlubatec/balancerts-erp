// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import {
  buildIvaReadinessCsv,
  downloadIvaExport,
  openIvaExport,
} from "./ivaReadinessExport";

describe("exportação do estado de prontidão IVA", () => {
  const entry = {
    id: "pdf-1",
    format: "PDF" as const,
    filename: "prontidao-iva-3.pdf",
    mimeType: "application/pdf",
    content: "JVBERi0xLjQ=",
    encoding: "base64" as const,
    createdAt: Date.now(),
  };

  it("permite reabrir uma exportação PDF da sessão", () => {
    const createObjectURL = vi.fn(() => "blob:iva-pdf");
    const revokeObjectURL = vi.fn();
    const open = vi.fn(() => ({}));
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });
    Object.defineProperty(window, "open", {
      configurable: true,
      value: open,
    });

    expect(openIvaExport(entry)).toBe(true);
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith(
      "blob:iva-pdf",
      "_blank",
      "noopener,noreferrer"
    );
    expect(downloadIvaExport).toBeTypeOf("function");
  });

  it("inclui o resumo 3/5, a percentagem e os diplomas em falta", () => {
    const csv = buildIvaReadinessCsv(
      {
        ready: false,
        activeRules: 2,
        activeMappings: 0,
        confirmedSources: 3,
        missingChainSources: ["IVA-DP-180-19", "IVA-LAW-14-23"],
        activeByRegime: { GERAL: 2, SIMPLIFICADO: 0, EXCLUSAO: 0 },
        blockers: ["IVA_CADEIA_NORMATIVA_INCOMPLETA"],
      },
      new Date("2026-08-23T00:00:00Z")
    );

    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("Diplomas confirmados;3");
    expect(csv).toContain("Diplomas exigidos;5");
    expect(csv).toContain("Percentagem de conclusão;60%");
    expect(csv).toContain("Decreto Presidencial n.º 180/19");
    expect(csv).toContain("Lei n.º 14/23");
    expect(csv).toContain("Em falta");
    expect(csv).toContain("Lei n.º 7/19");
    expect(csv).toContain("Confirmado");
  });
});
