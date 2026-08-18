import * as XLSX from "xlsx";

export type FiscalImportKind = "counterparties" | "products" | "documents";
export type FiscalImportRow = Record<string, unknown>;
export type FiscalImportError = { row: number; field: string; message: string };

const NIF_PATTERN = /^\d{9,15}$/;
const IVA_REGIMES = new Set(["GERAL", "SIMPLIFICADO", "EXCLUSAO"]);
const CURRENCIES = new Set(["AOA"]);

function text(value: unknown) { return String(value ?? "").trim(); }
function numberValue(value: unknown) { const parsed = Number(String(value ?? "").replace(/\s/g, "").replace(/,/g, ".")); return Number.isFinite(parsed) ? parsed : NaN; }
function parseStructuredArray(value: unknown) { if (Array.isArray(value)) return value as FiscalImportRow[]; if (!text(value)) return []; try { const parsed = JSON.parse(text(value)); return Array.isArray(parsed) ? parsed as FiscalImportRow[] : []; } catch { return []; } }
export function validateInvoiceReviewRow(row: FiscalImportRow, line: number) {
  const errors: FiscalImportError[] = [];
  const items = parseStructuredArray(row.lines ?? row.linesJson ?? row.items ?? row.itemsJson);
  if (!items.length) errors.push({ row: line, field: "lines", message: "A factura deve conter pelo menos uma linha" });
  let lineNet = 0, lineTax = 0, lineTotal = 0;
  items.forEach((item, index) => {
    const field = `lines[${index}]`;
    if (!text(item.description)) errors.push({ row: line, field: `${field}.description`, message: "Descrição da linha obrigatória" });
    const quantity = numberValue(item.quantity), unitPrice = numberValue(item.unitPrice), net = numberValue(item.netAmount), tax = numberValue(item.taxAmount), total = numberValue(item.totalAmount);
    if (!Number.isFinite(quantity) || quantity <= 0) errors.push({ row: line, field: `${field}.quantity`, message: "Quantidade deve ser positiva" });
    if (!Number.isFinite(unitPrice) || unitPrice < 0) errors.push({ row: line, field: `${field}.unitPrice`, message: "Preço unitário inválido" });
    if (![net, tax, total].every(Number.isFinite) || net < 0 || tax < 0 || total < 0) errors.push({ row: line, field, message: "Valores da linha inválidos" });
    if ([net, tax, total].every(Number.isFinite) && Math.abs(net + tax - total) > 0.01) errors.push({ row: line, field: `${field}.totalAmount`, message: "Total da linha deve reconciliar com líquido + imposto" });
    if (Number.isFinite(net)) lineNet += net;
    if (Number.isFinite(tax)) lineTax += tax;
    if (Number.isFinite(total)) lineTotal += total;
  });
  const headerNet = numberValue(row.netAmount), headerTax = numberValue(row.taxAmount), headerTotal = numberValue(row.totalAmount);
  if ([headerNet, headerTax, headerTotal].every(Number.isFinite)) {
    if (Math.abs(lineNet - headerNet) > 0.01) errors.push({ row: line, field: "netAmount", message: "Líquido do cabeçalho não reconcilia com as linhas" });
    if (Math.abs(lineTax - headerTax) > 0.01) errors.push({ row: line, field: "taxAmount", message: "Imposto do cabeçalho não reconcilia com as linhas" });
    if (Math.abs(lineTotal - headerTotal) > 0.01) errors.push({ row: line, field: "totalAmount", message: "Total do cabeçalho não reconcilia com as linhas" });
  }
  const taxes = parseStructuredArray(row.taxes ?? row.taxesJson);
  if (taxes.length) { const taxSum = taxes.reduce((sum, tax) => sum + (Number.isFinite(numberValue(tax.amount ?? tax.taxAmount)) ? numberValue(tax.amount ?? tax.taxAmount) : 0), 0); if (Number.isFinite(headerTax) && Math.abs(taxSum - headerTax) > 0.01) errors.push({ row: line, field: "taxes", message: "Soma dos impostos não reconcilia com taxAmount" }); }
  return errors;
}

