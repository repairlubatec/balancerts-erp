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
    expect(repair?.platform).toMatchObject({ name: "BALANCERTS.ERP" });

    const exercises = await caller.companies.exercises({ companyId: 1 });
    expect(exercises.map(({ exercise }) => ({ year: exercise.year, status: exercise.status }))).toContainEqual({ year: 2023, status: "OPEN" });
    const periods = await caller.companies.periods({ companyId: 1 });
    expect(periods.map(({ period }) => ({ year: period.year, month: period.month, status: period.status, exerciseId: period.exerciseId }))).toContainEqual({ year: 2023, month: 9, status: "OPEN", exerciseId: 1 });
    expect(await caller.companies.documents({ companyId: 1 })).toEqual([]);
    expect((await caller.fiscal.complianceCalendar({ year: 2026, regime: "EXCLUSAO" })).length).toBe(0);
    expect(await caller.reports.fiscalRegister({ companyId: 1 })).toMatchObject({ entries: [], totals: { netAmount: 0, taxAmount: 0, totalAmount: 0 }, reconciled: true });
    expect(await caller.reports.agtValidation({ companyId: 1, year: 2023, month: 9 })).toMatchObject({ companyId: 1, period: { year: 2023, month: 9 }, regime: "EXCLUSAO", validation: { valid: true, errors: [] } });
    expect(await caller.reports.saftReadiness({ companyId: 1 })).toMatchObject({ format: "SAFTAO1.01_01", schemaVersion: "1.01_01", ready: false, submissionEligible: false });
    expect(await caller.reports.documentOriginReconciliation({ companyId: 1 })).toMatchObject({ companyId: 1, missingJournalDocumentIds: [], orphanJournalEntryIds: [], reconciled: true });
    expect(await caller.reports.trialBalance({ companyId: 1 })).toMatchObject({ rows: [] });
    expect(await caller.reports.journal({ companyId: 1 })).toMatchObject({ entries: [], totals: { debit: 0, credit: 0 } });
    expect(await caller.reports.ledger({ companyId: 1 })).toMatchObject({ entries: [] });
    expect(await caller.reports.incomeStatement({ companyId: 1 })).toMatchObject({ rows: [] });
    expect(await caller.reports.balanceSheet({ companyId: 1 })).toMatchObject({ rows: [] });
    expect(await caller.reports.trace({ companyId: 1, report: "TRIAL_BALANCE" })).toMatchObject({ origins: [] });
    expect(await caller.reports.vatSummary({ companyId: 1 })).toMatchObject({ rows: [], totals: { netAmount: 0, taxAmount: 0, totalAmount: 0 } });
    expect(await caller.reports.customerAging({ companyId: 1, asOf: new Date("2026-08-17T00:00:00Z") })).toMatchObject({ rows: [], totals: { outstanding: 0 } });
    expect(await caller.reports.supplierAging({ companyId: 1, asOf: new Date("2026-08-17T00:00:00Z") })).toMatchObject({ rows: [], totals: { outstanding: 0 } });
    expect((await caller.audit.list({ companyId: 1 })).length).toBeGreaterThanOrEqual(2);

    const missingCompanyId = 999999;
    expect(await caller.companies.documents({ companyId: missingCompanyId })).toEqual([]);
    expect(await caller.reports.fiscalRegister({ companyId: missingCompanyId })).toMatchObject({ entries: [], reconciled: true });
    expect(await caller.reports.trace({ companyId: missingCompanyId, report: "TRIAL_BALANCE" })).toMatchObject({ origins: [] });
    expect(await caller.reports.customerAging({ companyId: missingCompanyId, asOf: new Date("2026-08-17T00:00:00Z") })).toMatchObject({ rows: [], totals: { outstanding: 0 } });
    expect(await caller.reports.supplierAging({ companyId: missingCompanyId, asOf: new Date("2026-08-17T00:00:00Z") })).toMatchObject({ rows: [], totals: { outstanding: 0 } });
    await expect(caller.reports.saftReadiness({ companyId: missingCompanyId })).rejects.toThrow("COMPANY_NOT_FOUND_OR_FORBIDDEN");
    expect(await caller.reports.documentOriginReconciliation({ companyId: missingCompanyId })).toMatchObject({ companyId: missingCompanyId, missingJournalDocumentIds: [], orphanJournalEntryIds: [], reconciled: true });
    await expect(caller.companies.activate({ companyId: missingCompanyId, confirmation: "ACTIVATE_COMPANY" })).rejects.toThrow();
  }, 15000);
});
