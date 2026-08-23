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
