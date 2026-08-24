export type PgcExportAccount = {
  code: string;
  name: string;
  accountType?: string | null;
  validationStatus?: string | null;
  acceptsEntries?: number | boolean | null;
};

export type PgcExternalBlocker = {
  label: string;
  count: number;
  reason: string;
};

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export function buildPgcaReviewCsv(accounts: PgcExportAccount[],   blockers: readonly PgcExternalBlocker[]) {
  const rows = [
    ["SECÇÃO", "CÓDIGO", "DESIGNAÇÃO", "TIPO", "ESTADO", "LANÇÁVEL", "PENDÊNCIA", "QUANTIDADE", "MOTIVO"],
    ...accounts.map(account => [
      "CONTA_PGCA",
      account.code,
      account.name,
      account.accountType ?? "",
      account.validationStatus ?? "",
      account.acceptsEntries === true || account.acceptsEntries === 1 ? "Sim" : "Não",
      "",
      "",
      "",
    ]),
    ...blockers.map(blocker => [
      "PENDÊNCIA_EXTERNA",
      "",
      "",
      "",
      "EM ESPERA",
      "",
      blocker.label,
      blocker.count,
      blocker.reason,
    ]),
  ];
  return `\uFEFF${rows.map(row => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
}

export function downloadPgcaReviewCsv(csv: string, filename = "pgca-contas-e-pendencias.csv") {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
