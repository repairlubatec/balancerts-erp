export type TaxRegime = "GERAL" | "SIMPLIFICADO" | "EXCLUSAO";

export type AgtObligationDefinition = {
  code: string;
  tax: "IVA" | "SAFT";
  title: string;
  regime: TaxRegime | "GERAL_E_SIMPLIFICADO";
  deadlineDaysByMonth: number[];
  source: string;
};

export type AgtCalendarEntry = AgtObligationDefinition & {
  year: number;
  month: number;
  dueDate: string;
};

const daysInMonth = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate();

export const AGT_2026_CORE_OBLIGATIONS: AgtObligationDefinition[] = [
  { code: "IVA_GERAL_DECLARACAO", tax: "IVA", title: "Submissão da declaração Modelo 7, anexos e pagamento do IVA", regime: "GERAL", deadlineDaysByMonth: Array(12).fill(15), source: "AGT Calendário Fiscal 2026" },
  { code: "IVA_GERAL_SAFT", tax: "SAFT", title: "Submissão do ficheiro SAF-T no Portal do Contribuinte", regime: "GERAL", deadlineDaysByMonth: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31], source: "AGT Calendário Fiscal 2026" },
  { code: "IVA_SIMPLIFICADO_DECLARACAO", tax: "IVA", title: "Submissão da declaração e pagamento do IVA do Regime Simplificado", regime: "SIMPLIFICADO", deadlineDaysByMonth: [30, 28, 30, 30, 29, 30, 30, 30, 30, 30, 30, 30], source: "AGT Calendário Fiscal 2026" },
  { code: "IVA_SIMPLIFICADO_SAFT", tax: "SAFT", title: "Submissão do ficheiro SAF-T no Portal do Contribuinte", regime: "SIMPLIFICADO", deadlineDaysByMonth: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31], source: "AGT Calendário Fiscal 2026" },
];

export type AgtFiscalRecord = {
  companyId: number;
  period: { year: number; month: number };
  regime: TaxRegime;
  sourceDocumentCount: number;
  netAmount: number;
  taxAmount: number;
  totalAmount: number;
};

export function validateAgtFiscalRecord(record: AgtFiscalRecord) {
  const errors: string[] = [];
  if (!Number.isInteger(record.companyId) || record.companyId <= 0) errors.push("COMPANY_REQUIRED");
  if (!Number.isInteger(record.period.year) || record.period.year < 2023) errors.push("PERIOD_YEAR_INVALID");
  if (!Number.isInteger(record.period.month) || record.period.month < 1 || record.period.month > 12) errors.push("PERIOD_MONTH_INVALID");
  if (!Number.isInteger(record.sourceDocumentCount) || record.sourceDocumentCount < 0) errors.push("SOURCE_DOCUMENT_COUNT_INVALID");
  if (!["GERAL", "SIMPLIFICADO", "EXCLUSAO"].includes(record.regime)) errors.push("IVA_REGIME_INVALID");
  if (![record.netAmount, record.taxAmount, record.totalAmount].every((amount) => Number.isFinite(amount) && amount >= 0)) errors.push("AMOUNT_INVALID");
  if (Math.abs(record.totalAmount - (record.netAmount + record.taxAmount)) > 0.01) errors.push("TOTAL_NOT_RECONCILED");
  if (record.sourceDocumentCount === 0 && (record.netAmount > 0 || record.taxAmount > 0 || record.totalAmount > 0)) errors.push("SOURCE_DOCUMENTS_REQUIRED");
  return { valid: errors.length === 0, errors };
}

export function buildAgtComplianceCalendar(input: { year: number; regime?: TaxRegime; definitions?: AgtObligationDefinition[] }) {
  const definitions = input.definitions ?? (input.year === 2026 ? AGT_2026_CORE_OBLIGATIONS : []);
  const filtered = definitions.filter((definition) => !input.regime || definition.regime === input.regime || definition.regime === "GERAL_E_SIMPLIFICADO");
  const entries: AgtCalendarEntry[] = [];
  for (const definition of filtered) {
    for (let month = 1; month <= 12; month += 1) {
      const configuredDay = definition.deadlineDaysByMonth[month - 1];
      if (!configuredDay) continue;
      const day = Math.min(configuredDay, daysInMonth(input.year, month));
      entries.push({ ...definition, year: input.year, month, dueDate: `${input.year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}` });
    }
  }
  return entries.sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.code.localeCompare(b.code));
}
