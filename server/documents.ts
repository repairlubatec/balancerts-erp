export function formatDocumentNumber(series: string, number: number) {
  if (!series.trim() || !Number.isInteger(number) || number < 1) throw new Error("INVALID_DOCUMENT_NUMBER");
  return `${series}/${number.toString().padStart(6, "0")}`;
}
