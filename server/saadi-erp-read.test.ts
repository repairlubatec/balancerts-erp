import { describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({
  getCompaniesForUser: vi.fn(async () => [{ company: { id: 20, organizationId: 10, name: "Repair Lubatec", nif: "5001121871" } }]),
  getTrialBalanceForUserCompany: vi.fn(async () => [{ accountCode: "4511", debit: 100, credit: 0 }]),
  getIncomeStatementForUserCompany: vi.fn(async () => ({ revenue: 1000, expenses: 400 })),
  getBalanceSheetForUserCompany: vi.fn(async () => ({ assets: 2000, liabilities: 500 })),
  getDb: vi.fn(async () => ({ select: () => ({ from: () => ({ where: () => ({ orderBy: () => ({ limit: async () => [] }) }) }) }) })),
}));

import { readSaadiAccountingSummary, readSaadiCompanyContext, readSaadiPgcNormativeContext } from "./saadi-erp-read";

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

  it("não expõe contas quando não existe versão PGCA activa", async () => {
    const result = await readSaadiPgcNormativeContext(7, 20);
    expect(result.sourceService).toBe("pgc.normative.read");
    expect(result.data.confirmedOnly).toBe(true);
    expect(result.data.available).toBe(false);
    expect(result.data.accounts).toEqual([]);
  });

  it("reutiliza os três relatórios contabilísticos sem escrever no ERP", async () => {
    const result = await readSaadiAccountingSummary(7, 20, 3);
    expect(result.sourceService).toBe("accounting.read");
    expect(result.data.periodId).toBe(3);
    expect(result.data.trialBalance).toHaveLength(1);
    expect(result.dataClass).toBe("ACTUAL_REALIZED");
  });
});

  it("não contém operações de inserção, actualização ou eliminação no ERP", async () => {
    const source = await import("node:fs/promises").then((fs) => fs.readFile(new URL("./saadi-erp-read.ts", import.meta.url), "utf8"));
    expect(source).not.toMatch(/\bdb\.(insert|update|delete)\s*\(/);
  });
