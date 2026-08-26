import * as XLSX from "xlsx";
import { extractDocumentFieldsOffline } from "../saadi-documents";

export type DocumentKind = "FACTURA" | "RECIBO" | "BALANCETE" | "BALANCO" | "DRE" | "EXTRACTO_BANCARIO" | "IMAGEM" | "EXCEL" | "PDF" | "OUTRO";

export function classifyDocument(filename: string, mimeType: string, text = ""): DocumentKind {
  const name = `${filename} ${text}`.toUpperCase();
  if (/FACTURA|FATURA/.test(name)) return "FACTURA";
  if (/RECIBO/.test(name)) return "RECIBO";
  if (/BALANCETE/.test(name)) return "BALANCETE";
  if (/BALAN[CÇ]O/.test(name)) return "BALANCO";
  if (/DRE|DEMONSTRA[CÇ][AÃ]O DE RESULTADOS/.test(name)) return "DRE";
  if (/EXTRACTO|EXTRATO/.test(name)) return "EXTRACTO_BANCARIO";
  if (/spreadsheet|excel|xlsx|xls/.test(mimeType.toLowerCase()) || /\.(xlsx|xls|csv)$/i.test(filename)) return "EXCEL";
  if (/image|png|jpe?g|webp/.test(mimeType.toLowerCase()) || /\.(png|jpe?g|webp)$/i.test(filename)) return "IMAGEM";
  if (/pdf/.test(mimeType.toLowerCase()) || /\.pdf$/i.test(filename)) return "PDF";
  return "OUTRO";
}

export function extractSpreadsheetText(buffer: Buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true, raw: false });
  const sheets = workbook.SheetNames.slice(0, 20).map((name) => {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[name], { header: 1, raw: false, defval: "" }).slice(0, 500);
    return `Folha: ${name}\n${rows.map((row) => row.map((cell) => String(cell ?? "")).join(" | ")).join("\n")}`;
  });
  return sheets.join("\n\n").slice(0, 100_000);
}

export function extractStructuredDocument(input: { filename: string; mimeType: string; text?: string; spreadsheetBuffer?: Buffer }) {
  const text = input.spreadsheetBuffer ? extractSpreadsheetText(input.spreadsheetBuffer) : input.text ?? "";
  const kind = classifyDocument(input.filename, input.mimeType, text);
  const fields = extractDocumentFieldsOffline(text);
  return { ...fields, documentType: kind === "EXCEL" ? fields.documentType : kind, textLength: text.length, source: input.spreadsheetBuffer ? "EXCEL_LOCAL" : "TEXTO_LOCAL", requiresHumanValidation: true, onlineCalls: false };
}

export function buildDocumentIntelligenceWorkbook(rows: Array<{ field: string; value: string | number | null; confidence?: number; source?: string }>) {
  const sheet = XLSX.utils.json_to_sheet(rows.map((row) => ({ Campo: row.field, Valor: row.value ?? "", Confiança: row.confidence ?? 0, Origem: row.source ?? "EXTRACAO_HEURISTICA_LOCAL" })));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Extracção");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
