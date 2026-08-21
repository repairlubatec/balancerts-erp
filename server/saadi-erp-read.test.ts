import { describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({
  getCompaniesForUser: vi.fn(async () => [{ company: { id: 20, organizationId: 10, name: "Repair Lubatec", nif: "5001121871" } }]),
  getTrialBalanceForUserCompany: vi.fn(async () => [{ accountCode: "4511", debit: 100, credit: 0 }]),
  getIncomeStatementForUserCompany: vi.fn(async () => ({ revenue: 1000, expenses: 400 })),
  getBalanceSheetForUserCompany: vi.fn(async () => ({ assets: 2000, liabilities: 500 })),
}));

import { readSaadiAccountingSummary, readSaadiCompanyContext } from "./saadi-erp-read";

describe("adaptador de leitura ERP para SAADI", () => {
  it("devolve contexto ERP classificado como realizado e com hash", async () => {
    const result = await readSaadiCompanyContext(7, 20);
    expect(result.organizationId).toBe(10);
    expect(result.companyId).toBe(20);
    expect(result.dataClass).toBe("ACTUAL_REALIZED");
    expect(result.authority).toBe("ERP");
    expect(result.integrityHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("bloqueia empresa fora do contexto autorizado", async () => {
    await expect(readSaadiCompanyContext(7, 999)).rejects.toThrow("SAADI_ERP_COMPANY_NOT_FOUND_OR_FORBIDDEN");
  });

  it("reutiliza os três relatórios contabilísticos sem escrever no ERP", async () => {
    const result = await readSaadiAccountingSummary(7, 20, 3);
    expect(result.sourceService).toBe("accounting.read");
    expect(result.data.periodId).toBe(3);
    expect(result.data.trialBalance).toHaveLength(1);
    expect(result.dataClass).toBe("ACTUAL_REALIZED");
  });
});
