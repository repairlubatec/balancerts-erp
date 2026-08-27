import { describe, expect, it } from "vitest";
import { getAccountingMovementRule, validateDirectionalMovement } from "../shared/accountingMovementRules";

describe("regras-base de movimentação contabilística", () => {
  it("descreve natureza devedora como aumento a débito e diminuição a crédito", () => {
    const rule = getAccountingMovementRule("DEBIT");
    expect(rule.debitLabel).toContain("Aumentos");
    expect(rule.creditLabel).toContain("Diminuições");
    expect(rule.automaticPosting).toBe("ALLOWED");
    expect(rule.evidence).toContain("Colectânea de Legislação da Contabilidade de Angola");
    expect(rule.evidence).not.toContain("Manual de Contabilidade");
    expect(rule.evidenceScope).toBe("PGCA_COMPATIBLE_TECHNICAL_RULE");
  });
  it("descreve natureza credora como aumento a crédito e diminuição a débito", () => {
    const rule = getAccountingMovementRule("CREDIT");
    expect(rule.debitLabel).toContain("Diminuições");
    expect(rule.creditLabel).toContain("Aumentos");
    expect(rule.evidenceScope).toBe("PGCA_COMPATIBLE_TECHNICAL_RULE");
  });
  it("bloqueia natureza mista sem regra confirmada e aceita-a com regra", () => {
    expect(getAccountingMovementRule("MIXED").evidenceScope).toBe("SOURCE_CONFIRMATION_REQUIRED");
    expect(validateDirectionalMovement({ debitNature: "MIXED", creditNature: "CREDIT" }).ok).toBe(false);
    expect(validateDirectionalMovement({ debitNature: "MIXED", creditNature: "CREDIT", hasConfirmedRule: true }).ok).toBe(true);
  });
  it("rejeita natureza não aplicável e direcção incompatível", () => {
    expect(validateDirectionalMovement({ debitNature: "NOT_APPLICABLE", creditNature: "CREDIT", hasConfirmedRule: true }).ok).toBe(false);
    expect(validateDirectionalMovement({ debitNature: "CREDIT", creditNature: "DEBIT", hasConfirmedRule: true }).ok).toBe(false);
  });
});
