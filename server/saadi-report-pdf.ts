import PDFDocument from "pdfkit";

export type SaadiReportInput = {
  companyName: string;
  companyNif?: string | null;
  studyCode: string;
  studyName: string;
  investmentDomain: string;
  currency: string;
  feasibility?: { initialInvestment: number; discountRate: number; cashFlows: number[]; npv?: number | null; irr?: number | null; paybackMonths?: number | null; roi?: number | null; decision?: string };
  risks: Array<{ title: string; probability: number; impact: number; exposure: number; response: string }>;
  decisions: Array<{ decision: string; justification: string; decidedBy: number; decisionHash: string }>;
};

export function buildSaadiFeasibilityPdf(input: SaadiReportInput) {
  return new Promise<{ buffer: Buffer; mimeType: "application/pdf" }>((resolve) => {
    const pdf = new PDFDocument({ size: "A4", margin: 42, info: { Title: "Estudo de Viabilidade SAADI", Author: "BALANCERTS.ERP", Subject: "Análise de investimento" } });
    const chunks: Buffer[] = [];
    pdf.on("data", (chunk: Buffer) => chunks.push(chunk));
    pdf.on("end", () => resolve({ buffer: Buffer.concat(chunks), mimeType: "application/pdf" }));
    pdf.fillColor("#102a43").fontSize(18).font("Helvetica-Bold").text("BALANCERTS.ERP");
    pdf.fontSize(14).text("SAADI — Estudo de Viabilidade");
    pdf.moveDown(0.3).font("Helvetica").fontSize(9).fillColor("#5f6d7b").text(`${input.companyName}${input.companyNif ? ` · NIF ${input.companyNif}` : ""} · ${input.currency}`);
    pdf.text(`${input.studyCode} · ${input.studyName} · Domínio: ${input.investmentDomain}`);
    pdf.text(`Emissão: ${new Date().toLocaleString("pt-PT")}`);
    pdf.moveDown(0.8).strokeColor("#bfc9d4").moveTo(42, pdf.y).lineTo(553, pdf.y).stroke();
    pdf.moveDown(0.6).font("Helvetica-Bold").fontSize(11).fillColor("#102a43").text("Premissas financeiras");
    if (input.feasibility) {
      const f = input.feasibility;
      pdf.font("Helvetica").fontSize(9).fillColor("#333333").text(`Investimento inicial: ${f.initialInvestment.toLocaleString("pt-PT")} ${input.currency}`);
      pdf.text(`Taxa de desconto: ${(f.discountRate * 100).toFixed(2)}%`);
      pdf.text(`Fluxos de caixa: ${f.cashFlows.map((value) => value.toLocaleString("pt-PT")).join(" · ")} ${input.currency}`);
      pdf.moveDown(0.5).font("Helvetica-Bold").text("Resultados");
      pdf.font("Helvetica").text(`VPL: ${f.npv == null ? "—" : f.npv.toLocaleString("pt-PT")} ${input.currency}`);
      pdf.text(`TIR: ${f.irr == null ? "—" : `${(f.irr * 100).toFixed(2)}%`}`);
      pdf.text(`Prazo de retorno: ${f.paybackMonths == null ? "Não recuperado" : `${f.paybackMonths.toFixed(1)} períodos`}`);
      pdf.text(`ROI: ${f.roi == null ? "—" : `${(f.roi * 100).toFixed(2)}%`}`);
      pdf.text(`Decisão analítica: ${f.decision ?? "Não calculada"}`);
    } else pdf.font("Helvetica").fontSize(9).text("Sem premissas financeiras guardadas.");
    pdf.moveDown(0.8).font("Helvetica-Bold").fontSize(11).fillColor("#102a43").text("Riscos registados");
    if (input.risks.length) input.risks.forEach((risk) => pdf.font("Helvetica").fontSize(9).fillColor("#333333").text(`${risk.title} · probabilidade ${risk.probability}/5 · impacto ${risk.impact}/5 · exposição ${risk.exposure} · resposta ${risk.response}`));
    else pdf.font("Helvetica").fontSize(9).text("Nenhum risco registado.");
    pdf.moveDown(0.8).font("Helvetica-Bold").fontSize(11).fillColor("#102a43").text("Decisão humana");
    if (input.decisions.length) input.decisions.forEach((decision) => { pdf.font("Helvetica").fontSize(9).fillColor("#333333").text(`${decision.decision} · responsável ${decision.decidedBy}`); pdf.text(`Fundamentação: ${decision.justification}`); pdf.text(`Hash: ${decision.decisionHash}`); });
    else pdf.font("Helvetica").fontSize(9).text("Ainda não existe decisão humana registada.");
    pdf.moveDown(1.2).fontSize(8).fillColor("#5f6d7b").text("Relatório analítico. Os valores realizados pertencem ao BALANCERTS.ERP; o SAADI não altera lançamentos operacionais.");
    pdf.end();
  });
}
