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
  if (record.regime === "EXCLUSAO" && Math.abs(record.taxAmount) > 0.01) errors.push("EXCLUSAO_TAX_MUST_BE_ZERO");
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


export type FiscalCalendarSourceStatus = "CONFIRMED" | "PENDING_REVIEW" | "BLOCKED";
export type FiscalDeadlineType = "FIXED_DAY" | "RELATIVE_DAYS" | "NEXT_MONTH" | "ANNIVERSARY" | "CONDITIONAL";

export type FiscalCalendarDefinition = {
  code: string;
  tax: string;
  title: string;
  sector: "NAO_PETROLIFERO" | "PETROLIFERO" | "MINEIRO";
  regime: string;
  periodicity: "MENSAL" | "ANUAL" | "TRIMESTRAL" | "RELATIVA" | "CONDICIONAL";
  deadlineType: FiscalDeadlineType;
  deadlineDaysByMonth: number[] | null;
  relativeDays?: number | null;
  sourceReference: string;
  sourcePage: number;
  sourceStatus: FiscalCalendarSourceStatus;
};

export type FiscalCalendarAlert = "BLOCKED" | "OVERDUE" | "DUE_TODAY" | "DUE_SOON" | "SCHEDULED";

export type FiscalCalendarEntry = FiscalCalendarDefinition & {
  year: number;
  month: number;
  dueDate: string | null;
  alert: FiscalCalendarAlert;
  daysUntilDue: number | null;
};

const FISCAL_CALENDAR_SOURCE = "Calendário Fiscal 2026 — AGT/MINFIN — minfin5320492.pdf";
const MONTH_END_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const MONTHLY_30_27_31 = [30, 27, 31, 30, 29, 30, 31, 31, 30, 30, 30, 31];

/**
 * Catálogo literal de trabalho. Todas as linhas ficam pendentes de revisão de
 * proveniência institucional; por isso não autorizam cálculo, submissão ou posting.
 */
export const FISCAL_CALENDAR_2026_DEFINITIONS: FiscalCalendarDefinition[] = [
  { code: "IVA_GERAL_DECLARACAO", tax: "IVA", title: "Regime Geral — Submissão da Declaração Modelo 7, anexos de fornecedores e de regularizações e pagamento do imposto", sector: "NAO_PETROLIFERO", regime: "GERAL", periodicity: "MENSAL", deadlineType: "FIXED_DAY", deadlineDaysByMonth: Array(12).fill(15), sourceReference: FISCAL_CALENDAR_SOURCE, sourcePage: 2, sourceStatus: "PENDING_REVIEW" },
  { code: "IVA_GERAL_SAFT", tax: "IVA/SAF-T", title: "Regime Geral — Submissão do ficheiro SAF-T no Portal do Contribuinte", sector: "NAO_PETROLIFERO", regime: "GERAL", periodicity: "MENSAL", deadlineType: "FIXED_DAY", deadlineDaysByMonth: MONTH_END_DAYS, sourceReference: FISCAL_CALENDAR_SOURCE, sourcePage: 2, sourceStatus: "PENDING_REVIEW" },
  { code: "IVA_SIMPLIFICADO_DECLARACAO", tax: "IVA", title: "Regime Simplificado — Submissão da declaração e pagamento do IVA", sector: "NAO_PETROLIFERO", regime: "SIMPLIFICADO", periodicity: "MENSAL", deadlineType: "FIXED_DAY", deadlineDaysByMonth: [30, 27, 31, 30, 29, 30, 31, 31, 30, 30, 30, 31], sourceReference: FISCAL_CALENDAR_SOURCE, sourcePage: 2, sourceStatus: "PENDING_REVIEW" },
  { code: "IVA_SIMPLIFICADO_SAFT", tax: "IVA/SAF-T", title: "Regime Simplificado — Submissão do ficheiro SAF-T no Portal do Contribuinte", sector: "NAO_PETROLIFERO", regime: "SIMPLIFICADO", periodicity: "MENSAL", deadlineType: "FIXED_DAY", deadlineDaysByMonth: MONTH_END_DAYS, sourceReference: FISCAL_CALENDAR_SOURCE, sourcePage: 2, sourceStatus: "PENDING_REVIEW" },
  { code: "II_RETENCOES_SERVICOS", tax: "II", title: "Regime Geral e Simplificado com Contabilidade — Entrega de retenções sobre prestações de serviços pagos durante o mês anterior", sector: "NAO_PETROLIFERO", regime: "GERAL_E_SIMPLIFICADO", periodicity: "MENSAL", deadlineType: "FIXED_DAY", deadlineDaysByMonth: MONTHLY_30_27_31, sourceReference: FISCAL_CALENDAR_SOURCE, sourcePage: 2, sourceStatus: "PENDING_REVIEW" },
  { code: "II_PAGAMENTO_PROVISORIO", tax: "II", title: "Regime Geral — Pagamento do Imposto Industrial Provisório", sector: "NAO_PETROLIFERO", regime: "GERAL", periodicity: "ANUAL", deadlineType: "FIXED_DAY", deadlineDaysByMonth: [0, 0, 0, 0, 0, 0, 0, 31, 0, 0, 0, 0], sourceReference: FISCAL_CALENDAR_SOURCE, sourcePage: 2, sourceStatus: "PENDING_REVIEW" },
  { code: "IRT_MAPA_REMUNERACOES", tax: "IRT", title: "Submissão electrónica do mapa de remunerações e entrega do imposto retido na fonte", sector: "NAO_PETROLIFERO", regime: "GERAL_E_SIMPLIFICADO", periodicity: "MENSAL", deadlineType: "FIXED_DAY", deadlineDaysByMonth: MONTHLY_30_27_31, sourceReference: FISCAL_CALENDAR_SOURCE, sourcePage: 2, sourceStatus: "PENDING_REVIEW" },
  { code: "IRT_RETENCOES_GRUPOS_B_C", tax: "IRT", title: "Entrega do imposto retido na fonte de rendimentos dos Grupos B e C no mês anterior", sector: "NAO_PETROLIFERO", regime: "GERAL_E_SIMPLIFICADO", periodicity: "MENSAL", deadlineType: "FIXED_DAY", deadlineDaysByMonth: MONTHLY_30_27_31, sourceReference: FISCAL_CALENDAR_SOURCE, sourcePage: 2, sourceStatus: "PENDING_REVIEW" },
  { code: "IP_RENDA_RETENCAO", tax: "IP", title: "Renda sujeita a retenção na fonte — entrega do imposto retido sobre as rendas pagas no mês anterior", sector: "NAO_PETROLIFERO", regime: "GERAL_E_SIMPLIFICADO", periodicity: "MENSAL", deadlineType: "FIXED_DAY", deadlineDaysByMonth: MONTHLY_30_27_31, sourceReference: FISCAL_CALENDAR_SOURCE, sourcePage: 2, sourceStatus: "PENDING_REVIEW" },
  { code: "IS_LIQUIDACAO_PAGAMENTO", tax: "IS", title: "Liquidação e pagamento do Imposto do Selo relativo aos actos, contratos e operações sujeitos", sector: "NAO_PETROLIFERO", regime: "GERAL_E_SIMPLIFICADO", periodicity: "MENSAL", deadlineType: "FIXED_DAY", deadlineDaysByMonth: MONTHLY_30_27_31, sourceReference: FISCAL_CALENDAR_SOURCE, sourcePage: 2, sourceStatus: "PENDING_REVIEW" },
  { code: "IRT_PAGAMENTO_5_DIAS", tax: "IRT", title: "Pagamento do imposto no prazo de 5 dias contados da emissão da factura ou atribuição do rendimento", sector: "NAO_PETROLIFERO", regime: "GERAL_E_SIMPLIFICADO", periodicity: "RELATIVA", deadlineType: "RELATIVE_DAYS", deadlineDaysByMonth: null, relativeDays: 5, sourceReference: FISCAL_CALENDAR_SOURCE, sourcePage: 2, sourceStatus: "PENDING_REVIEW" },
  { code: "IP_MATRIZ_MES_SEGUINTE", tax: "IP", title: "Inscrição ou alteração de prédios na Matriz Predial no mês seguinte à construção, ocupação ou aquisição", sector: "NAO_PETROLIFERO", regime: "GERAL_E_SIMPLIFICADO", periodicity: "RELATIVA", deadlineType: "NEXT_MONTH", deadlineDaysByMonth: null, sourceReference: FISCAL_CALENDAR_SOURCE, sourcePage: 2, sourceStatus: "PENDING_REVIEW" },
];

