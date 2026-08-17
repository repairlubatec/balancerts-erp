import { describe, expect, it } from "vitest";
import { evaluatePeriodClose, validateReopenReason } from "./closing";

describe("period closing", () => {
  it("blocks closing while a blocking check is pending", () => {
    const result = evaluatePeriodClose([
      { code: "BANK", label: "Reconciliação bancária", passed: true, blocking: true },
      { code: "IVA", label: "Apuramento de IVA", passed: false, blocking: true },
      { code: "DOCS", label: "Documentos arquivados", passed: false, blocking: false },
    ]);
    expect(result.canClose).toBe(false);
    expect(result.blockers.map((item) => item.code)).toEqual(["IVA"]);
  });

  it("requires a meaningful reason to reopen", () => {
    expect(validateReopenReason("Reabrir para corrigir documento emitido")).toContain("Reabrir");
    expect(() => validateReopenReason("curto")).toThrow("REOPEN_REASON_REQUIRED");
  });
});
