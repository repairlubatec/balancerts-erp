export type ReceiptPeriod = { year: number; month: number };

export function formatInternalReceiptPeriod(run?: ReceiptPeriod | null) {
  if (!run) return "—";
  return `${String(run.month).padStart(2, "0")}/${run.year}`;
}

export function formatPayrollActor(actor: { name?: string | null; email?: string | null } | null | undefined, date: Date | string | null | undefined, emptyLabel: string) {
  if (!actor || !date) return emptyLabel;
  return `${actor.name || actor.email || "Utilizador"} · ${new Date(date).toLocaleString("pt-PT")}`;
}

export function formatReceiptMode(selectedEmployeeId: string, itemCount: number) {
  return selectedEmployeeId ? "Recibo individual" : `Mapa colectivo (${itemCount})`;
}

export function buildReceiptExportRows(items: Array<{ employee: { fullName: string; employeeNumber: string }; item: { grossAmount: string | number; socialEmployeeAmount: string | number; irtAmount: string | number; netAmount: string | number } }>) {
  const rows = items.map(({ employee, item }) => ({
    Colaborador: employee.fullName,
    Numero: employee.employeeNumber,
    Bruto_AOA: Number(item.grossAmount),
    Seguranca_Social_AOA: Number(item.socialEmployeeAmount),
    IRT_AOA: Number(item.irtAmount),
    Liquido_AOA: Number(item.netAmount),
  }));
  const totals = calculateReceiptTotals(items.map(({ item }) => item));
  return { rows, totals };
}

function pdfEscape(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export function buildPayrollReceiptPdf(input: { companyName: string; period: string; issuedOn: string; employeeName: string; employeeNumber: string; gross: number; socialSecurity: number; irt: number; net: number }) {
  const money = (value: number) => `${value.toLocaleString("pt-PT")} AOA`;
  const lines = [
    input.companyName,
    "RECIBO INTERNO DE CONFERÊNCIA",
    `Período: ${input.period} | Emitido em: ${input.issuedOn}`,
    `Colaborador: ${input.employeeName} | Nº: ${input.employeeNumber}`,
    "",
    `Remuneração bruta: ${money(input.gross)}`,
    `Segurança Social: ${money(input.socialSecurity)}`,
    `IRT: ${money(input.irt)}`,
    `Líquido a pagar: ${money(input.net)}`,
    "",
    "Documento interno para conferência. Não substitui recibo oficial nem declaração fiscal.",
    "",
    "Conferência interna: ________________________________",
    "Data: ____ / ____ / ________",
    "Assinatura: ________________________________________",
  ];
  const content = ["BT", "/F1 11 Tf", "50 790 Td", ...lines.flatMap((line, index) => [index === 0 ? `(${pdfEscape(line)}) Tj` : `0 -24 Td (${pdfEscape(line)}) Tj`]), "ET"].join("\\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${content.length} >>\\nstream\\n${content}\\nendstream`,
  ];
  let pdf = "%PDF-1.4\\n";
  const offsets: number[] = [0];
  objects.forEach((object, index) => { offsets[index + 1] = pdf.length; pdf += `${index + 1} 0 obj\\n${object}\\nendobj\\n`; });
  const xref = pdf.length;
  pdf += `xref\\n0 ${objects.length + 1}\\n0000000000 65535 f \\n`;
  offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, "0")} 00000 n \\n`; });
  pdf += `trailer\\n<< /Size ${objects.length + 1} /Root 1 0 R >>\\nstartxref\\n${xref}\\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

export function calculateReceiptTotals(items: Array<{ grossAmount: string | number; socialEmployeeAmount: string | number; irtAmount: string | number; netAmount: string | number }>) {
  return items.reduce(
    (totals, item) => ({
      gross: totals.gross + Number(item.grossAmount),
      socialSecurity: totals.socialSecurity + Number(item.socialEmployeeAmount),
      irt: totals.irt + Number(item.irtAmount),
      net: totals.net + Number(item.netAmount),
    }),
    { gross: 0, socialSecurity: 0, irt: 0, net: 0 },
  );
}
