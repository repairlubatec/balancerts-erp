import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function adminContext(): TrpcContext {
  return {
    user: { id: 1, openId: "MSeLNDb6a4WAPVnEQYiGpH", name: "Repair Lubatec", email: "repairlubatec@gmail.com", loginMethod: "test", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("Repair Lubatec router integration", () => {
  it("reads every relevant tenant-aware surface without creating transactions", async () => {
    const caller = appRouter.createCaller(adminContext());
    const companies = await caller.companies.list();
    const repair = companies.find(({ company }) => company.nif === "5001121871");
    expect(repair?.company).toMatchObject({ id: 1, configurationStatus: "PENDING", primaryLegalRepresentative: "Fausto Silva" });

    const periods = await caller.companies.periods({ companyId: 1 });
    expect(periods.map(({ period }) => ({ year: period.year, month: period.month, status: period.status }))).toContainEqual({ year: 2023, month: 9, status: "OPEN" });
    expect(await caller.companies.documents({ companyId: 1 })).toEqual([]);
    expect(await caller.reports.trialBalance({ companyId: 1 })).toMatchObject({ rows: [] });
    expect(await caller.reports.journal({ companyId: 1 })).toMatchObject({ entries: [], totals: { debit: 0, credit: 0 } });
    expect(await caller.reports.ledger({ companyId: 1 })).toMatchObject({ entries: [] });
    expect(await caller.reports.incomeStatement({ companyId: 1 })).toMatchObject({ rows: [] });
    expect(await caller.reports.balanceSheet({ companyId: 1 })).toMatchObject({ rows: [] });
    expect(await caller.reports.trace({ companyId: 1, report: "TRIAL_BALANCE" })).toMatchObject({ origins: [] });
    expect(await caller.reports.vatSummary({ companyId: 1 })).toMatchObject({ rows: [], totals: { netAmount: 0, taxAmount: 0, totalAmount: 0 } });
    expect((await caller.audit.list({ companyId: 1 })).length).toBeGreaterThanOrEqual(2);
  });
});
