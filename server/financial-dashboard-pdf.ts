import PDFDocument from "pdfkit";

export const FINANCIAL_DASHBOARD_COPYRIGHT = "Copyright © Repair Lubatec";

type DashboardInput = {
  companyName: string;
  companyNif?: string | null;
  currency: string;
  periodId?: number | null;
  comparisonPeriodId?: number | null;
  filters: { costCenter?: string | null; analyticalDimension?: string | null };
  kpis: { revenue: number; expenses: number; netIncome: number; receivable: number; payable: number; treasuryBalance: number; documentsTotal: number };
  comparison: { revenue: number; expenses: number; netIncome: number };
  reconciliation: { debit: number; credit: number; balanced: boolean };
  revenueRows: Array<{ accountCode: string; label: string; amount: number }>;
  expenseRows: Array<{ accountCode: string; label: string; amount: number }>;
};

const money = (value: number, currency: string) => `${Number(value ?? 0).toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;

export function buildFinancialDashboardPdf(input: DashboardInput) {
  return new Promise<{ buffer: Buffer; mimeType: "application/pdf" }>((resolve) => {
    const pdf = new PDFDocument({ size: "A4", margin: 42, info: { Title: "Análise Financeira Global", Author: "Repair Lubatec", Subject: "Relatório interno de gestão BALANCERTS.ERP" } });
    const chunks: Buffer[] = [];
    pdf.on("data", (chunk: Buffer) => chunks.push(chunk));
    pdf.on("end", () => resolve({ buffer: Buffer.concat(chunks), mimeType: "application/pdf" }));
    pdf.fillColor("#102a43").fontSize(18).font("Helvetica-Bold").text("BALANCERTS.ERP");
    pdf.fontSize(13).text("Análise Financeira Global");
    pdf.moveDown(0.3).font("Helvetica").fontSize(9).fillColor("#5f6d7b").text(`${input.companyName}${input.companyNif ? ` · NIF ${input.companyNif}` : ""} · Moeda ${input.currency}`);
    pdf.text(`Emissão: ${new Date().toLocaleString("pt-PT")} · Período: ${input.periodId ?? "activo"}${input.comparisonPeriodId ? ` · Comparação: ${input.comparisonPeriodId}` : ""}`);
    pdf.text(`Centro de custo: ${input.filters.costCenter ?? "Todos"} · Dimensão analítica: ${input.filters.analyticalDimension ?? "Todas"}`);
    pdf.moveDown(0.8).strokeColor("#bfc9d4").moveTo(42, pdf.y).lineTo(553, pdf.y).stroke();
    pdf.moveDown(0.6).font("Helvetica-Bold").fontSize(11).fillColor("#102a43").text("Indicadores principais");
    const kpis = [["Rendimentos", input.kpis.revenue], ["Gastos", input.kpis.expenses], ["Resultado", input.kpis.netIncome], ["A receber", input.kpis.receivable], ["A pagar", input.kpis.payable], ["Saldo de tesouraria", input.kpis.treasuryBalance]];
    kpis.forEach(([label, value]) => pdf.font("Helvetica").fontSize(9).fillColor("#333333").text(`${label}: ${money(Number(value), input.currency)}`));
    if (input.comparisonPeriodId) pdf.moveDown(0.5).font("Helvetica-Bold").text(`Período comparativo: rendimentos ${money(input.comparison.revenue, input.currency)} · gastos ${money(input.comparison.expenses, input.currency)} · resultado ${money(input.comparison.netIncome, input.currency)}`);
    pdf.moveDown(0.8).font("Helvetica-Bold").text("Reconciliação");
    pdf.font("Helvetica").fontSize(9).text(`Débito: ${money(input.reconciliation.debit, input.currency)} · Crédito: ${money(input.reconciliation.credit, input.currency)} · Estado: ${input.reconciliation.balanced ? "Equilibrado" : "Requer revisão"}`);
    const renderRows = (title: string, rows: DashboardInput["revenueRows"]) => { pdf.moveDown(0.8).font("Helvetica-Bold").fontSize(11).text(title); if (!rows.length) { pdf.font("Helvetica").fontSize(9).fillColor("#5f6d7b").text("Sem movimentos no filtro seleccionado."); return; } rows.forEach((row) => pdf.font("Helvetica").fontSize(9).fillColor("#333333").text(`${row.accountCode} · ${row.label}: ${money(row.amount, input.currency)}`)); };
    renderRows("Principais rendimentos", input.revenueRows);
    renderRows("Principais gastos", input.expenseRows);
    pdf.moveDown(1.2).strokeColor("#bfc9d4").moveTo(42, pdf.y).lineTo(553, pdf.y).stroke();
    pdf.moveDown(0.5).font("Helvetica-Bold").fontSize(9).fillColor("#102a43").text("Responsável pela análise");
    pdf.moveDown(1.4).font("Helvetica").fillColor("#5f6d7b").text("Nome e assinatura: ______________________________________________");
    pdf.moveDown(1).fontSize(8).text("Documento interno de gestão. Não substitui demonstração financeira assinada nem declaração fiscal oficial.");
    pdf.moveDown(0.4).font("Helvetica-Bold").text(FINANCIAL_DASHBOARD_COPYRIGHT, { align: "center" });
    pdf.end();
  });
}
