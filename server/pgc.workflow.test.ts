import { describe, expect, it } from "vitest";
import { getAccountingRuleCoverage, getPgcReadinessBlockers, getPgcStructuralBlockers } from "./pgc-workflow";
import { accountingRuleOperationCandidates } from "./accounting-rule-operations";
import { validateAccountingRuleDraft } from "./pgc";

describe("PGCA activation readiness", () => {
  it("blocks an under-review partial version without accounting rules", () => {
    expect(getPgcReadinessBlockers({ status: "UNDER_REVIEW", accountCount: 20, confirmedAccountCount: 20, sourceCount: 1, confirmedSourceCount: 1, accountingRuleCount: 0 })).toEqual(["PGC_VERSION_MUST_BE_VALIDATED", "PGC_VERSION_WITHOUT_ACCOUNTING_RULES"]);
  });

  it("blocks unconfirmed accounts and sources", () => {
    expect(getPgcReadinessBlockers({ status: "VALIDATED", accountCount: 20, confirmedAccountCount: 19, sourceCount: 2, confirmedSourceCount: 1, accountingRuleCount: 3 })).toEqual(["PGC_VERSION_HAS_UNVALIDATED_ACCOUNTS", "PGC_VERSION_HAS_UNCONFIRMED_SOURCES"]);
  });

  it("reports ready only when all activation prerequisites exist", () => {
    expect(getPgcReadinessBlockers({ status: "VALIDATED", accountCount: 20, confirmedAccountCount: 20, sourceCount: 1, confirmedSourceCount: 1, accountingRuleCount: 4 })).toEqual([]);
  });

  it("identifica cobertura AccountingRules vazia", () => {
    expect(getAccountingRuleCoverage({ activeRuleOperations: [] })).toMatchObject({ complete: false, active: [], missing: ["COMPRAS", "VENDAS", "STOCK", "TESOURARIA", "SALARIOS", "IMOBILIZADO"] });
  });

  it("identifica cobertura parcial sem parametrizar operações ausentes", () => {
    expect(getAccountingRuleCoverage({ activeRuleOperations: ["COMPRAS", "VENDAS"] })).toMatchObject({ complete: false, active: ["COMPRAS", "VENDAS"], missing: ["STOCK", "TESOURARIA", "SALARIOS", "IMOBILIZADO"] });
  });

  it("confirma cobertura completa apenas quando todas as operações têm regra activa", () => {
    expect(getAccountingRuleCoverage({ activeRuleOperations: ["COMPRAS", "VENDAS", "STOCK", "TESOURARIA", "SALARIOS", "IMOBILIZADO"] })).toMatchObject({ complete: true, missing: [] });
  });

  it("normaliza variantes existentes sem criar operações adicionais", () => {
    expect(getAccountingRuleCoverage({ activeRuleOperations: ["COMPRA", "VENDA", "ESTOQUE", "PAGAMENTO", "FOLHA", "DEPRECIAÇÃO"] })).toMatchObject({ complete: true, missing: [], active: ["COMPRAS", "VENDAS", "STOCK", "TESOURARIA", "SALARIOS", "IMOBILIZADO"] });
  });

  it("reproduz o estado real de revisão das 765 contas sem activar a versão", () => {
    const blockers = getPgcReadinessBlockers({
      status: "UNDER_REVIEW",
      accountCount: 792,
      confirmedAccountCount: 27,
      sourceCount: 6,
      confirmedSourceCount: 6,
      accountingRuleCount: 0,
      accountingRuleOperations: [],
    });
    expect(blockers).toEqual(expect.arrayContaining([
      "PGC_VERSION_MUST_BE_VALIDATED",
      "PGC_VERSION_HAS_UNVALIDATED_ACCOUNTS",
      "PGC_VERSION_WITHOUT_ACCOUNTING_RULES",
    ]));
  });

  it("bloqueia activação com regras parciais", () => {
    expect(getPgcReadinessBlockers({ status: "VALIDATED", accountCount: 20, confirmedAccountCount: 20, sourceCount: 1, confirmedSourceCount: 1, accountingRuleCount: 2, accountingRuleOperations: ["COMPRAS", "VENDAS"] })).toContain("PGC_VERSION_ACCOUNTING_RULE_COVERAGE_INCOMPLETE");
  });

  it("bloqueia estrutura PGCA sem fonte, pai ou compatibilidade de grupo", () => {
    const blockers = getPgcStructuralBlockers([
      { id: 1, code: "4", classCode: "4", parentId: null, parentCode: null, level: 1, accountType: "CLASS", acceptsEntries: 0, acceptsChildren: 1, sourceId: 10 },
      { id: 2, code: "4.1", classCode: "4", parentId: null, parentCode: null, level: 2, accountType: "GROUP", acceptsEntries: 1, acceptsChildren: 0, sourceId: null },
    ]);
    expect(blockers).toEqual(expect.arrayContaining(["PGC_VERSION_HAS_ACCOUNTS_WITHOUT_SOURCE", "PGC_VERSION_HAS_MISSING_PARENTS", "PGC_VERSION_HAS_GROUPS_WITH_MOVEMENTS"]));
  });

  it("aceita uma hierarquia confirmada e coerente", () => {
    expect(getPgcStructuralBlockers([
      { id: 1, code: "4", classCode: "4", parentId: null, parentCode: null, level: 1, accountType: "CLASS", acceptsEntries: 0, acceptsChildren: 1, sourceId: 10 },
      { id: 2, code: "4.1", classCode: "4", parentId: 1, parentCode: "4", level: 2, accountType: "MOVEMENT", acceptsEntries: 1, acceptsChildren: 0, sourceId: 10 },
    ])).toEqual([]);
  });

  it("resolve candidatos canónicos para operações importadas", () => {
    expect(accountingRuleOperationCandidates(" COMPRA ")).toEqual(["COMPRA", "COMPRAS"]);
    expect(accountingRuleOperationCandidates("VENDA")).toEqual(["VENDA", "VENDAS"]);
  });

  it("rejeita rascunho de regra sem fonte normativa", () => {
    expect(() => validateAccountingRuleDraft({ operation: "COMPRAS", debitAccountId: 1, creditAccountId: 2, effectiveFrom: new Date("2026-01-01T00:00:00Z") })).toThrow("PGC_RULE_SOURCE_REQUIRED");
  });

  it("aceita rascunho de regra com contas, fonte e vigência coerentes", () => {
    expect(validateAccountingRuleDraft({ operation: "COMPRAS", debitAccountId: 1, creditAccountId: 2, sourceId: 3, effectiveFrom: new Date("2026-01-01T00:00:00Z"), effectiveTo: new Date("2026-12-31T00:00:00Z") })).toBe(true);
  });
});
