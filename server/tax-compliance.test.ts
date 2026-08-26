import { describe, expect, it } from "vitest";
import { buildAgtComplianceCalendar, buildFiscalCalendar2026, validateAgtFiscalRecord } from "./tax-compliance";

describe("AGT compliance calendar", () => {
  it("builds the 2026 IVA Geral calendar with monthly declaration and SAF-T entries", () => {
    const entries = buildAgtComplianceCalendar({ year: 2026, regime: "GERAL" });
    expect(entries).toHaveLength(24);
    expect(entries.filter((entry) => entry.code === "IVA_GERAL_DECLARACAO")[0]?.dueDate).toBe("2026-01-15");
    expect(entries.filter((entry) => entry.code === "IVA_GERAL_SAFT")[1]?.dueDate).toBe("2026-02-28");
    expect(entries.every((entry) => entry.source === "AGT Calendário Fiscal 2026")).toBe(true);
  });

  it("filters Simplificado without mixing Geral obligations", () => {
    const entries = buildAgtComplianceCalendar({ year: 2026, regime: "SIMPLIFICADO" });
    expect(new Set(entries.map((entry) => entry.regime))).toEqual(new Set(["SIMPLIFICADO"]));
    expect(entries).toHaveLength(24);
  });

  it("does not fabricate a calendar for an unconfigured year", () => {
    expect(buildAgtComplianceCalendar({ year: 2027, regime: "GERAL" })).toEqual([]);
  });

  it("validates a reconciled fiscal record with document provenance", () => {
    expect(validateAgtFiscalRecord({ companyId: 1, period: { year: 2023, month: 9 }, regime: "EXCLUSAO", sourceDocumentCount: 2, netAmount: 1000, taxAmount: 0, totalAmount: 1000 })).toEqual({ valid: true, errors: [] });
  });

  it("rejects IVA liquidado no regime EXCLUSÃO", () => {
    const result = validateAgtFiscalRecord({ companyId: 1, period: { year: 2023, month: 9 }, regime: "EXCLUSAO", sourceDocumentCount: 1, netAmount: 1000, taxAmount: 140, totalAmount: 1140 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("EXCLUSAO_TAX_MUST_BE_ZERO");
  });

  it("rejects non-reconciled totals and positive amounts without source documents", () => {
    const result = validateAgtFiscalRecord({ companyId: 1, period: { year: 2023, month: 9 }, regime: "GERAL", sourceDocumentCount: 0, netAmount: 1000, taxAmount: 140, totalAmount: 1000 });
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining(["TOTAL_NOT_RECONCILED", "SOURCE_DOCUMENTS_REQUIRED"]));
  });

  it("rejects invalid periods and company identifiers", () => {
    const result = validateAgtFiscalRecord({ companyId: 0, period: { year: 2022, month: 13 }, regime: "EXCLUSAO", sourceDocumentCount: 0, netAmount: 0, taxAmount: 0, totalAmount: 0 });
    expect(result.errors).toEqual(expect.arrayContaining(["COMPANY_REQUIRED", "PERIOD_YEAR_INVALID", "PERIOD_MONTH_INVALID"]));
  });

  it("clamps configured deadlines to the actual month length", () => {
    const entries = buildAgtComplianceCalendar({ year: 2028, definitions: [{ code: "TEST", tax: "IVA", title: "Teste", regime: "GERAL", deadlineDaysByMonth: [31, 31], source: "fixture" }] });
    expect(entries.map((entry) => entry.dueDate)).toEqual(["2028-01-31", "2028-02-29"]);
  });

  it("builds the 2026 operational calendar fail-closed from the supplied source", () => {
    const entries = buildFiscalCalendar2026({ year: 2026, regime: "GERAL", today: new Date("2026-01-01T00:00:00.000Z") });
    expect(entries.length).toBeGreaterThan(24);
    expect(entries.find((entry) => entry.code === "IVA_GERAL_DECLARACAO" && entry.month === 1)).toMatchObject({ dueDate: "2026-01-15", alert: "BLOCKED", sourceStatus: "PENDING_REVIEW" });
    expect(entries.find((entry) => entry.code === "IRT_PAGAMENTO_5_DIAS")).toMatchObject({ dueDate: null, deadlineType: "RELATIVE_DAYS", alert: "BLOCKED" });
  });

  it("filters the fiscal calendar by sector and keeps relative deadlines without invented dates", () => {
    const entries = buildFiscalCalendar2026({ year: 2026, sector: "NAO_PETROLIFERO", today: new Date("2026-08-26T00:00:00.000Z") });
    expect(entries.every((entry) => entry.sector === "NAO_PETROLIFERO")).toBe(true);
    expect(entries.filter((entry) => entry.deadlineType === "RELATIVE_DAYS").every((entry) => entry.dueDate === null)).toBe(true);
    expect(entries.some((entry) => entry.alert === "OVERDUE")).toBe(false);
  });
});
