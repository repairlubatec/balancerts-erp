export type PostedLine = {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
};

export type JournalRow = PostedLine & {
  entryId: number;
  description: string;
  createdAt: Date;
  sourceDocumentId: number | null;
};

const money = (value: number) => Math.round(value * 100) / 100;

export function buildTrialBalance(lines: PostedLine[]) {
  const byAccount = new Map<string, { accountCode: string; accountName: string; debit: number; credit: number }>();
  for (const line of lines) {
    const current = byAccount.get(line.accountCode) ?? { accountCode: line.accountCode, accountName: line.accountName, debit: 0, credit: 0 };
    current.debit = money(current.debit + line.debit);
    current.credit = money(current.credit + line.credit);
    byAccount.set(line.accountCode, current);
  }
  const rows = Array.from(byAccount.values()).sort((a, b) => a.accountCode.localeCompare(b.accountCode));
  const debit = rows.reduce((sum, row) => sum + row.debit, 0);
  const credit = rows.reduce((sum, row) => sum + row.credit, 0);
  return { rows, totals: { debit: money(debit), credit: money(credit) }, reconciled: Math.abs(debit - credit) <= 0.005 };
}

export function buildJournal(rows: JournalRow[]) {
  const entries = [...rows].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.entryId - b.entryId);
  return { entries, totals: { debit: money(entries.reduce((sum, row) => sum + row.debit, 0)), credit: money(entries.reduce((sum, row) => sum + row.credit, 0)) } };
}

export function buildLedger(rows: JournalRow[], accountCode?: string) {
  const filtered = accountCode ? rows.filter((row) => row.accountCode === accountCode) : rows;
  const entries = [...filtered].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.entryId - b.entryId);
  let balance = 0;
  const movements = entries.map((row) => {
    balance = money(balance + row.debit - row.credit);
    return { ...row, balance };
  });
  return { accountCode: accountCode ?? null, entries: movements, closingBalance: money(balance) };
}

export function buildIncomeStatement(lines: PostedLine[]) {
  const rows = buildTrialBalance(lines).rows.filter((row) => row.accountCode.startsWith("6") || row.accountCode.startsWith("7"));
  const expenses = money(rows.filter((row) => row.accountCode.startsWith("6")).reduce((sum, row) => sum + row.debit - row.credit, 0));
  const revenue = money(rows.filter((row) => row.accountCode.startsWith("7")).reduce((sum, row) => sum + row.credit - row.debit, 0));
  return { rows, revenue, expenses, netIncome: money(revenue - expenses) };
}

export function buildBalanceSheet(lines: PostedLine[]) {
  const rows = buildTrialBalance(lines).rows;
  const assets = money(rows.filter((row) => row.accountCode.startsWith("1") || row.accountCode.startsWith("2")).reduce((sum, row) => sum + row.debit - row.credit, 0));
  const liabilities = money(rows.filter((row) => row.accountCode.startsWith("3") || row.accountCode.startsWith("4")).reduce((sum, row) => sum + row.credit - row.debit, 0));
  const equity = money(rows.filter((row) => row.accountCode.startsWith("5")).reduce((sum, row) => sum + row.credit - row.debit, 0));
  const netIncome = buildIncomeStatement(lines).netIncome;
  return { rows, assets, liabilities, equity: money(equity + netIncome), netIncome, reconciled: Math.abs(assets - liabilities - equity - netIncome) <= 0.005 };
}

export type VatDocumentRow = { status: string; ivaRegime: "GERAL" | "SIMPLIFICADO" | "EXCLUSAO"; netAmount: number; taxAmount: number; totalAmount: number };

