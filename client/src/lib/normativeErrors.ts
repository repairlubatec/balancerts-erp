const labels: Record<string, string> = {
  PGC_VERSION_NOT_FOUND_OR_FORBIDDEN:
    "A versão não foi encontrada ou não está autorizada para esta organização.",
  PGC_VERSION_NOT_REVIEWABLE:
    "A versão não está no estado correcto para revisão.",
  PGC_SOURCE_NOT_FOUND_OR_FORBIDDEN:
    "A fonte normativa não foi encontrada ou não está autorizada para esta organização.",
  PGC_SOURCE_REVIEW_NOTE_REQUIRED:
    "Indique o motivo da divergência ou rejeição da fonte normativa.",
  PGC_ACCOUNT_NOT_FOUND_OR_FORBIDDEN:
    "A conta normativa não foi encontrada ou não está autorizada para esta organização.",
  PGC_ACCOUNT_NOT_REVIEWABLE:
    "A conta não está no estado correcto para revisão.",
  PGC_VERSION_ACCOUNTING_RULE_COVERAGE_INCOMPLETE:
    "A versão não cobre todas as operações contabilísticas obrigatórias.",
  PGC_VERSION_HAS_DUPLICATE_CODES:
    "A versão contém códigos PGCA duplicados.",
  PGC_VERSION_HAS_ACCOUNTS_WITHOUT_SOURCE:
    "Existem contas PGCA sem fonte normativa associada.",
  PGC_VERSION_HAS_MISSING_PARENTS:
    "Existem contas PGCA com relação pai em falta ou irresolúvel.",
  PGC_VERSION_HAS_ROOT_PARENTS:
    "Existe uma classe PGCA de nível raiz com pai inválido.",
  PGC_VERSION_HAS_SELF_PARENTS:
    "Existe uma auto-relação hierárquica numa conta PGCA.",
  PGC_VERSION_HAS_NON_EXTENDABLE_PARENTS:
    "Existe uma conta filha ligada a um pai que não aceita descendentes.",
  PGC_VERSION_HAS_CROSS_CLASS_PARENTS:
    "Existe uma relação pai-filho entre classes PGCA diferentes.",
  PGC_VERSION_HAS_INVALID_LEVELS:
    "Existem níveis hierárquicos PGCA incoerentes.",
  PGC_VERSION_HAS_GROUPS_WITH_MOVEMENTS:
    "Existe um grupo PGCA configurado indevidamente para receber movimentos.",
  PGC_VERSION_HAS_MOVEMENT_CHILDREN:
    "Existe uma conta movimentável PGCA configurada indevidamente com descendentes.",
  IVA_NORMATIVE_RULE_REQUIRED:
    "Indique uma regra IVA confirmada e activa para liquidar imposto.",
  IVA_NORMATIVE_RULE_NOT_ACTIVE_OR_FORBIDDEN:
    "A regra IVA não está activa, não vigora na data ou não pertence à organização.",
  IVA_RULE_HUMAN_APPROVAL_REQUIRED:
    "A regra IVA requer aprovação humana antes da activação.",
  IVA_RULE_NOT_FOUND_OR_FORBIDDEN:
    "A regra IVA não foi encontrada ou não está autorizada para esta organização.",
  IVA_REJECTION_NOTE_REQUIRED: "Indique o motivo da rejeição da regra IVA.",
  IVA_ACCOUNT_HUMAN_APPROVAL_REQUIRED:
    "O mapeamento da conta IVA requer aprovação humana antes da activação.",
  IVA_ACCOUNT_MAPPING_NOT_FOUND_OR_FORBIDDEN:
    "O mapeamento da conta IVA não foi encontrado ou não está autorizado para esta organização.",
  IVA_CADEIA_NORMATIVA_INCOMPLETA:
    "A cadeia normativa IVA está incompleta. Consulte os diplomas em falta antes de activar regras.",
};

export function normativeErrorLabel(message: string) {
  return (
    labels[message] ??
    "Não foi possível concluir a revisão normativa. Verifique a sessão, a organização e o estado da versão."
  );
}
