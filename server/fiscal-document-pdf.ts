import PDFDocument from "pdfkit";
import { createHash } from "node:crypto";
import { generateAgtQrCodeDataUrl, buildAgtQrUrl } from "./agt-qrcode";

export type FiscalPdfCompany = { name: string; nif: string; address?: string; email?: string; phone?: string };
export type FiscalPdfLine = { description: string; quantity: string | number; unitPrice: string | number; netAmount: string | number; taxAmount: string | number; totalAmount: string | number };
export type FiscalPdfInput = { company: FiscalPdfCompany; document: { documentNumber: string; documentType: string; status: string; currency: string; ivaRegime: string; netAmount: string | number; taxAmount: string | number; totalAmount: string | number; issuedAt?: Date | string | null; immutableHash?: string | null }; counterparty?: { name: string; taxId?: string | null; address?: string | null }; lines: FiscalPdfLine[] };

function money(value: string | number, currency: string) { return `${Number(value).toFixed(2)} ${currency}`; }
function dataUrlToBuffer(value: string) { return Buffer.from(value.replace(/^data:image\/png;base64,/, ""), "base64"); }

export async function buildFiscalDocumentPdf(input: FiscalPdfInput) {
  const qrDataUrl = await generateAgtQrCodeDataUrl({ issuerNif: input.company.nif, documentNo: input.document.documentNumber });
  const qrUrl = buildAgtQrUrl({ issuerNif: input.company.nif, documentNo: input.document.documentNumber });
  const canonical = JSON.stringify({ company: input.company, document: input.document, counterparty: input.counterparty ?? null, lines: input.lines });
  const hash = input.document.immutableHash ?? createHash("sha256").update(canonical, "utf8").digest("hex");
  const pdf = new PDFDocument({ size: "A4", margin: 42 });
  const chunks: Buffer[] = [];
  pdf.on("data", (chunk: Buffer) => chunks.push(chunk));
  const finished = new Promise<Buffer>((resolve, reject) => { pdf.on("end", () => resolve(Buffer.concat(chunks))); pdf.on("error", reject); });
  pdf.fontSize(18).fillColor("#102a43").text("BALANCERTS.ERP", { continued: true }).fontSize(9).fillColor("#477514").text("  PREPARAÇÃO FISCAL");
  pdf.moveDown(0.4).fontSize(9).fillColor("#333333").text(input.company.name).text(`NIF: ${input.company.nif}`).text(input.company.address ?? "").text([input.company.email, input.company.phone].filter(Boolean).join(" · "));
  pdf.moveDown().strokeColor("#1267d6").lineWidth(1).moveTo(42, pdf.y).lineTo(553, pdf.y).stroke();
  pdf.moveDown().fontSize(16).fillColor("#102a43").text(`${input.document.documentType} ${input.document.documentNumber}`);
  pdf.fontSize(9).fillColor("#555555").text(`Estado interno: ${input.document.status} · Regime IVA: ${input.document.ivaRegime} · Data: ${input.document.issuedAt ? new Date(input.document.issuedAt).toLocaleString("pt-PT") : "não emitido"}`);
  if (input.counterparty) pdf.moveDown().fontSize(10).fillColor("#102a43").text(`Adquirente: ${input.counterparty.name}${input.counterparty.taxId ? ` · NIF ${input.counterparty.taxId}` : ""}`).fontSize(9).fillColor("#555555").text(input.counterparty.address ?? "");
  pdf.moveDown().fontSize(9).fillColor("#102a43").text("Descrição", 42, pdf.y, { width: 220 }).text("Qtd.", 270, pdf.y - 10, { width: 55 }).text("Preço", 330, pdf.y - 10, { width: 70 }).text("Total", 430, pdf.y - 10, { width: 90 });
  pdf.moveDown(0.5).strokeColor("#dbe5f1").moveTo(42, pdf.y).lineTo(553, pdf.y).stroke();
  for (const line of input.lines) { pdf.moveDown(0.4).fontSize(9).fillColor("#333333").text(line.description, 42, pdf.y, { width: 220 }).text(String(line.quantity), 270, pdf.y - 10, { width: 55 }).text(money(line.unitPrice, input.document.currency), 330, pdf.y - 10, { width: 90 }).text(money(line.totalAmount, input.document.currency), 430, pdf.y - 10, { width: 90 }); }
  pdf.moveDown(1).fontSize(10).fillColor("#102a43").text(`Subtotal: ${money(input.document.netAmount, input.document.currency)}`, { align: "right" }).text(`Imposto: ${money(input.document.taxAmount, input.document.currency)}`, { align: "right" }).fontSize(13).text(`Total: ${money(input.document.totalAmount, input.document.currency)}`, { align: "right" });
  pdf.moveDown(1).fontSize(8).fillColor("#6b7280").text("DOCUMENTO DE PREPARAÇÃO INTERNA — NÃO CERTIFICADO/HOMOLOGADO PELA AGT.");
  pdf.text(`Hash SHA-256: ${hash}`, { width: 360 });
  pdf.text(`Consulta QR: ${qrUrl}`, { width: 360 });
  pdf.image(dataUrlToBuffer(qrDataUrl), 430, Math.max(500, pdf.y - 80), { fit: [100, 100] });
  pdf.end();
  const buffer = await finished;
  return { buffer, hash, qrUrl, certified: false as const, mimeType: "application/pdf" as const };
}
