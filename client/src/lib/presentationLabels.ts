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
  SUBMITTED: "Submetida",
  APPROVED: "Aprovada",
  RECEIVED: "Recebida",
  PARTIALLY_RECEIVED: "Recebida parcialmente",
  PURCHASE_RECEIPT_REGISTERED: "Recepção de stock registada",
  PURCHASE_ORDER: "Encomenda de compra",
  PURCHASE_ORDER_CREATED: "Encomenda de compra criada",
  PURCHASE_ORDER_SUBMITTED: "Encomenda de compra submetida",
  PURCHASE_ORDER_APPROVED: "Encomenda de compra aprovada",
  PURCHASE_ORDER_RECEIVED: "Encomenda de compra recebida",
  PURCHASE_ORDER_CANCELLED: "Encomenda de compra anulada",
  PURCHASE_RECEIPT: "Recepção de stock",
  purchaseOrder: "Encomenda de compra",
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
  OPEN: "Aberto",
  EXCEPTION: "Excepção",
  DOCUMENT: "Documento",
  TREASURY: "Tesouraria",
  TRANSACTION: "Movimento",
  NUMBER: "Número",
  RESERVED: "Reservado",
  SERIES: "Série",
  COMPANY: "Empresa",
  COUNTERPARTY: "Contraparte",
  ACCOUNT: "Conta",
  CONFIGURATION: "Configuração",
  ACTIVATED: "Activada",
  UPDATED: "Actualizado",
  CASH_ACCOUNT: "Conta de caixa",
  BUSINESS: "Operacional",
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
  if (/^(ui-)?payment-\d+-\d+$/i.test(value)) return "Movimento de tesouraria";
  if (/^treasury-reconciliation:\d+$/i.test(value)) return "Reconciliação de tesouraria";
  if (value === "documentSeries") return "Série documental";
  if (value === "treasuryTransaction") return "Movimento de tesouraria";
  if (value === "company") return "Empresa";
  if (value === "counterparty") return "Contraparte";
  if (value === "cashAccount") return "Conta de caixa";
  if (value === "businessDocument" || value === "operationalDocument") return "Documento operacional";
  if (/^document:/i.test(value)) return "Documento operacional";
  if (/^company:/i.test(value)) return "Empresa";
  if (/^counterparty:/i.test(value)) return "Contraparte";
  if (/^cash-account:/i.test(value)) return "Conta de caixa";
  if (/^\d+:FT:\d+$/i.test(value)) return "Reserva de numeração";
  if (/^cleanup-/i.test(value)) return "Limpeza operacional";
  if (/^manual-test-/i.test(value)) return "Teste operacional";
  if (value === "stockMovement") return "Movimento de stock";
  if (value === "purchaseOrder") return "Encomenda de compra";
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
  const technicalLabels: Array<[RegExp, string]> = [
    [/^(ui-)?payment-\d+-\d+$/i, "Movimento de tesouraria"],
    [/^treasury-reconciliation:\d+$/i, "Reconciliação de tesouraria"],
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
  return technicalLabels.reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), message).replace(/\b[A-Z][A-Z0-9]+(?:_[A-Z0-9]+)+\b/g, (code) => presentationLabel(code));
}
