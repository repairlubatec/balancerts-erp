#!/usr/bin/env node
/**
 * Valida um plano PGCA exportado para JSON antes da activação.
 * Uso: node scripts/validate-pgca-plan.mjs plano.json [--output resultado.json]
 *
 * O script é estrutural: não decide a legalidade de uma conta nem inventa regras.
 * Erros bloqueiam a activação; avisos exigem revisão humana.
 */
import fs from "node:fs";
import path from "node:path";

const inputPath = process.argv[2];
const outputFlag = process.argv.indexOf("--output");
const outputPath = outputFlag >= 0 ? process.argv[outputFlag + 1] : null;

if (!inputPath || inputPath.startsWith("-")) {
  console.error("Uso: node validate-pgca-plan.mjs <plano.json> [--output <resultado.json>]");
  process.exit(2);
}

const fail = (message) => {
  console.error(`ERRO: ${message}`);
  process.exit(2);
};

let document;
try {
  document = JSON.parse(fs.readFileSync(inputPath, "utf8"));
} catch (error) {
  fail(`não foi possível ler JSON: ${error instanceof Error ? error.message : String(error)}`);
}

const accounts = Array.isArray(document) ? document : document.accounts;
if (!Array.isArray(accounts)) fail("o JSON deve ser uma lista ou um objecto com a propriedade accounts");

const errors = [];
const warnings = [];
const normalise = (value) => String(value ?? "").trim().toUpperCase();
const accountCode = (account) => String(account.code ?? account.accountCode ?? "").trim();
const parentCode = (account) => String(account.parentCode ?? account.parent ?? "").trim();
const nature = (account) => normalise(account.nature ?? account.accountNature ?? account.natureza);
const isPostable = (account) => account.postable === true || account.launchable === true || account.lancavel === true || ["MOVIMENTAVEL", "MOVIMENTÁVEL", "POSTABLE", "LANCAVEL", "LANÇÁVEL"].includes(nature(account));
const validNatures = new Set(["DEBIT", "DEBITO", "DÉBITO", "CREDIT", "CREDITO", "CRÉDITO", "MIXED", "MISTA", "MISTO", "MISTA/DEBITO", "MISTA/CRÉDITO"]);
const byCode = new Map();

for (const [index, account] of accounts.entries()) {
  if (!account || typeof account !== "object") {
    errors.push({ code: "ACCOUNT_NOT_OBJECT", index, message: "A conta não é um objecto JSON." });
    continue;
  }
  const code = accountCode(account);
  if (!code) errors.push({ code: "ACCOUNT_CODE_MISSING", index, message: "A conta não tem código." });
  else if (byCode.has(code)) errors.push({ code: "ACCOUNT_CODE_DUPLICATE", account: code, message: `Código repetido: ${code}.` });
  else byCode.set(code, account);
  if (!String(account.name ?? account.description ?? account.designation ?? "").trim()) errors.push({ code: "ACCOUNT_NAME_MISSING", account: code || `#${index}`, message: "A conta não tem designação." });
  if (!validNatures.has(nature(account))) errors.push({ code: "ACCOUNT_NATURE_INVALID", account: code || `#${index}`, message: "Natureza inválida ou ausente; use débito, crédito ou mista." });
}

const children = new Map();
for (const [code, account] of byCode) {
  const parent = parentCode(account);
  if (parent) {
    if (!byCode.has(parent)) errors.push({ code: "PARENT_NOT_FOUND", account: code, parent, message: `Conta pai inexistente: ${parent}.` });
    else {
      const validPrefix = parent.length === 1 ? code.startsWith(parent) : code.startsWith(`${parent}.`);
      if (!(code === parent || validPrefix)) errors.push({ code: "HIERARCHY_PREFIX_INVALID", account: code, parent, message: `O código ${code} não está hierarquicamente abaixo de ${parent}.` });
    }
    const list = children.get(parent) ?? [];
    list.push(code);
    children.set(parent, list);
  } else if (code.includes(".")) {
    warnings.push({ code: "PARENT_NOT_DECLARED", account: code, message: "A conta tem segmentos hierárquicos mas não declara parentCode." });
  }
}

for (const [code, account] of byCode) {
  const descendants = children.get(code) ?? [];
  const postable = isPostable(account);
  if (postable && descendants.length > 0) errors.push({ code: "POSTABLE_HAS_CHILDREN", account: code, message: "Conta lançável/movimentável não pode ter subcontas." });
  if (!postable && descendants.length === 0) warnings.push({ code: "GROUP_WITHOUT_CHILDREN", account: code, message: "Conta não lançável sem descendentes; confirmar se é uma conta integradora válida." });
  const movement = account.movementRule ?? account.movement ?? account.regrasMovimento;
  if (postable && (!movement || !String(movement.debit ?? movement.debito ?? "").trim() || !String(movement.credit ?? movement.credit ?? movement.credito ?? "").trim())) {
    warnings.push({ code: "MOVEMENT_RULE_MISSING", account: code, message: "Conta movimentável sem regra explícita de débito e crédito." });
  }
}

const result = {
  valid: errors.length === 0,
  activationEligible: errors.length === 0 && warnings.length === 0,
  checkedAt: new Date().toISOString(),
  sourceFile: path.basename(inputPath),
  accountCount: accounts.length,
  errorCount: errors.length,
  warningCount: warnings.length,
  errors,
  warnings,
  decision: errors.length ? "BLOQUEAR" : warnings.length ? "REVISÃO_HUMANA" : "ELEGÍVEL_PARA_APROVAÇÃO"
};

const serialised = JSON.stringify(result, null, 2);
if (outputPath) fs.writeFileSync(outputPath, `${serialised}\n`);
console.log(serialised);
process.exitCode = errors.length ? 1 : 0;