export function buildVatSummary(documents: VatDocumentRow[]) {
  const groups = new Map<string, { regime: VatDocumentRow["ivaRegime"]; documentCount: number; netAmount: number; taxAmount: number; totalAmount: number }>();
  for (const document of documents) {
    const key = `${document.ivaRegime}:${document.status}`;
    const current = groups.get(key) ?? { regime: document.ivaRegime, documentCount: 0, netAmount: 0, taxAmount: 0, totalAmount: 0 };
    current.documentCount += 1;
    current.netAmount = money(current.netAmount + document.netAmount);
    current.taxAmount = money(current.taxAmount + document.taxAmount);
    current.totalAmount = money(current.totalAmount + document.totalAmount);
    groups.set(key, current);
  }
  const rows = Array.from(groups.entries()).map(([key, value]) => ({ key, ...value })).sort((a, b) => a.key.localeCompare(b.key));
  return { rows, totals: { netAmount: money(rows.reduce((sum, row) => sum + row.netAmount, 0)), taxAmount: money(rows.reduce((sum, row) => sum + row.taxAmount, 0)), totalAmount: money(rows.reduce((sum, row) => sum + row.totalAmount, 0)) }, reconciled: rows.every((row) => Math.abs(row.totalAmount - row.netAmount - row.taxAmount) <= 0.005 && !(row.regime === "EXCLUSAO" && Math.abs(row.taxAmount) > 0.01)) };
}

export type OpenItemRow = {
  id: number;
  partyName: string;
  documentNumber: string;
  issuedAt: Date;
  dueDate: Date;
  amount: number;
  settledAmount: number;
};

export type AgingBucket = "CURRENT" | "DAYS_1_30" | "DAYS_31_60" | "DAYS_61_90" | "OVER_90";

export function buildAgingReport(items: OpenItemRow[], asOf: Date) {
  const rows = items.map((item) => {
    const outstanding = money(Math.max(0, item.amount - item.settledAmount));
    const daysPastDue = Math.max(0, Math.floor((asOf.getTime() - item.dueDate.getTime()) / 86_400_000));
    const bucket: AgingBucket = daysPastDue === 0 ? "CURRENT" : daysPastDue <= 30 ? "DAYS_1_30" : daysPastDue <= 60 ? "DAYS_31_60" : daysPastDue <= 90 ? "DAYS_61_90" : "OVER_90";
    return { ...item, outstanding, daysPastDue, bucket };
  }).filter((row) => row.outstanding > 0).sort((a, b) => b.daysPastDue - a.daysPastDue || a.partyName.localeCompare(b.partyName));
  const totals = rows.reduce((acc, row) => { acc.outstanding = money(acc.outstanding + row.outstanding); acc.byBucket[row.bucket] = money(acc.byBucket[row.bucket] + row.outstanding); return acc; }, { outstanding: 0, byBucket: { CURRENT: 0, DAYS_1_30: 0, DAYS_31_60: 0, DAYS_61_90: 0, OVER_90: 0 } as Record<AgingBucket, number> });
  return { asOf, rows, totals };
}

export type FiscalRegisterRow = {
  documentId: number;
  documentNumber: string;
  issueDate: Date;
  customerNif: string | null;
  status: string;
  ivaRegime: VatDocumentRow["ivaRegime"];
  netAmount: number;
  taxAmount: number;
  totalAmount: number;
};

export function buildFiscalRegister(rows: FiscalRegisterRow[]) {
  const entries = [...rows].sort((a, b) => a.issueDate.getTime() - b.issueDate.getTime() || a.documentId - b.documentId);
  return { entries, totals: { netAmount: money(entries.reduce((sum, row) => sum + row.netAmount, 0)), taxAmount: money(entries.reduce((sum, row) => sum + row.taxAmount, 0)), totalAmount: money(entries.reduce((sum, row) => sum + row.totalAmount, 0)) }, reconciled: entries.every((row) => Math.abs(row.totalAmount - row.netAmount - row.taxAmount) <= 0.005 && !(row.ivaRegime === "EXCLUSAO" && Math.abs(row.taxAmount) > 0.01)) };
}

export type DocumentOriginRow = { id: number; status: "DRAFT" | "VALIDATED" | "ISSUED" | "ACCOUNTED" | "CANCELLED" };
export type JournalOriginRow = { entryId: number; sourceDocumentId: number | null };

