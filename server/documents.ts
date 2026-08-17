export type DocumentLifecycleStatus = "DRAFT" | "VALIDATED" | "ISSUED" | "ACCOUNTED" | "CANCELLED";

export function assertDocumentMutable(status: DocumentLifecycleStatus) {
  if (status === "ISSUED" || status === "ACCOUNTED" || status === "CANCELLED") throw new Error("DOCUMENT_IMMUTABLE_AFTER_ISSUANCE");
  return true as const;
}

export function formatDocumentNumber(series: string, number: number) {
  if (!series.trim() || !Number.isInteger(number) || number < 1) throw new Error("INVALID_DOCUMENT_NUMBER");
  return `${series}/${number.toString().padStart(6, "0")}`;
}
