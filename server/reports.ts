import path from "node:path";
import { validateXML } from "xsd-schema-validator";
import { validateSaftAoSemantics } from "./saftSemantic";

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
  costCenter?: string | null;
  analyticalDimension?: string | null;
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
  normativeRuleIds?: number[];
  normativeRuleVersions?: string[];
  legalReferences?: string[];
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
  const orphanJournalEntryIds = Array.from(new Set(journalEntries.filter((entry) => entry.sourceDocumentId !== null && !documents.some((document) => document.id === entry.sourceDocumentId)).map((entry) => entry.entryId)));
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
export const SAFT_AO_XSD_PATH = path.resolve(process.cwd(), "docs", "SAFTAO1.01_01.xsd");

export type SaftXsdValidationResult = {
  valid: boolean;
  validator: "xsd-schema-validator";
  schemaPath: string;
  messages: string[];
};

export async function validateSaftAoXmlAgainstXsd(xml: string, schemaPath = SAFT_AO_XSD_PATH): Promise<SaftXsdValidationResult> {
  try {
    const result = await validateXML(xml, schemaPath);
    return { valid: result.valid, validator: "xsd-schema-validator", schemaPath, messages: result.messages ?? [] };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { valid: false, validator: "xsd-schema-validator", schemaPath, messages: [`XSD_VALIDATION_RUNTIME_ERROR:${message}`] };
  }
}

export function assertSaftXsdValid(validation: SaftXsdValidationResult) {
  if (!validation.valid) throw new Error(`SAFT_XSD_INVALID:${validation.messages.join(" | ") || "SCHEMA_VALIDATION_FAILED"}`);
  return true as const;
}

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
  const counts = {
    accounts: input.accountCount,
    journalEntries: input.journalEntryCount,
    documents: input.documentCount,
    customers: input.customerCount,
    suppliers: input.supplierCount,
    products: input.productCount,
    taxRules: input.taxRuleCount,
  };
  return { format: "SAFTAO1.01_01", schemaVersion: SAFT_AO_SCHEMA_VERSION, namespace: SAFT_AO_NAMESPACE, ready, missing, counts, exportBlockedReason: ready ? "AGT_VALIDATION_REQUIRED" : "MISSING_REQUIRED_ENTITIES", submissionEligible: false as const };
}


export type SaftLocalPackageManifest = {
  format: "SAFTAO1.01_01";
  schemaVersion: string;
  namespace: string;
  generatedAt: string;
  readiness: ReturnType<typeof buildSaftReadiness>;
  submissionEligible: false;
  externalSubmission: "NOT_CONFIGURED";
  contentHash: string;
};

export function buildSaftLocalPackageManifest(readiness: ReturnType<typeof buildSaftReadiness>, contentHash: string, generatedAt = new Date()) : SaftLocalPackageManifest {
  return { format: "SAFTAO1.01_01", schemaVersion: readiness.schemaVersion, namespace: readiness.namespace, generatedAt: generatedAt.toISOString(), readiness, submissionEligible: false, externalSubmission: "NOT_CONFIGURED", contentHash };
}

export type SaftAoAccount = { id: number; code: string; description: string; parentCode?: string | null; postable: boolean; openingDebit?: number; openingCredit?: number; closingDebit?: number; closingCredit?: number; groupingCategory?: "GR" | "GA" | "GM" | "AR" | "AA" | "AM" };
export type SaftAoJournalLine = { accountCode: string; debit: number; credit: number; recordId?: string; sourceDocumentId?: number | null };
export type SaftAoJournalEntry = { id: number; transactionDate: Date; description: string; sourceDocumentId?: number | null; customerId?: string | null; supplierId?: string | null; lines: SaftAoJournalLine[] };
export type SaftAoSourceDocument = { id: number; documentNumber: string; documentType: string; status: string; issueDate: Date; customerName?: string | null; customerNif?: string | null; netAmount: number; taxAmount: number; totalAmount: number; ivaRegime: string; productCode?: string; productDescription?: string; hash?: string; hashControl?: string };
export type SaftAoExportInput = {
  companyName: string;
  nif: string;
  companyId?: string;
  address?: string | null;
  municipality?: string | null;
  province?: string | null;
  functionalCurrency: string;
  periodStart: Date;
  periodEnd: Date;
  accounts: SaftAoAccount[];
  journalEntries: SaftAoJournalEntry[];
  sourceDocuments: SaftAoSourceDocument[];
  productCompanyTaxId?: string;
  softwareValidationNumber?: string;
  productId?: string;
  productVersion?: string;
  dateCreated?: Date;
  semanticMode?: "ENFORCE" | "REPORT_ONLY";
};

