const labels: Record<string, string> = {
  ACTIVE: "Activo",
  ACCOUNTED: "Contabilizado",
  ARCHIVED: "Arquivado",
  BLOCKED: "Bloqueado",
  CANCELLED: "Anulado",
  CASH: "Caixa",
  COMPLETED: "Concluído",
  CUSTOMER: "Cliente",
  DRAFT: "Rascunho",
  FAILED: "Falhou",
  GENERAL: "Geral",
  INVALID: "Inválido",
  ISSUED: "Emitido",
  PARTIAL: "Parcial",
  PENDING: "Pendente",
  PAYMENT: "Pagamento",
  payment: "Pagamento",
  PROCESSING: "Em processamento",
  PRODUCT: "Produto",
  READY: "Pronto",
  READY_TO_CONFIRM: "Pronto para confirmar",
  IN_REVIEW: "Em revisão",
  NEEDS_REVIEW: "Requer revisão",
  REQUIRES_REVIEW: "Requer revisão",
  VALIDATION_FAILED: "Falha de validação",
  RECEIPT: "Recebimento",
  RECONCILED: "Reconciliado",
  REJECTED: "Rejeitado",
  SERVICE: "Serviço",
  SIMPLIFIED: "Simplificado",
  SUPPLIER: "Fornecedor",
  UNRECONCILED: "Por reconciliar",
  VALID: "Válido",
  VALIDATED: "Validado",
  BANK: "Banco",
  IN: "Entrada",
  OUT: "Saída",
  DOCUMENT: "Documento",
  BUSINESS: "Operacional",
  TREASURY: "Tesouraria",
  TRANSACTION: "Movimento",
  NUMBER: "Número",
  RESERVED: "Reservado",
  SERIES: "Série",
  CREATED: "Criado",
  CANCEL: "Cancelamento",
  POSTED: "Publicado",
  SOURCE: "Origem",
  REQUIRES: "Requer",
  ENTRY: "Lançamento",
  AGT: "AGT",
  EXCLUSAO: "Exclusão",
};

export function presentationLabel(value: string | null | undefined): string {
  if (!value) return "—";
  if (labels[value]) return labels[value];
  if (value.includes("_")) {
    return value.split("_").map((token) => labels[token] ?? token.toLowerCase()).join(" ").replace(/^./, (character) => character.toUpperCase());
  }
  if (/[a-z][A-Z]/.test(value)) {
    return value.replace(/([a-z])([A-Z])/g, "$1 $2").split(" ").map((token) => labels[token.toUpperCase()] ?? token.toLowerCase()).join(" ").replace(/^./, (character) => character.toUpperCase());
  }
  return value;
}

export function statusLabel(value: string | null | undefined): string {
  return presentationLabel(value);
}

export function userFacingError(message: string | null | undefined): string {
  if (!message) return "Ocorreu um erro operacional.";
  const replacements: Array<[RegExp, string]> = [
    [/Input validation failed/gi, "Os dados indicados não são válidos"],
    [/UNAUTHORIZED/gi, "Sessão não autorizada"],
    [/FORBIDDEN/gi, "Operação não permitida para o seu perfil"],
    [/NOT_FOUND/gi, "Registo não encontrado"],
    [/DOCUMENT_REQUIRES_POSTED_ENTRY/gi, "O documento requer um lançamento contabilístico publicado"],
    [/DOCUMENT_TRANSITION_NOT_ALLOWED/gi, "A transição do documento não é permitida"],
    [/PERIOD_ALREADY_CLOSED/gi, "O período já está fechado"],
    [/PERIOD_NOT_FOUND/gi, "Período não encontrado"],
    [/DUPLICATE/gi, "Registo duplicado"],
    [/Too small: expected number to be greater than 0/gi, "Indique um número superior a zero"],
  ];
  return replacements.reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), message).replace(/\b[A-Z][A-Z0-9]+(?:_[A-Z0-9]+)+\b/g, (code) => presentationLabel(code));
}
