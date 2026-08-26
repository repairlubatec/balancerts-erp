type Account = { code: string; name: string; accountType: string; nature: string; acceptsEntries: number; validationStatus: string; parentCode?: string | null; classCode?: string };
type Rule = { operation: string; documentType?: string | null; active: number; taxType?: string | null; calculationBase?: string | null; taxRate?: string | number | null; priority: number; effectiveFrom: Date | string; effectiveTo?: Date | string | null };

const escapeCsv = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
const dateLabel = (value: Date | string | null | undefined) => value ? new Date(value).toLocaleDateString("pt-PT") : "";

export function buildPgcaApprovalCsv(accounts: Account[], rules: Rule[]) {
  const rows = [
    ["TIPO", "CÓDIGO/OPERAÇÃO", "DESIGNAÇÃO/DOCUMENTO", "NATUREZA/IMPOSTO", "ESTADO/BASE", "TAXA (%)", "PRIORIDADE", "VIGÊNCIA INICIAL", "VIGÊNCIA FINAL"],
    ...accounts.map(account => ["CONTA", account.code, account.name, account.nature, account.validationStatus, "", "", "", ""]),
    ...rules.filter(rule => rule.active === 1).map(rule => ["REGRA", rule.operation, rule.documentType ?? "", rule.taxType ?? "NONE", rule.calculationBase ?? "NONE", rule.taxRate ?? "", rule.priority, dateLabel(rule.effectiveFrom), dateLabel(rule.effectiveTo)]),
  ];
  return `\uFEFF${rows.map(row => row.map(escapeCsv).join(";")).join("\r\n")}`;
}

export function buildPgcaApprovalExcel(accounts: Account[], rules: Rule[]) {
  const csv = buildPgcaApprovalCsv(accounts, rules).replace(/^\uFEFF/, "");
  const html = `<html><head><meta charset="UTF-8"></head><body><table>${csv.split("\r\n").map(line => `<tr>${line.split(";").map(cell => `<td>${cell.replace(/^"|"$/g, "").replaceAll('""', '"')}</td>`).join("")}</tr>`).join("")}</table></body></html>`;
  return `\uFEFF${html}`;
}

export function downloadPgcaApprovalFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