function calendarAlert(sourceStatus: FiscalCalendarSourceStatus, dueDate: string | null, today: Date): { alert: FiscalCalendarAlert; daysUntilDue: number | null } {
  if (sourceStatus !== "CONFIRMED" || !dueDate) return { alert: "BLOCKED", daysUntilDue: null };
  const due = new Date(`${dueDate}T00:00:00.000Z`);
  const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const daysUntilDue = Math.round((due.getTime() - todayUtc.getTime()) / 86400000);
  if (daysUntilDue < 0) return { alert: "OVERDUE", daysUntilDue };
  if (daysUntilDue === 0) return { alert: "DUE_TODAY", daysUntilDue };
  if (daysUntilDue <= 7) return { alert: "DUE_SOON", daysUntilDue };
  return { alert: "SCHEDULED", daysUntilDue };
}

export function buildFiscalCalendar2026(input: { year: number; regime?: string; sector?: FiscalCalendarDefinition["sector"]; today?: Date; definitions?: FiscalCalendarDefinition[] }): FiscalCalendarEntry[] {
  const definitions = input.definitions ?? (input.year === 2026 ? FISCAL_CALENDAR_2026_DEFINITIONS : []);
  const today = input.today ?? new Date();
  const entries: FiscalCalendarEntry[] = [];
  for (const definition of definitions) {
    if (input.regime && definition.regime !== input.regime && definition.regime !== "GERAL_E_SIMPLIFICADO") continue;
    if (input.sector && definition.sector !== input.sector) continue;
    if (definition.deadlineType === "RELATIVE_DAYS" || definition.deadlineType === "NEXT_MONTH" || definition.deadlineType === "CONDITIONAL") {
      entries.push({ ...definition, year: input.year, month: 0, dueDate: null, ...calendarAlert(definition.sourceStatus, null, today) });
      continue;
    }
    for (let month = 1; month <= 12; month += 1) {
      const configuredDay = definition.deadlineDaysByMonth?.[month - 1];
      if (!configuredDay) continue;
      const day = Math.min(configuredDay, daysInMonth(input.year, month));
      const dueDate = `${input.year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      entries.push({ ...definition, year: input.year, month, dueDate, ...calendarAlert(definition.sourceStatus, dueDate, today) });
    }
  }
  return entries.sort((a, b) => (a.dueDate ?? "9999-12-31").localeCompare(b.dueDate ?? "9999-12-31") || a.code.localeCompare(b.code));
}
