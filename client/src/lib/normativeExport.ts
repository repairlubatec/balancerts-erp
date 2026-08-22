export type NormativeAccountExportItem = {
  code: string;
  name: string;
  classCode?: string | null;
  parentCode?: string | null;
  nature?: string | null;
  balanceType?: string | null;
  accountType?: string | null;
  acceptsEntries: number;
  validationStatus: string;
  balanceSheet?: number | null;
  incomeStatement?: number | null;
};

const natureLabels: Record<string, string> = {
  DEBIT: "Devedora",
  CREDIT: "Credora",
  MIXED: "Mista",
  NOT_APPLICABLE: "Não aplicável",
};

const balanceLabels: Record<string, string> = {
  DEBIT: "Saldo devedor",
  CREDIT: "Saldo credor",
  VARIABLE: "Saldo variável",
  NOT_APPLICABLE: "Sem saldo",
};

const accountTypeLabels: Record<string, string> = {
  CLASS: "Classe",
  GROUP: "Grupo",
  MOVEMENT: "Movimento",
  ANALYTICAL: "Analítica",
};

const statusLabels: Record<string, string> = {
  CONFIRMED: "Confirmada",
  PENDING: "Pendente",
  NEEDS_REVIEW: "Requer revisão",
  REJECTED: "Rejeitada",
};

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function presentationLabel(account: NormativeAccountExportItem) {
  if (account.balanceSheet) return "Balanço";
  if (account.incomeStatement) return "Resultados";
  return "Não definida";
}

export function buildPgcAccountsCsv(accounts: NormativeAccountExportItem[]) {
  const headers = [
    "Código",
    "Designação",
    "Classe",
    "Conta-pai",
    "Natureza",
    "Comportamento do saldo",
    "Tipo de conta",
    "Lançável",
    "Estado normativo",
    "Apresentação",
  ];
  const rows = accounts.map((account) => [
    account.code,
    account.name,
    account.classCode ?? account.code.slice(0, 1),
    account.parentCode ?? "",
    account.nature ? natureLabels[account.nature] ?? account.nature : "Não informado",
    account.balanceType ? balanceLabels[account.balanceType] ?? account.balanceType : "Não informado",
    account.accountType ? accountTypeLabels[account.accountType] ?? account.accountType : "Não informado",
    account.acceptsEntries === 1 ? "Sim" : "Não",
    statusLabels[account.validationStatus] ?? account.validationStatus,
    presentationLabel(account),
  ]);
  return `\uFEFF${[headers, ...rows].map((row) => row.map(csvCell).join(";")).join("\r\n")}\r\n`;
}

export function pgcAccountsExportFilename(versionCode?: string | null) {
  const date = new Date().toISOString().slice(0, 10);
  const safeVersion = (versionCode ?? "catalogo").replace(/[^a-zA-Z0-9_-]+/g, "-");
  return `contas-pgca-${safeVersion}-${date}.csv`;
}
