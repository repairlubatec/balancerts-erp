import { describe, expect, it } from "vitest";
import { buildAgtComplianceCalendar } from "./tax-compliance";

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

  it("clamps configured deadlines to the actual month length", () => {
    const entries = buildAgtComplianceCalendar({ year: 2028, definitions: [{ code: "TEST", tax: "IVA", title: "Teste", regime: "GERAL", deadlineDaysByMonth: [31, 31], source: "fixture" }] });
    expect(entries.map((entry) => entry.dueDate)).toEqual(["2028-01-31", "2028-02-29"]);
  });
});