function xmlEscape(value: string | number | null | undefined) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;"); }
function xmlDate(value: Date) { return value.toISOString().slice(0, 10); }
function xmlDateTime(value: Date) { return value.toISOString(); }
function xmlDecimal(value: number | undefined) { return Number(value ?? 0).toFixed(2); }
function customerIdFor(document: SaftAoSourceDocument) { return `C${document.id}`; }
function sourceDocumentStatus(status: string) { return status === "CANCELLED" ? "A" : "N"; }
function sourceBilling() { return "P"; }

export function buildSaftAoXml(input: SaftAoExportInput) {
  const semanticValidation = validateSaftAoSemantics({
    functionalCurrency: input.functionalCurrency,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    accounts: input.accounts.map((account) => ({ code: account.code, postable: account.postable })),
    journalEntries: input.journalEntries.map((entry) => ({
      id: entry.id,
      transactionDate: entry.transactionDate,
      lines: entry.lines.map((line) => ({ accountCode: line.accountCode, debit: line.debit, credit: line.credit })),
    })),
    sourceDocuments: input.sourceDocuments.map((document) => ({
      documentNumber: document.documentNumber,
      documentType: document.documentType,
      issueDate: document.issueDate,
      netAmount: document.netAmount,
      taxAmount: document.taxAmount,
      totalAmount: document.totalAmount,
      ivaRegime: document.ivaRegime === "GERAL" || document.ivaRegime === "SIMPLIFICADO" ? document.ivaRegime : "EXCLUSAO",
    })),
  });
  if (!semanticValidation.valid && (input.semanticMode ?? "ENFORCE") === "ENFORCE") {
    throw new Error(`SAFT_SEMANTIC_INVALID:${semanticValidation.issues.map((issue) => issue.code).join(",")}`);
  }
  const accounts = [...input.accounts].sort((a, b) => a.code.localeCompare(b.code));
  const entries = [...input.journalEntries].sort((a, b) => a.id - b.id);
  const documents = [...input.sourceDocuments].sort((a, b) => a.id - b.id);
  const accountXml = accounts.map((account) => `<Account><AccountID>${xmlEscape(account.code)}</AccountID><AccountDescription>${xmlEscape(account.description)}</AccountDescription><OpeningDebitBalance>${xmlDecimal(account.openingDebit)}</OpeningDebitBalance><OpeningCreditBalance>${xmlDecimal(account.openingCredit)}</OpeningCreditBalance><ClosingDebitBalance>${xmlDecimal(account.closingDebit)}</ClosingDebitBalance><ClosingCreditBalance>${xmlDecimal(account.closingCredit)}</ClosingCreditBalance><GroupingCategory>${account.groupingCategory ?? (account.postable ? "GM" : "GA")}</GroupingCategory>${account.parentCode ? `<GroupingCode>${xmlEscape(account.parentCode)}</GroupingCode>` : ""}</Account>`).join("");
  const customerDocs = documents.filter((document, index, all) => all.findIndex((candidate) => customerIdFor(candidate) === customerIdFor(document)) === index);
  const customerXml = customerDocs.map((document) => `<Customer><CustomerID>${customerIdFor(document)}</CustomerID><AccountID>211</AccountID><CustomerTaxID>${xmlEscape(document.customerNif ?? "9999999999")}</CustomerTaxID><CompanyName>${xmlEscape(document.customerName ?? "CONSUMIDOR FINAL")}</CompanyName><BillingAddress><AddressDetail>${xmlEscape(input.address ?? "N/A")}</AddressDetail><City>${xmlEscape(input.municipality ?? "Lubango")}</City><Country>AO</Country></BillingAddress><SelfBillingIndicator>0</SelfBillingIndicator></Customer>`).join("");
  const productXml = `<Product><ProductType>S</ProductType><ProductCode>SERVICE</ProductCode><ProductDescription>Serviço</ProductDescription><ProductNumberCode>SERVICE</ProductNumberCode></Product>`;
  const taxXml = `<TaxTable><TaxTableEntry><TaxType>IVA</TaxType><TaxCode>${documents.some((document) => Math.abs(document.taxAmount) > 0.01) ? "NOR" : "ISE"}</TaxCode><Description>IVA</Description><TaxPercentage>0</TaxPercentage></TaxTableEntry></TaxTable>`;
  const entryXml = entries.map((entry) => { const debitLines = entry.lines.filter((line) => line.debit > 0).map((line, index) => `<DebitLine><RecordID>${xmlEscape(line.recordId ?? `${entry.id}-D${index + 1}`)}</RecordID><AccountID>${xmlEscape(line.accountCode)}</AccountID>${entry.sourceDocumentId ? `<SourceDocumentID>${entry.sourceDocumentId}</SourceDocumentID>` : ""}<SystemEntryDate>${xmlDateTime(entry.transactionDate)}</SystemEntryDate><Description>${xmlEscape(entry.description)}</Description><DebitAmount>${xmlDecimal(line.debit)}</DebitAmount></DebitLine>`).join(""); const creditLines = entry.lines.filter((line) => line.credit > 0).map((line, index) => `<CreditLine><RecordID>${xmlEscape(line.recordId ?? `${entry.id}-C${index + 1}`)}</RecordID><AccountID>${xmlEscape(line.accountCode)}</AccountID>${entry.sourceDocumentId ? `<SourceDocumentID>${entry.sourceDocumentId}</SourceDocumentID>` : ""}<SystemEntryDate>${xmlDateTime(entry.transactionDate)}</SystemEntryDate><Description>${xmlEscape(entry.description)}</Description><CreditAmount>${xmlDecimal(line.credit)}</CreditAmount></CreditLine>`).join(""); return `<Journal><JournalID>1</JournalID><Description>Diário geral</Description><Transaction><TransactionID>${xmlDate(entry.transactionDate)} BALANCERTS ${entry.id}</TransactionID><Period>${input.periodStart.getUTCMonth() + 1}</Period><TransactionDate>${xmlDate(entry.transactionDate)}</TransactionDate><SourceID>${xmlEscape(`BALANCERTS:${entry.id}`)}</SourceID><Description>${xmlEscape(entry.description)}</Description><DocArchivalNumber>${xmlEscape(`DOC:${entry.id}`)}</DocArchivalNumber><TransactionType>N</TransactionType><GLPostingDate>${xmlDate(entry.transactionDate)}</GLPostingDate>${entry.customerId ? `<CustomerID>${xmlEscape(entry.customerId)}</CustomerID>` : entry.supplierId ? `<SupplierID>${xmlEscape(entry.supplierId)}</SupplierID>` : ""}<Lines>${debitLines}${creditLines}</Lines></Transaction></Journal>`; }).join("");
  const documentXml = documents.map((document) => { const customerId = customerIdFor(document); const invoiceType = ["FT", "FR", "GF", "FG", "AC", "AR", "ND", "NC", "AF", "TV"].includes(document.documentType) ? document.documentType : "FT"; const taxCode = Math.abs(document.taxAmount) > 0.01 ? "NOR" : "ISE"; const hash = document.hash ?? "PENDING-HASH"; const lineTax = Math.abs(document.taxAmount) > 0.01 ? `<Tax><TaxType>IVA</TaxType><TaxCode>${taxCode}</TaxCode><TaxPercentage>0</TaxPercentage></Tax>` : `<Tax><TaxType>NS</TaxType><TaxCode>NS</TaxCode><TaxAmount>0.00</TaxAmount></Tax>`; return `<Invoice><InvoiceNo>${xmlEscape(document.documentNumber)}</InvoiceNo><DocumentStatus><InvoiceStatus>${sourceDocumentStatus(document.status)}</InvoiceStatus><InvoiceStatusDate>${xmlDateTime(document.issueDate)}</InvoiceStatusDate><SourceID>${xmlEscape(`BALANCERTS:${document.id}`)}</SourceID><SourceBilling>${sourceBilling()}</SourceBilling></DocumentStatus><Hash>${xmlEscape(hash)}</Hash><HashControl>${xmlEscape(document.hashControl ?? "PENDING")}</HashControl><InvoiceDate>${xmlDate(document.issueDate)}</InvoiceDate><InvoiceType>${invoiceType}</InvoiceType><SpecialRegimes><SelfBillingIndicator>0</SelfBillingIndicator><CashVATSchemeIndicator>0</CashVATSchemeIndicator><ThirdPartiesBillingIndicator>0</ThirdPartiesBillingIndicator></SpecialRegimes><SourceID>${xmlEscape(`BALANCERTS:${document.id}`)}</SourceID><SystemEntryDate>${xmlDateTime(document.issueDate)}</SystemEntryDate><CustomerID>${customerId}</CustomerID><Line><LineNumber>1</LineNumber><ProductCode>${xmlEscape(document.productCode ?? "SERVICE")}</ProductCode><ProductDescription>${xmlEscape(document.productDescription ?? "Serviço")}</ProductDescription><Quantity>1</Quantity><UnitOfMeasure>UN</UnitOfMeasure><UnitPrice>${xmlDecimal(document.netAmount)}</UnitPrice><TaxPointDate>${xmlDate(document.issueDate)}</TaxPointDate><Description>${xmlEscape(document.productDescription ?? "Serviço")}</Description><DebitAmount>${xmlDecimal(document.netAmount)}</DebitAmount>${lineTax}</Line><DocumentTotals><TaxPayable>${xmlDecimal(document.taxAmount)}</TaxPayable><NetTotal>${xmlDecimal(document.netAmount)}</NetTotal><GrossTotal>${xmlDecimal(document.totalAmount)}</GrossTotal></DocumentTotals></Invoice>`; }).join("");
  const totalDebit = entries.reduce((sum, entry) => sum + entry.lines.reduce((lineSum, line) => lineSum + line.debit, 0), 0);
  const totalCredit = entries.reduce((sum, entry) => sum + entry.lines.reduce((lineSum, line) => lineSum + line.credit, 0), 0);
  const header = `<Header><AuditFileVersion>${SAFT_AO_SCHEMA_VERSION}</AuditFileVersion><CompanyID>${xmlEscape(input.companyId ?? input.nif)}</CompanyID><TaxRegistrationNumber>${xmlEscape(input.nif)}</TaxRegistrationNumber><TaxAccountingBasis>F</TaxAccountingBasis><CompanyName>${xmlEscape(input.companyName)}</CompanyName><CompanyAddress><AddressDetail>${xmlEscape(input.address ?? "N/A")}</AddressDetail><City>${xmlEscape(input.municipality ?? "Lubango")}</City><Country>AO</Country></CompanyAddress><FiscalYear>${input.periodStart.getUTCFullYear()}</FiscalYear><StartDate>${xmlDate(input.periodStart)}</StartDate><EndDate>${xmlDate(input.periodEnd)}</EndDate><CurrencyCode>${xmlEscape(input.functionalCurrency)}</CurrencyCode><DateCreated>${xmlDate(input.dateCreated ?? new Date())}</DateCreated><TaxEntity>Sede</TaxEntity><ProductCompanyTaxID>${xmlEscape(input.productCompanyTaxId ?? "0000000000")}</ProductCompanyTaxID><SoftwareValidationNumber>${xmlEscape(input.softwareValidationNumber ?? "0")}</SoftwareValidationNumber><ProductID>${xmlEscape(input.productId ?? "BALANCERTS.ERP/BALANCERTS")}</ProductID><ProductVersion>${xmlEscape(input.productVersion ?? "1.0.0")}</ProductVersion></Header>`;
  return `<?xml version="1.0" encoding="UTF-8"?>\n<AuditFile xmlns="${SAFT_AO_NAMESPACE}" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="${SAFT_AO_NAMESPACE} SAFTAO1.01_01.xsd">${header}<MasterFiles><GeneralLedgerAccounts>${accountXml}</GeneralLedgerAccounts>${customerXml ? `<Customer>${customerXml.slice("<Customer>".length, -"</Customer>".length)}</Customer>` : ""}${productXml}${taxXml}</MasterFiles><GeneralLedgerEntries><NumberOfEntries>${entries.length}</NumberOfEntries><TotalDebit>${xmlDecimal(totalDebit)}</TotalDebit><TotalCredit>${xmlDecimal(totalCredit)}</TotalCredit>${entryXml}</GeneralLedgerEntries><SourceDocuments><SalesInvoices><NumberOfEntries>${documents.length}</NumberOfEntries><TotalDebit>${xmlDecimal(documents.reduce((sum, document) => sum + document.totalAmount, 0))}</TotalDebit><TotalCredit>0.00</TotalCredit>${documentXml}</SalesInvoices></SourceDocuments></AuditFile>`;
}
