export type SimulationExportRow = { code?: string; label: string; debit?: number; credit?: number; value?: number };

const escapeCsv = (value: unknown) => {
  const text = String(value ?? "");
  return /[\";,\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const money = (value: number) => Number(value ?? 0).toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function buildSimulationCsv(input: { title: string; versionCode: string; rows: SimulationExportRow[]; totals?: { debit?: number; credit?: number } }) {
  const lines = [
    ["BALANCERTS.ERP", input.title, `Versão PGCA candidata ${input.versionCode}`],
    [],
    ["Código", "Designação", "Débito (AOA)", "Crédito (AOA)", "Valor (AOA)"],
    ...input.rows.map(row => [row.code ?? "", row.label, row.debit === undefined ? "" : money(row.debit), row.credit === undefined ? "" : money(row.credit), row.value === undefined ? "" : money(row.value)]),
  ];
  if (input.totals) lines.push(["", "Totais", money(input.totals.debit ?? 0), money(input.totals.credit ?? 0), ""]);
  return "\ufeff" + lines.map(line => line.map(escapeCsv).join(";")).join("\r\n");
}

const pdfEscape = (value: string) => value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

export function buildSimpleSimulationPdf(lines: string[]) {
  const content = ["BT", "/F1 10 Tf", "50 790 Td", ...lines.flatMap((line, index) => [index === 0 ? `/F1 16 Tf (${pdfEscape(line)}) Tj` : `/F1 10 Tf 0 -16 Td (${pdfEscape(line)}) Tj`]), "ET"].join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  objects.forEach((object, index) => { offsets[index + 1] = pdf.length; pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, "0")} 00000 n `).join("\n")}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
