import { describe, expect, it } from "vitest";
import { resolveCandidateAccountName } from "./PgcReportSimulationPanel";

describe("PgcReportSimulationPanel", () => {
  it("resolves candidate names by exact account code and keeps the report fallback", () => {
    const accounts = [{ code: "45.1.1", name: "Caixa Kwanza" }];
    expect(resolveCandidateAccountName("45.1.1", accounts, "Caixa antiga")).toBe("Caixa Kwanza");
    expect(resolveCandidateAccountName("61.3.1", accounts, "Mercadorias")).toBe("Mercadorias");
  });
});
