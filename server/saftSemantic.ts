export type SaftSemanticAccount = {
  code: string;
  postable: boolean;
};

export type SaftSemanticJournalLine = {
  accountCode: string;
  debit: number;
  credit: number;
};

export type SaftSemanticJournalEntry = {
  id: number;
  transactionDate: Date;
  lines: SaftSemanticJournalLine[];
};

export type SaftSemanticSourceDocument = {
  documentNumber: string;
  documentType: string;
  issueDate: Date;
  netAmount: number;
  taxAmount: number;
  totalAmount: number;
  ivaRegime: "GERAL" | "SIMPLIFICADO" | "EXCLUSAO";
};

export type SaftSemanticInput = {
  functionalCurrency: string;
  periodStart: Date;
  periodEnd: Date;
  accounts: SaftSemanticAccount[];
  journalEntries: SaftSemanticJournalEntry[];
  sourceDocuments: SaftSemanticSourceDocument[];
};

export type SaftSemanticIssue = {
  code:
    | "INVALID_PERIOD"
    | "INVALID_CURRENCY"
    | "DUPLICATE_ACCOUNT"
    | "UNKNOWN_ACCOUNT"
    | "NON_POSTABLE_ACCOUNT"
    | "NEGATIVE_AMOUNT"
    | "UNBALANCED_ENTRY"
    | "ENTRY_OUTSIDE_PERIOD"
    | "EMPTY_DOCUMENT_NUMBER"
    | "DOCUMENT_OUTSIDE_PERIOD"
    | "DOCUMENT_TOTAL_MISMATCH"
    | "EXCLUSAO_WITH_TAX";
  entity: string;
  message: string;
};

const EPSILON = 0.005;

function approximatelyEqual(left: number, right: number) {
  return Math.abs(left - right) <= EPSILON;
}

function isWithinPeriod(date: Date, start: Date, end: Date) {
  const timestamp = date.getTime();
  return Number.isFinite(timestamp) && timestamp >= start.getTime() && timestamp <= end.getTime();
}

export function validateSaftAoSemantics(input: SaftSemanticInput) {
  const issues: SaftSemanticIssue[] = [];
  const periodStart = input.periodStart.getTime();
  const periodEnd = input.periodEnd.getTime();

  if (!Number.isFinite(periodStart) || !Number.isFinite(periodEnd) || periodStart > periodEnd) {
    issues.push({ code: "INVALID_PERIOD", entity: "HEADER", message: "O período SAF-T é inválido." });
  }
  if (input.functionalCurrency !== "AOA") {
    issues.push({ code: "INVALID_CURRENCY", entity: "HEADER", message: "A moeda funcional do ficheiro deve ser AOA." });
  }

  const accountCodes = new Set<string>();
  for (const account of input.accounts) {
    if (accountCodes.has(account.code)) {
      issues.push({ code: "DUPLICATE_ACCOUNT", entity: account.code, message: `A conta ${account.code} está duplicada.` });
    }
    accountCodes.add(account.code);
  }

  for (const entry of input.journalEntries) {
    if (!isWithinPeriod(entry.transactionDate, input.periodStart, input.periodEnd)) {
      issues.push({ code: "ENTRY_OUTSIDE_PERIOD", entity: String(entry.id), message: "O lançamento está fora do período SAF-T." });
    }
    let debitTotal = 0;
    let creditTotal = 0;
    for (const line of entry.lines) {
      const account = input.accounts.find(candidate => candidate.code === line.accountCode);
      if (!account) {
        issues.push({ code: "UNKNOWN_ACCOUNT", entity: line.accountCode, message: `A conta ${line.accountCode} do lançamento não existe no plano exportado.` });
      } else if (!account.postable) {
        issues.push({ code: "NON_POSTABLE_ACCOUNT", entity: line.accountCode, message: `A conta ${line.accountCode} não é lançável.` });
      }
      if (line.debit < 0 || line.credit < 0) {
        issues.push({ code: "NEGATIVE_AMOUNT", entity: String(entry.id), message: "Um movimento contém valor negativo." });
      }
      debitTotal += line.debit;
      creditTotal += line.credit;
    }
    if (!approximatelyEqual(debitTotal, creditTotal)) {
      issues.push({ code: "UNBALANCED_ENTRY", entity: String(entry.id), message: "O lançamento não está equilibrado entre débito e crédito." });
    }
  }

  for (const document of input.sourceDocuments) {
    if (!document.documentNumber.trim()) {
      issues.push({ code: "EMPTY_DOCUMENT_NUMBER", entity: document.documentType, message: "O documento não tem número." });
    }
    if (!isWithinPeriod(document.issueDate, input.periodStart, input.periodEnd)) {
      issues.push({ code: "DOCUMENT_OUTSIDE_PERIOD", entity: document.documentNumber || document.documentType, message: "O documento está fora do período SAF-T." });
    }
    if (document.netAmount < 0 || document.taxAmount < 0 || document.totalAmount < 0) {
      issues.push({ code: "NEGATIVE_AMOUNT", entity: document.documentNumber, message: "O documento contém valor negativo." });
    }
    if (!approximatelyEqual(document.netAmount + document.taxAmount, document.totalAmount)) {
      issues.push({ code: "DOCUMENT_TOTAL_MISMATCH", entity: document.documentNumber, message: "O total do documento não corresponde à base mais imposto." });
    }
    if (document.ivaRegime === "EXCLUSAO" && document.taxAmount > EPSILON) {
      issues.push({ code: "EXCLUSAO_WITH_TAX", entity: document.documentNumber, message: "Uma operação em regime de exclusão não pode conter IVA liquidado." });
    }
  }

  return { valid: issues.length === 0, issues };
}
