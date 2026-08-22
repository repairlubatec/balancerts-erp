import { describe, expect, it } from "vitest";
import { auditRiskBadgeClass, classifyAuditRisk } from "./auditRisk";

describe("classificação de risco da auditoria", () => {
  it("classifica activação de versão como crítica", () => {
    const risk = classifyAuditRisk({ action: "PGC_VERSION_ACTIVATED", entityType: "pgcVersion" });
    expect(risk).toMatchObject({ level: "CRITICAL", isCritical: true, label: "Crítico" });
    expect(auditRiskBadgeClass(risk.level)).toContain("border-red");
  });
  it("classifica confirmação de conta como alto risco", () => {
    expect(classifyAuditRisk({ action: "PGC_ACCOUNT_REVIEWED", entityType: "pgcAccount" }).level).toBe("HIGH");
  });
  it("detecta alteração de estado mesmo quando a acção é genérica", () => {
    const risk = classifyAuditRisk({ action: "PROFILE_UPDATED", entityType: "company", beforeState: "DRAFT", afterState: "ACTIVE" });
    expect(risk.level).toBe("HIGH");
    expect(risk.reason).toContain("Alteração detectada");
  });
  it("mantém eventos sem alteração crítica como normais", () => {
    expect(classifyAuditRisk({ action: "PGC_EVIDENCE_SUBMITTED", entityType: "pgcEvidenceSubmission" })).toMatchObject({ level: "NORMAL", isCritical: false });
  });
});
