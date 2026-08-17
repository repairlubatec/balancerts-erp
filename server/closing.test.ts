import { describe, expect, it } from "vitest";
import { buildReopenAudit, evaluatePeriodClose, validateReopenReason } from "./closing";

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

  it("builds the mandatory audited reopen event", () => {
    expect(buildReopenAudit({ organizationId: 1, companyId: 2, periodId: 3, actorUserId: 4, reason: "Correcção documental", correlationId: "corr-1" })).toMatchObject({ action: "PERIOD_REOPEN", entityType: "FISCAL_PERIOD", entityId: "3", beforeState: JSON.stringify({ state: "CLOSED", periodId: 3 }), afterState: JSON.stringify({ state: "REOPEN_REQUESTED", periodId: 3, reason: "Correcção documental" }), correlationId: "corr-1" });
  });
});
