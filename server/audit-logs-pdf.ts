import PDFDocument from "pdfkit";

type AuditPdfItem = { id: number; createdAt: Date; action: string; entityType: string; entityId: string; actorUserId: number; correlationId: string; beforeState: string | null; afterState: string | null; actor: { id: number | null; name: string | null; email: string | null } | null; companyName: string | null };

export function buildAuditLogsPdf(input: { organizationName: string; companyName?: string | null; filters: string; items: AuditPdfItem[]; executiveSummary?: { total: number; open: number; reviewed: number; resolved: number; topReason?: string | null; recommendation?: string | null } }) {
  return new Promise<{ buffer: Buffer; mimeType: "application/pdf" }>((resolve) => {
    const pdf = new PDFDocument({ size: "A4", margin: 38, info: { Title: "Logs de Auditoria PGCA", Author: "BALANCERTS.ERP", Subject: "Relatório de alterações e confirmações" } });
    const chunks: Buffer[] = [];
    pdf.on("data", (chunk: Buffer) => chunks.push(chunk));
    pdf.on("end", () => resolve({ buffer: Buffer.concat(chunks), mimeType: "application/pdf" }));
    pdf.roundedRect(38, 38, 30, 30, 4).fillColor("#1267d6").fill();
    pdf.fillColor("#ffffff").font("Helvetica-Bold").fontSize(18).text("B", 46, 43);
    pdf.fillColor("#102a43").font("Helvetica-Bold").fontSize(17).text("BALANCERTS.ERP", 76, 42);
    pdf.fontSize(13).text("Logs de auditoria PGCA", 76, 62);
    pdf.moveDown(0.25).font("Helvetica").fontSize(9).fillColor("#5f6d7b").text(`${input.organizationName}${input.companyName ? ` · ${input.companyName}` : ""}`);
    pdf.text(`Filtros: ${input.filters}`);
    pdf.text(`Emitido em: ${new Date().toLocaleString("pt-PT")} · ${input.items.length} eventos incluídos`);
    pdf.moveDown(0.25).font("Helvetica-Bold").fillColor("#102a43").fontSize(8.5).text("Rastreabilidade da consulta");
    pdf.font("Helvetica").fillColor("#5f6d7b").fontSize(8).text(`Organização/empresa: ${input.organizationName}${input.companyName ? ` / ${input.companyName}` : ""} · Filtros aplicados: ${input.filters} · Total incluído: ${input.items.length}`);
    pdf.moveDown(0.6).strokeColor("#bfc9d4").moveTo(38, pdf.y).lineTo(557, pdf.y).stroke();
    if (input.executiveSummary) {
      const summary = input.executiveSummary;
      pdf.moveDown(0.5).roundedRect(38, pdf.y, 519, 55, 4).fillColor("#eef5fc").fill();
      pdf.fillColor("#102a43").font("Helvetica-Bold").fontSize(10).text("Resumo executivo", 50, pdf.y - 45);
      pdf.fillColor("#333333").font("Helvetica").fontSize(8.5).text(`Foram identificados ${summary.total} bloqueios PGCA no período seleccionado. Em aberto: ${summary.open} · Revistos: ${summary.reviewed} · Resolvidos: ${summary.resolved}.`, 50, pdf.y - 28, { width: 495 });
      if (summary.topReason) pdf.text(`Motivo mais frequente: ${summary.topReason}.`, 50, pdf.y - 12, { width: 495 });
      if (summary.recommendation) pdf.text(`Recomendação operacional: ${summary.recommendation}`, 50, pdf.y + 3, { width: 495 });
      pdf.fillColor("#7c2d12").font("Helvetica-Bold").fontSize(8).text("Nota: esta recomendação é exclusivamente informativa, não activa regras nem publica lançamentos e requer revisão humana.", 50, pdf.y + 18, { width: 495 });
      pdf.y += summary.recommendation ? 48 : 34;
    }
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
