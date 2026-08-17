import { describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";
import { businessDocuments, journalEntries, stockMovements } from "../drizzle/schema";
import { getCompanyActivationTransition, getDb, getAuditEventsForUserCompany } from "./db";
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
  it("proves the PENDING to READY activation transition and rejects reactivation", async () => {
    expect(getCompanyActivationTransition("PENDING")).toEqual({ before: "PENDING", after: "READY" });
    expect(() => getCompanyActivationTransition("READY")).toThrow("COMPANY_ALREADY_READY");

    const db = await getDb();
    expect(db).toBeTruthy();
    const beforeAudits = await getAuditEventsForUserCompany(1, 1, "company", "1");
    const result = await appRouter.createCaller(adminContext()).companies.activate({ companyId: 1, confirmation: "ACTIVATE_COMPANY" }).catch((error: Error) => error);
    expect(result).toMatchObject({ message: "COMPANY_ALREADY_READY" });
    const afterAudits = await getAuditEventsForUserCompany(1, 1, "company", "1");
    expect(afterAudits.length).toBe(beforeAudits.length);
  });

  it("preserves zero operational records when reactivation is rejected", async () => {
    const db = await getDb();
    expect(db).toBeTruthy();
    const count = async (table: any) => Number((await db!.select({ count: sql<number>`count(*)` }).from(table).where(eq(table.companyId, 1)))[0]?.count ?? 0);
    const beforeCounts = { documents: await count(businessDocuments), entries: await count(journalEntries), stock: await count(stockMovements) };
    await expect(appRouter.createCaller(adminContext()).companies.activate({ companyId: 1, confirmation: "ACTIVATE_COMPANY" })).rejects.toThrow("COMPANY_ALREADY_READY");
    expect({ documents: await count(businessDocuments), entries: await count(journalEntries), stock: await count(stockMovements) }).toEqual(beforeCounts);
  });

  it("reads every relevant tenant-aware surface without creating transactions", async () => {
    const caller = appRouter.createCaller(adminContext());
    const companies = await caller.companies.list();
    const repair = companies.find(({ company }) => company.nif === "5001121871");
    expect(repair?.company).toMatchObject({ id: 1, configurationStatus: "READY", primaryLegalRepresentative: "Fausto Silva" });

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
