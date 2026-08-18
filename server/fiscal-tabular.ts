import * as XLSX from "xlsx";

export type FiscalImportKind = "counterparties" | "products" | "documents";
export type FiscalImportRow = Record<string, unknown>;
export type FiscalImportError = { row: number; field: string; message: string };

const NIF_PATTERN = /^\d{9,15}$/;
const IVA_REGIMES = new Set(["GERAL", "SIMPLIFICADO", "EXCLUSAO"]);
const CURRENCIES = new Set(["AOA"]);

function text(value: unknown) { return String(value ?? "").trim(); }
function numberValue(value: unknown) { const parsed = Number(String(value ?? "").replace(/\s/g, "").replace(/,/g, ".")); return Number.isFinite(parsed) ? parsed : NaN; }

export function validateFiscalImport(kind: FiscalImportKind, rows: FiscalImportRow[]) {
  const errors: FiscalImportError[] = [];
  rows.forEach((row, index) => {
    const line = index + 2;
    if (kind === "counterparties") {
      if (!text(row.name)) errors.push({ row: line, field: "name", message: "Nome obrigatório" });
      if (text(row.taxId) && !NIF_PATTERN.test(text(row.taxId))) errors.push({ row: line, field: "taxId", message: "NIF deve conter entre 9 e 15 dígitos" });
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
    }
  });
  return { valid: errors.length === 0, errors, acceptedRows: rows.length - new Set(errors.map((error) => error.row)).size };
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
