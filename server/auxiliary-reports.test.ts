import { describe, expect, it } from "vitest";
import { buildAgingReport, buildFiscalRegister } from "./reports";

describe("auxiliary reports", () => {
  it("classifies outstanding items by age and excludes fully settled items", () => {
    const asOf = new Date("2026-08-17T00:00:00Z");
    const report = buildAgingReport([
      { id: 1, partyName: "Cliente A", documentNumber: "FT 1", issuedAt: new Date("2026-08-01"), dueDate: new Date("2026-08-17"), amount: 100, settledAmount: 0 },
      { id: 2, partyName: "Cliente B", documentNumber: "FT 2", issuedAt: new Date("2026-01-01"), dueDate: new Date("2026-01-01"), amount: 200, settledAmount: 0 },
      { id: 3, partyName: "Cliente C", documentNumber: "FT 3", issuedAt: new Date("2026-01-01"), dueDate: new Date("2026-01-01"), amount: 30, settledAmount: 30 },
    ], asOf);
    expect(report.rows.map((row) => row.bucket)).toEqual(["OVER_90", "CURRENT"]);
    expect(report.totals.outstanding).toBe(300);
    expect(report.totals.byBucket.OVER_90).toBe(200);
  });

  it("reconciles fiscal register totals and detects inconsistent documents", () => {
    const valid = buildFiscalRegister([{ documentId: 1, documentNumber: "FT 1", issueDate: new Date("2026-01-01"), customerNif: "5000000000", status: "ISSUED", ivaRegime: "GERAL", netAmount: 100, taxAmount: 14, totalAmount: 114 }]);
    expect(valid.reconciled).toBe(true);
    expect(valid.totals).toEqual({ netAmount: 100, taxAmount: 14, totalAmount: 114 });
    expect(buildFiscalRegister([{ documentId: 2, documentNumber: "FT 2", issueDate: new Date("2026-01-02"), customerNif: null, status: "ISSUED", ivaRegime: "EXCLUSAO", netAmount: 100, taxAmount: 0, totalAmount: 120 }]).reconciled).toBe(false);
  });
});
