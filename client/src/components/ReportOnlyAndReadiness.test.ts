import { describe, expect, it } from "vitest";
import { getReportOnlyIssueCount, statusLabel } from "./ReportOnlyControlPanel";
import { getReadinessCoveragePercent } from "./PgcaReadinessDetailPanel";

describe("controlo REPORT_ONLY e readiness PGCA", () => {
  it("conta inconsistências semânticas e XSD sem misturar o estado de submissão", () => {
    expect(getReportOnlyIssueCount({ semanticIssues: [{ code: "UNBALANCED_ENTRY" }], xsdMessages: ["erro XSD"] })).toBe(2);
    expect(getReportOnlyIssueCount({ semanticIssues: [], xsdMessages: [] })).toBe(0);
    expect(statusLabel(false)).toBe("Requer revisão");
    expect(statusLabel(true)).toBe("Sem inconsistências");
  });

  it("calcula a cobertura de readiness sem dividir por zero", () => {
    expect(getReadinessCoveragePercent(792, 792)).toBe(100);
    expect(getReadinessCoveragePercent(6, 10)).toBe(60);
    expect(getReadinessCoveragePercent(0, 0)).toBe(0);
  });
});