const ANON_PLACEHOLDER = /^(anon|an[oó]nimo|teste|test|exemplo|sample|redacted|masked|privado|xxx+|\*+|n\/a|na)$/i;
function isPlaceholder(value: unknown) { return ANON_PLACEHOLDER.test(text(value)); }
export function detectPotentialIdentifiers(rows: FiscalImportRow[]) {
  const findings: FiscalImportError[] = [];
  rows.forEach((row, index) => {
    const line = index + 2;
    for (const field of ["taxId", "nif", "customerTaxID", "supplierTaxID"]) {
      const value = text(row[field]);
      if (value && !isPlaceholder(value) && /^\d{9,15}$/.test(value)) findings.push({ row: line, field, message: "NIF potencialmente identificável; use ANON ou remova o valor antes do teste" });
    }
    for (const field of ["email", "customerEmail", "supplierEmail"]) {
      const value = text(row[field]);
      if (value && !isPlaceholder(value) && !/\.invalid$/i.test(value) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) findings.push({ row: line, field, message: "Email potencialmente identificável; substitua por exemplo.invalid ou remova" });
    }
    for (const field of ["phone", "customerPhone", "supplierPhone", "telefone"]) {
      const value = text(row[field]).replace(/[\s()+-]/g, "");
      if (value && !isPlaceholder(value) && /^\d{7,15}$/.test(value)) findings.push({ row: line, field, message: "Telefone potencialmente identificável; use ANON ou remova o valor" });
    }
  });
  return { safe: findings.length === 0, findings };
}

export function validateFiscalImport(kind: FiscalImportKind, rows: FiscalImportRow[]) {
  const errors: FiscalImportError[] = [];
  rows.forEach((row, index) => {
    const line = index + 2;
    if (kind === "counterparties") {
      if (!text(row.name)) errors.push({ row: line, field: "name", message: "Nome obrigatório" });
      if (text(row.taxId) && !isPlaceholder(row.taxId) && !NIF_PATTERN.test(text(row.taxId))) errors.push({ row: line, field: "taxId", message: "NIF deve conter entre 9 e 15 dígitos" });
      if (!text(row.kind) || !["CUSTOMER", "SUPPLIER"].includes(text(row.kind))) errors.push({ row: line, field: "kind", message: "Tipo deve ser CUSTOMER ou SUPPLIER" });
    }
    if (kind === "products") {
      if (!text(row.code)) errors.push({ row: line, field: "code", message: "Código obrigatório" });
      if (!text(row.name)) errors.push({ row: line, field: "name", message: "Nome obrigatório" });
      if (!text(row.kind) || !["GOOD", "SERVICE"].includes(text(row.kind))) errors.push({ row: line, field: "kind", message: "Tipo deve ser GOOD ou SERVICE" });
    }
    if (kind === "documents") {
      if (!text(row.documentNumber)) errors.push({ row: line, field: "documentNumber", message: "Número do documento obrigatório" });
      if (!text(row.documentType)) errors.push({ row: line, field: "documentType", message: "Tipo de documento obrigatório" });
      if (!CURRENCIES.has(text(row.currency).toUpperCase())) errors.push({ row: line, field: "currency", message: "A moeda de importação deve ser AOA" });
      if (!IVA_REGIMES.has(text(row.ivaRegime).toUpperCase())) errors.push({ row: line, field: "ivaRegime", message: "Regime IVA inválido para Angola" });
      for (const field of ["netAmount", "taxAmount", "totalAmount"]) if (!Number.isFinite(numberValue(row[field])) || numberValue(row[field]) < 0) errors.push({ row: line, field, message: "Valor monetário inválido ou negativo" });
      const net = numberValue(row.netAmount), tax = numberValue(row.taxAmount), total = numberValue(row.totalAmount);
      if (Number.isFinite(net) && Number.isFinite(tax) && Number.isFinite(total) && Math.abs(net + tax - total) > 0.01) errors.push({ row: line, field: "totalAmount", message: "Total deve reconciliar com líquido + imposto" });
      errors.push(...validateInvoiceReviewRow(row, line));
    }
  });
  const privacy = detectPotentialIdentifiers(rows);
  errors.push(...privacy.findings);
  return { valid: errors.length === 0, errors, acceptedRows: rows.length - new Set(errors.map((error) => error.row)).size, privacy };
}

export function exportFiscalCsv(rows: FiscalImportRow[]) {
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return [headers.map(escape).join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join("\n");
}

export function exportFiscalWorkbook(kind: FiscalImportKind, rows: FiscalImportRow[]) {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, sheet, kind.slice(0, 31));
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export function parseFiscalTabular(input: Buffer | string, fileName: string) {
  const workbook = XLSX.read(input, { type: typeof input === "string" ? "string" : "buffer", raw: false });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!firstSheet) throw new Error("FISCAL_IMPORT_SHEET_REQUIRED");
  return XLSX.utils.sheet_to_json<FiscalImportRow>(firstSheet, { defval: "" });
}
