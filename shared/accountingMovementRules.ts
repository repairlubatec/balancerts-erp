export type AccountingNature = "DEBIT" | "CREDIT" | "MIXED" | "NOT_APPLICABLE";
export type MovementSide = "DEBIT" | "CREDIT";

export type AccountingMovementRule = {
  nature: AccountingNature;
  debitLabel: string;
  creditLabel: string;
  automaticPosting: "ALLOWED" | "REQUIRES_CONFIRMED_RULE" | "BLOCKED";
  explanation: string;
};

const rules: Record<AccountingNature, AccountingMovementRule> = {
  DEBIT: {
    nature: "DEBIT",
    debitLabel: "Aumentos, entradas e aquisições",
    creditLabel: "Diminuições, saídas, consumo, alienações ou regularizações redutoras",
    automaticPosting: "ALLOWED",
    explanation: "A conta de natureza devedora aumenta a débito e diminui a crédito.",
  },
  CREDIT: {
    nature: "CREDIT",
    debitLabel: "Diminuições, liquidações, distribuições ou reduções",
    creditLabel: "Aumentos, constituição de obrigações ou acréscimos",
    automaticPosting: "ALLOWED",
    explanation: "A conta de natureza credora aumenta a crédito e diminui a débito.",
  },
  MIXED: {
    nature: "MIXED",
    debitLabel: "Depende da regra específica confirmada",
    creditLabel: "Depende da regra específica confirmada",
    automaticPosting: "REQUIRES_CONFIRMED_RULE",
    explanation: "A conta mista pode assumir comportamento devedor ou credor; exige regra de movimentação confirmada na fonte primária.",
  },
  NOT_APPLICABLE: {
    nature: "NOT_APPLICABLE",
    debitLabel: "Não definido",
    creditLabel: "Não definido",
    automaticPosting: "BLOCKED",
    explanation: "A natureza não está definida para movimentação automática.",
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
