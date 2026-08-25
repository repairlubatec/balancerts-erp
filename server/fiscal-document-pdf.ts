import PDFDocument from "pdfkit";
import { createHash } from "node:crypto";
import { generateAgtQrCodeDataUrl, buildAgtQrUrl } from "./agt-qrcode";

export type FiscalPdfCompany = { name: string; nif: string; address?: string; email?: string; phone?: string };
export type FiscalPdfLine = { description: string; quantity: string | number; unitPrice: string | number; netAmount: string | number; taxAmount: string | number; totalAmount: string | number };
export type FiscalPdfPresentation = { logoBuffer?: Buffer; paperSize?: "A4" | "A5" | "TALAO_80MM"; orientation?: "PORTRAIT" | "LANDSCAPE"; marginMm?: number; scalePercent?: number };
export type FiscalPdfInput = { company: FiscalPdfCompany; document: { documentNumber: string; documentType: string; status: string; currency: string; ivaRegime: string; netAmount: string | number; taxAmount: string | number; totalAmount: string | number; issuedAt?: Date | string | null; immutableHash?: string | null }; counterparty?: { name: string; taxId?: string | null; address?: string | null }; lines: FiscalPdfLine[]; presentation?: FiscalPdfPresentation };

function money(value: string | number, currency: string) { return `${Number(value).toFixed(2)} ${currency}`; }
function dataUrlToBuffer(value: string) { return Buffer.from(value.replace(/^data:image\/png;base64,/, ""), "base64"); }
export const BALANCERTS_COPYRIGHT = "Copyright © Repair Lubatec";
const OFFICIAL_AGT_LOGO_URL = "https://portaldoparceiro.minfin.gov.ao/doc-agt/faturacao-electronica/1/_attachments/logo.png";
async function loadOfficialAgtLogo() {
  try {
    const response = await fetch(OFFICIAL_AGT_LOGO_URL, { signal: AbortSignal.timeout(2500) });
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
}

export async function buildFiscalDocumentPdf(input: FiscalPdfInput) {
  const qrDataUrl = await generateAgtQrCodeDataUrl({ issuerNif: input.company.nif, documentNo: input.document.documentNumber });
  const qrUrl = buildAgtQrUrl({ issuerNif: input.company.nif, documentNo: input.document.documentNumber });
  const canonical = JSON.stringify({ company: input.company, document: input.document, counterparty: input.counterparty ?? null, lines: input.lines });
  const hash = input.document.immutableHash ?? createHash("sha256").update(canonical, "utf8").digest("hex");
  const presentation = input.presentation ?? {};
  const margin = Math.max(0, Math.min(40, presentation.marginMm ?? 12)) * 2.83465;
  const pdfSize = presentation.paperSize === "A5" ? "A5" : presentation.paperSize === "TALAO_80MM" ? [226, 842] as [number, number] : "A4";
  const pdf = new PDFDocument({ size: pdfSize, layout: presentation.orientation === "LANDSCAPE" ? "landscape" : "portrait", margin });
  const chunks: Buffer[] = [];
  pdf.on("data", (chunk: Buffer) => chunks.push(chunk));
  const finished = new Promise<Buffer>((resolve, reject) => { pdf.on("end", () => resolve(Buffer.concat(chunks))); pdf.on("error", reject); });
  if (presentation.logoBuffer) pdf.image(presentation.logoBuffer, pdf.page.margins.left, pdf.page.margins.top, { fit: [120, 54] });
  const headerX = presentation.logoBuffer ? pdf.page.margins.left + 132 : pdf.page.margins.left;
  pdf.fontSize(18).fillColor("#102a43").text("BALANCERTS.ERP", headerX, pdf.page.margins.top, { continued: true }).fontSize(9).fillColor("#477514").text("  PREPARAÇÃO FISCAL");
  pdf.moveDown(0.4).fontSize(9).fillColor("#333333").text(input.company.name).text(`NIF: ${input.company.nif}`).text(input.company.address ?? "").text([input.company.email, input.company.phone].filter(Boolean).join(" · "));
  pdf.moveDown().strokeColor("#1267d6").lineWidth(1).moveTo(pdf.page.margins.left, pdf.y).lineTo(pdf.page.width - pdf.page.margins.right, pdf.y).stroke();
  pdf.moveDown().fontSize(16).fillColor("#102a43").text(`${input.document.documentType} ${input.document.documentNumber}`);
  pdf.fontSize(9).fillColor("#555555").text(`Estado interno: ${input.document.status} · Regime IVA: ${input.document.ivaRegime} · Data: ${input.document.issuedAt ? new Date(input.document.issuedAt).toLocaleString("pt-PT") : "não emitido"}`);
  if (input.counterparty) pdf.moveDown().fontSize(10).fillColor("#102a43").text(`Adquirente: ${input.counterparty.name}${input.counterparty.taxId ? ` · NIF ${input.counterparty.taxId}` : ""}`).fontSize(9).fillColor("#555555").text(input.counterparty.address ?? "");
  const left = pdf.page.margins.left;
  const contentWidth = pdf.page.width - pdf.page.margins.left - pdf.page.margins.right;
  const colDescription = Math.max(100, contentWidth * 0.43);
  const colQuantity = left + contentWidth * 0.48;
  const colPrice = left + contentWidth * 0.64;
  const colTotal = left + contentWidth * 0.82;
  pdf.moveDown().fontSize(9).fillColor("#102a43").text("Descrição", left, pdf.y, { width: colDescription }).text("Qtd.", colQuantity, pdf.y - 10, { width: 45 }).text("Preço", colPrice, pdf.y - 10, { width: 70 }).text("Total", colTotal, pdf.y - 10, { width: 80 });
  pdf.moveDown(0.5).strokeColor("#dbe5f1").moveTo(left, pdf.y).lineTo(pdf.page.width - pdf.page.margins.right, pdf.y).stroke();
  for (const line of input.lines) { pdf.moveDown(0.4).fontSize(9).fillColor("#333333").text(line.description, left, pdf.y, { width: colDescription }).text(String(line.quantity), colQuantity, pdf.y - 10, { width: 45 }).text(money(line.unitPrice, input.document.currency), colPrice, pdf.y - 10, { width: 80 }).text(money(line.totalAmount, input.document.currency), colTotal, pdf.y - 10, { width: 80 }); }
  pdf.moveDown(1).fontSize(10).fillColor("#102a43").text(`Subtotal: ${money(input.document.netAmount, input.document.currency)}`, { align: "right" }).text(`Imposto: ${money(input.document.taxAmount, input.document.currency)}`, { align: "right" }).fontSize(13).text(`Total: ${money(input.document.totalAmount, input.document.currency)}`, { align: "right" });
  pdf.moveDown(1).fontSize(8).fillColor("#6b7280").text("DOCUMENTO DE PREPARAÇÃO INTERNA — NÃO CERTIFICADO/HOMOLOGADO PELA AGT.");
  pdf.text(`Hash SHA-256: ${hash}`, { width: 360 });
  pdf.text(`Consulta QR: ${qrUrl}`, { width: 360 });
  pdf.moveDown(1).fontSize(8).fillColor("#6b7280").text(BALANCERTS_COPYRIGHT, { align: "center" });
  const qrX = Math.max(left, pdf.page.width - pdf.page.margins.right - 100);
  const qrY = Math.min(pdf.page.height - pdf.page.margins.bottom - 110, Math.max(pdf.page.margins.top + 120, pdf.y - 80));
  pdf.image(dataUrlToBuffer(qrDataUrl), qrX, qrY, { fit: [100, 100] });
  const agtLogo = await loadOfficialAgtLogo();
  if (agtLogo) pdf.image(agtLogo, qrX + 36, qrY + 36, { fit: [28, 28] });
  pdf.end();
  const buffer = await finished;
  return { buffer, hash, qrUrl, certified: false as const, mimeType: "application/pdf" as const };
}
