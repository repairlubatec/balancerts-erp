import { describe, expect, it } from "vitest";
import { buildSaadiFeasibilityPdf } from "./saadi-report-pdf";

describe("relatório PDF SAADI", () => {
  it("gera um PDF válido com premissas, riscos e decisão", async () => {
    const report = await buildSaadiFeasibilityPdf({
      companyName: "Repair Lubatec",
      companyNif: "5001121871",
      studyCode: "EV-001",
      studyName: "Expansão industrial",
      investmentDomain: "INDUSTRIA",
      currency: "AOA",
      feasibility: { initialInvestment: 1000000, discountRate: 0.15, cashFlows: [300000, 350000], npv: 120000, irr: 0.22, paybackMonths: 3.5, roi: 0.65, decision: "PROSSEGUIR" },
      risks: [{ title: "Custo de construção", probability: 3, impact: 4, exposure: 12, response: "REDUZIR" }],
      decisions: [{ decision: "APROVAR", justification: "Retorno compatível com o risco.", decidedBy: 7, decisionHash: "a".repeat(64) }],
    });
    expect(report.mimeType).toBe("application/pdf");
    expect(report.buffer.subarray(0, 5).toString()).toBe("%PDF-");
    expect(report.buffer.length).toBeGreaterThan(1000);
  });
});
