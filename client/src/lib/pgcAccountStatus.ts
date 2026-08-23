export type PgcStatusFilter = "ALL" | "CONFIRMED" | "PENDING" | "OTHER";

export const pgcAccountStatusLabel: Record<string, string> = {
  CONFIRMED: "Confirmada",
  NEEDS_NORMATIVE_VALIDATION: "Pendente",
  INVALID: "Inválida",
  DUPLICATE: "Duplicada",
  MISSING_PARENT: "Pai em falta",
};

export const pgcAccountStatusClass: Record<string, string> = {
  CONFIRMED: "border-emerald-300 bg-emerald-50 text-emerald-700",
  NEEDS_NORMATIVE_VALIDATION: "border-amber-300 bg-amber-50 text-amber-800",
  INVALID: "border-red-300 bg-red-50 text-red-700",
  DUPLICATE: "border-red-300 bg-red-50 text-red-700",
  MISSING_PARENT: "border-orange-300 bg-orange-50 text-orange-800",
};

export function filterPgcAccountsByStatus<T extends { validationStatus: string }>(accounts: T[], filter: PgcStatusFilter) {
  return accounts.filter((account) => filter === "ALL" || (filter === "CONFIRMED" ? account.validationStatus === "CONFIRMED" : filter === "PENDING" ? account.validationStatus === "NEEDS_NORMATIVE_VALIDATION" : account.validationStatus !== "CONFIRMED" && account.validationStatus !== "NEEDS_NORMATIVE_VALIDATION"));
}
