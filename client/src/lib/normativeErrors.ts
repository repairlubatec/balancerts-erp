const labels: Record<string, string> = {
  PGC_VERSION_NOT_FOUND_OR_FORBIDDEN: "A versão não foi encontrada ou não está autorizada para esta organização.",
  PGC_VERSION_NOT_REVIEWABLE: "A versão não está no estado correcto para revisão.",
  PGC_SOURCE_NOT_FOUND_OR_FORBIDDEN: "A fonte normativa não foi encontrada ou não está autorizada para esta organização.",
  PGC_SOURCE_REVIEW_NOTE_REQUIRED: "Indique o motivo da divergência ou rejeição da fonte normativa.",
  PGC_ACCOUNT_NOT_FOUND_OR_FORBIDDEN: "A conta normativa não foi encontrada ou não está autorizada para esta organização.",
  PGC_ACCOUNT_NOT_REVIEWABLE: "A conta não está no estado correcto para revisão.",
};

export function normativeErrorLabel(message: string) {
  return labels[message] ?? "Não foi possível concluir a revisão normativa. Verifique a sessão, a organização e o estado da versão.";
}