export function buildDocumentOriginReconciliation(documents: DocumentOriginRow[], journalEntries: JournalOriginRow[]) {
  const requiredDocumentIds = new Set(documents.filter((document) => document.status === "ISSUED" || document.status === "ACCOUNTED").map((document) => document.id));
  const linkedDocumentIds = new Set(journalEntries.flatMap((entry) => entry.sourceDocumentId === null ? [] : [entry.sourceDocumentId]));
  const missingJournalDocumentIds = Array.from(requiredDocumentIds).filter((documentId) => !linkedDocumentIds.has(documentId));
  const orphanJournalEntryIds = journalEntries.filter((entry) => entry.sourceDocumentId !== null && !documents.some((document) => document.id === entry.sourceDocumentId)).map((entry) => entry.entryId);
  return { missingJournalDocumentIds, orphanJournalEntryIds, reconciled: missingJournalDocumentIds.length === 0 && orphanJournalEntryIds.length === 0 };
}

export function buildReportReconciliation(input: {
  trialBalance: ReturnType<typeof buildTrialBalance>;
  journal: ReturnType<typeof buildJournal>;
  balanceSheet: ReturnType<typeof buildBalanceSheet>;
  vatSummary: ReturnType<typeof buildVatSummary>;
  fiscalRegister: ReturnType<typeof buildFiscalRegister>;
}) {
  const checks = {
    trialBalance: input.trialBalance.reconciled,
    journal: Math.abs(input.journal.totals.debit - input.journal.totals.credit) <= 0.005,
    balanceSheet: input.balanceSheet.reconciled,
    vat: input.vatSummary.reconciled && Math.abs(input.vatSummary.totals.totalAmount - input.vatSummary.totals.netAmount - input.vatSummary.totals.taxAmount) <= 0.005,
    fiscalRegister: input.fiscalRegister.reconciled,
  };
  return { checks, reconciled: Object.values(checks).every(Boolean) };
}

export function buildCompleteReportReconciliation(input: Parameters<typeof buildReportReconciliation>[0] & { documentOrigin: ReturnType<typeof buildDocumentOriginReconciliation> }) {
  const aggregate = buildReportReconciliation(input);
  return { ...aggregate, documentOrigin: input.documentOrigin, reconciled: aggregate.reconciled && input.documentOrigin.reconciled };
}

export const SAFT_AO_NAMESPACE = "urn:OECD:StandardAuditFile-Tax:AO_1.01_01";
export const SAFT_AO_SCHEMA_VERSION = "1.01_01";

export type SaftCoverageInput = {
  companyName: string | null;
  nif: string | null;
  functionalCurrency: string | null;
  periodStart: Date | null;
  periodEnd: Date | null;
  accountCount: number;
  journalEntryCount: number;
  documentCount: number;
  customerCount: number;
  supplierCount: number;
  productCount: number;
  taxRuleCount: number;
};

export function assertSaftExportReady(readiness: ReturnType<typeof buildSaftReadiness>) {
  if (!readiness.ready || !readiness.submissionEligible) throw new Error(`SAFT_EXPORT_NOT_READY:${readiness.missing.join(",") || "AGT_VALIDATION_REQUIRED"}`);
  return true as const;
}

export function buildSaftReadiness(input: SaftCoverageInput) {
  const missing: string[] = [];
  if (!input.companyName) missing.push("HEADER_COMPANY_NAME");
  if (!input.nif) missing.push("HEADER_TAX_ID");
  if (!input.functionalCurrency) missing.push("HEADER_CURRENCY");
  if (!input.periodStart || !input.periodEnd) missing.push("HEADER_PERIOD");
  if (input.accountCount === 0) missing.push("MASTERFILES_ACCOUNTS");
  if (input.journalEntryCount === 0) missing.push("GENERAL_LEDGER_ENTRIES");
  if (input.documentCount === 0) missing.push("SOURCE_DOCUMENTS");
  if (input.customerCount === 0) missing.push("MASTERFILES_CUSTOMERS");
  if (input.supplierCount === 0) missing.push("MASTERFILES_SUPPLIERS");
  if (input.productCount === 0) missing.push("MASTERFILES_PRODUCTS");
  if (input.taxRuleCount === 0) missing.push("MASTERFILES_TAX_TABLES");
  const ready = missing.length === 0;
  return { format: "SAFTAO1.01_01", schemaVersion: SAFT_AO_SCHEMA_VERSION, namespace: SAFT_AO_NAMESPACE, ready, missing, exportBlockedReason: ready ? "AGT_VALIDATION_REQUIRED" : "MISSING_REQUIRED_ENTITIES", submissionEligible: false as const };
}
