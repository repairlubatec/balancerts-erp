import { describe, expect, it } from "vitest";
import { getAccountingRuleCoverage, getPgcReadinessBlockers } from "./pgc-workflow";
import { accountingRuleOperationCandidates } from "./accounting-rule-operations";

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

  it("bloqueia activação com regras parciais", () => {
    expect(getPgcReadinessBlockers({ status: "VALIDATED", accountCount: 20, confirmedAccountCount: 20, sourceCount: 1, confirmedSourceCount: 1, accountingRuleCount: 2, accountingRuleOperations: ["COMPRAS", "VENDAS"] })).toContain("PGC_VERSION_ACCOUNTING_RULE_COVERAGE_INCOMPLETE");
  });

  it("resolve candidatos canónicos para operações importadas", () => {
    expect(accountingRuleOperationCandidates(" COMPRA ")).toEqual(["COMPRA", "COMPRAS"]);
    expect(accountingRuleOperationCandidates("VENDA")).toEqual(["VENDA", "VENDAS"]);
  });
});
