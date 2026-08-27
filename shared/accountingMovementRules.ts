export type AccountingNature = "DEBIT" | "CREDIT" | "MIXED" | "NOT_APPLICABLE";
export type MovementSide = "DEBIT" | "CREDIT";

export type AccountingMovementRule = {
  nature: AccountingNature;
  debitLabel: string;
  creditLabel: string;
  automaticPosting: "ALLOWED" | "REQUIRES_CONFIRMED_RULE" | "BLOCKED";
  explanation: string;
  evidence: string;
  evidenceScope: "PGCA_COMPATIBLE_TECHNICAL_RULE" | "SOURCE_CONFIRMATION_REQUIRED" | "NOT_APPLICABLE";
};

const rules: Record<AccountingNature, AccountingMovementRule> = {
  DEBIT: {
    nature: "DEBIT",
    debitLabel: "Aumentos, entradas e aquisições",
    creditLabel: "Diminuições, saídas, consumo, alienações ou regularizações redutoras",
    automaticPosting: "ALLOWED",
    explanation: "A conta de natureza devedora aumenta a débito e diminui a crédito.",
    evidence: "Colectânea de Legislação da Contabilidade de Angola e Decreto n.º 82/01, regras gerais confrontadas com o PGCA-82-01.",
    evidenceScope: "PGCA_COMPATIBLE_TECHNICAL_RULE",
  },
  CREDIT: {
    nature: "CREDIT",
    debitLabel: "Diminuições, liquidações, distribuições ou reduções",
    creditLabel: "Aumentos, constituição de obrigações ou acréscimos",
    automaticPosting: "ALLOWED",
    explanation: "A conta de natureza credora aumenta a crédito e diminui a débito.",
    evidence: "Colectânea de Legislação da Contabilidade de Angola e Decreto n.º 82/01, regras gerais confrontadas com o PGCA-82-01.",
    evidenceScope: "PGCA_COMPATIBLE_TECHNICAL_RULE",
  },
  MIXED: {
    nature: "MIXED",
    debitLabel: "Depende da regra específica confirmada",
    creditLabel: "Depende da regra específica confirmada",
    automaticPosting: "REQUIRES_CONFIRMED_RULE",
    explanation: "A conta mista pode assumir comportamento devedor ou credor; exige regra de movimentação confirmada na fonte.",
    evidence: "Regra técnica geral complementada pelas regras específicas do PGCA/DP 180/19 quando aplicável.",
    evidenceScope: "SOURCE_CONFIRMATION_REQUIRED",
  },
  NOT_APPLICABLE: {
    nature: "NOT_APPLICABLE",
    debitLabel: "Não definido",
    creditLabel: "Não definido",
    automaticPosting: "BLOCKED",
    explanation: "A natureza não está definida para movimentação automática.",
    evidence: "Sem evidência suficiente.",
    evidenceScope: "NOT_APPLICABLE",
  },
};

export function getAccountingMovementRule(nature: string | null | undefined): AccountingMovementRule {
  return rules[(nature ?? "NOT_APPLICABLE") as AccountingNature] ?? rules.NOT_APPLICABLE;
}

export function validateDirectionalMovement(input: { debitNature: string | null | undefined; creditNature: string | null | undefined; hasConfirmedRule?: boolean }) {
  const debit = getAccountingMovementRule(input.debitNature);
  const credit = getAccountingMovementRule(input.creditNature);
  const debitCompatible = debit.nature === "DEBIT" || debit.nature === "MIXED";
  const creditCompatible = credit.nature === "CREDIT" || credit.nature === "MIXED";
  const mixedNeedsRule = (debit.nature === "MIXED" || credit.nature === "MIXED") && !input.hasConfirmedRule;
  return {
    ok: debitCompatible && creditCompatible && !mixedNeedsRule && debit.nature !== "NOT_APPLICABLE" && credit.nature !== "NOT_APPLICABLE",
    debitCompatible,
    creditCompatible,
    mixedNeedsRule,
    reason: !debitCompatible ? "A conta a débito não tem natureza devedora compatível." : !creditCompatible ? "A conta a crédito não tem natureza credora compatível." : mixedNeedsRule ? "Uma conta mista exige regra de movimentação confirmada." : "Natureza compatível.",
  };
}


export type OperationalRuleOperation =
  | "PURCHASE"
  | "SALE"
  | "STOCK"
  | "TREASURY"
  | "PAYROLL"
  | "FIXED_ASSET";

export type OperationalRulePreparation = {
  operation: OperationalRuleOperation;
  label: string;
  debitRequirement: string;
  creditRequirement: string;
  taxRequirement: string;
  postingStatus: "DRAFT_ONLY";
  requiresHumanApproval: true;
};

/**
 * Modelos de preparação, não regras contabilísticas prontas para posting.
 * Não escolhem códigos de conta nem calculam imposto por inferência.
 */
export const operationalRulePreparations: readonly OperationalRulePreparation[] = [
  {
    operation: "PURCHASE",
    label: "Compras",
    debitRequirement: "Conta de compra/inventário confirmada; IVA dedutível apenas quando elegível",
    creditRequirement: "Fornecedor ou tesouraria confirmado pelo documento",
    taxRequirement: "Regime IVA, dedutibilidade, localização e eventual IS/verba",
    postingStatus: "DRAFT_ONLY",
    requiresHumanApproval: true,
  },
  {
    operation: "SALE",
    label: "Vendas",
    debitRequirement: "Cliente ou tesouraria confirmado pelo documento",
    creditRequirement: "Conta de vendas confirmada; IVA liquidado apenas quando devido",
    taxRequirement: "Regime IVA, taxa aplicável, isenção, exportação/Cabinda e documento",
    postingStatus: "DRAFT_ONLY",
    requiresHumanApproval: true,
  },
  {
    operation: "STOCK",
    label: "Stock",
    debitRequirement: "Conta de inventário/regularização confirmada e evento identificado",
    creditRequirement: "Conta de contrapartida confirmada pelo movimento de stock",
    taxRequirement: "Sem taxa genérica; fiscalidade herdada do documento de entrada/saída",
    postingStatus: "DRAFT_ONLY",
    requiresHumanApproval: true,
  },
  {
    operation: "TREASURY",
    label: "Tesouraria",
    debitRequirement: "Conta de natureza devedora para entrada ou liquidação documentada",
    creditRequirement: "Conta de contrapartida confirmada; saída reduz conta de natureza devedora",
    taxRequirement: "IVA/IRT/IS apenas quando o pagamento liquidar obrigação documentada",
    postingStatus: "DRAFT_ONLY",
    requiresHumanApproval: true,
  },
  {
    operation: "PAYROLL",
    label: "Salários",
    debitRequirement: "Gasto/remuneração confirmado pelo processamento salarial",
    creditRequirement: "Salários, IRT e encargos a pagar com contas de retenção confirmadas",
    taxRequirement: "Grupo IRT, tabela vigente, deduções e retenções do trabalhador",
    postingStatus: "DRAFT_ONLY",
    requiresHumanApproval: true,
  },
  {
    operation: "FIXED_ASSET",
    label: "Imobilizado",
    debitRequirement: "Activo confirmado por classe e tipo, com IVA dedutível quando elegível",
    creditRequirement: "Fornecedor/tesouraria ou resultado de alienação confirmado",
    taxRequirement: "IVA, IP e IS dependem do tipo de activo, acto e verba aplicável",
    postingStatus: "DRAFT_ONLY",
    requiresHumanApproval: true,
  },
] as const;

export function getOperationalRulePreparation(operation: string) {
  return operationalRulePreparations.find(row => row.operation === operation);
}
