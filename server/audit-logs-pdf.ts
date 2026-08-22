import PDFDocument from "pdfkit";

type AuditPdfItem = { id: number; createdAt: Date; action: string; entityType: string; entityId: string; actorUserId: number; correlationId: string; beforeState: string | null; afterState: string | null; actor: { id: number | null; name: string | null; email: string | null } | null; companyName: string | null };

export function buildAuditLogsPdf(input: { organizationName: string; companyName?: string | null; filters: string; items: AuditPdfItem[] }) {
  return new Promise<{ buffer: Buffer; mimeType: "application/pdf" }>((resolve) => {
    const pdf = new PDFDocument({ size: "A4", margin: 38, info: { Title: "Logs de Auditoria PGCA", Author: "BALANCERTS.ERP", Subject: "Relatório de alterações e confirmações" } });
    const chunks: Buffer[] = [];
    pdf.on("data", (chunk: Buffer) => chunks.push(chunk));
    pdf.on("end", () => resolve({ buffer: Buffer.concat(chunks), mimeType: "application/pdf" }));
    pdf.fillColor("#102a43").font("Helvetica-Bold").fontSize(17).text("BALANCERTS.ERP");
    pdf.fontSize(13).text("Logs de auditoria PGCA");
    pdf.moveDown(0.25).font("Helvetica").fontSize(9).fillColor("#5f6d7b").text(`${input.organizationName}${input.companyName ? ` · ${input.companyName}` : ""}`);
    pdf.text(`Filtros: ${input.filters}`);
    pdf.text(`Emitido em: ${new Date().toLocaleString("pt-PT")} · ${input.items.length} eventos incluídos`);
    pdf.moveDown(0.6).strokeColor("#bfc9d4").moveTo(38, pdf.y).lineTo(557, pdf.y).stroke();
    pdf.moveDown(0.5);
    if (!input.items.length) pdf.font("Helvetica").fontSize(9).fillColor("#333333").text("Não existem eventos para os filtros seleccionados.");
    for (const item of input.items) {
      if (pdf.y > 725) pdf.addPage();
      const actor = item.actor?.name || `Utilizador #${item.actorUserId}`;
      pdf.font("Helvetica-Bold").fontSize(9).fillColor("#102a43").text(`${new Date(item.createdAt).toLocaleString("pt-PT")} · ${item.action}`);
      pdf.font("Helvetica").fontSize(8.5).fillColor("#333333").text(`Actor: ${actor} · Entidade: ${item.entityType} #${item.entityId}${item.companyName ? ` · Empresa: ${item.companyName}` : ""}`);
      pdf.text(`Correlação: ${item.correlationId}`);
      pdf.text(`Antes: ${item.beforeState || "Sem estado anterior"}`);
      pdf.text(`Depois: ${item.afterState || "Sem estado posterior"}`);
      pdf.moveDown(0.45).strokeColor("#e3e8ee").moveTo(38, pdf.y).lineTo(557, pdf.y).stroke().moveDown(0.4);
    }
    pdf.fontSize(8).fillColor("#5f6d7b").text("Documento de consulta. Os eventos de auditoria são append-only e não podem ser alterados através deste relatório.", 38, 760, { width: 519, align: "center" });
    pdf.end();
  });
}
