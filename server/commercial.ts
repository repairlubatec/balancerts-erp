export const SAF_T_DOCUMENT_TYPES = ["FT", "FR", "GF", "FG", "AC", "AR", "ND", "NC", "AF", "TV", "RP", "RE", "CS", "LD", "RA"] as const;

export type SaftDocumentType = (typeof SAF_T_DOCUMENT_TYPES)[number];

export function isSaftDocumentType(value: string): value is SaftDocumentType {
  return (SAF_T_DOCUMENT_TYPES as readonly string[]).includes(value);
}

export function assertCreditLimit(outstanding: number, requested: number, creditLimit: number) {
  if (![outstanding, requested, creditLimit].every(Number.isFinite) || outstanding < 0 || requested < 0 || creditLimit < 0) throw new Error("CREDIT_VALUES_INVALID");
  if (creditLimit > 0 && outstanding + requested > creditLimit + 0.005) throw new Error("CUSTOMER_CREDIT_LIMIT_EXCEEDED");
  return { outstanding, requested, creditLimit, available: creditLimit > 0 ? Math.max(0, creditLimit - outstanding - requested) : null };
}

export function calculateSettledAmount(total: number, current: number, payment: number) {
  if (![total, current, payment].every(Number.isFinite) || total < 0 || current < 0 || payment < 0) throw new Error("SETTLEMENT_VALUES_INVALID");
  return Math.min(total, current + payment);
}
