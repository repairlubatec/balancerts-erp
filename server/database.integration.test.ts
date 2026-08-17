import { describe, expect, it } from "vitest";
import { getAuditEventsForUserCompany, getCompaniesForUser, getDb, getDocumentsForUserCompany, getReportTraceForUserCompany, getTrialBalanceForUserCompany, postJournalEntry, reconcileStockForUserCompany, reserveDocumentNumber, transitionBusinessDocument } from "./db";

describe("database tenant integration", () => {
  it("reads Repair Lubatec without exposing operational records", async () => {
    expect(await getDb()).toBeTruthy();
    const companies = await getCompaniesForUser(1);
    const repair = companies.find(({ company }) => company.nif === "5001121871");
    expect(repair?.company).toMatchObject({ name: "Repair Lubatec", ivaRegime: "EXCLUSAO", functionalCurrency: "AOA", configurationStatus: "PENDING" });
    expect(await getDocumentsForUserCompany(1, repair!.company.id)).toEqual([]);
    expect(await getTrialBalanceForUserCompany(1, repair!.company.id)).toMatchObject({ rows: [] });
    expect(await reconcileStockForUserCompany({ userId: 1, companyId: repair!.company.id, inventoryAccountId: 999999 })).toMatchObject({ reconciled: true, difference: 0 });
  });

  it("rejects critical mutations while Repair Lubatec remains PENDING", async () => {
    await expect(reserveDocumentNumber({ userId: 1, companyId: 1, series: "FT", documentType: "FT" })).rejects.toThrow("COMPANY_CONFIGURATION_PENDING");
    await expect(transitionBusinessDocument({ userId: 1, companyId: 1, documentId: 999999, to: "ISSUED" })).rejects.toThrow("COMPANY_CONFIGURATION_PENDING");
    await expect(postJournalEntry({ companyId: 1, periodId: 1, createdBy: 1, idempotencyKey: "pending-company-guard", description: "Não deve ser criado", lines: [{ accountId: 1, debit: 10, credit: 0 }, { accountId: 2, debit: 0, credit: 10 }] })).rejects.toThrow("COMPANY_CONFIGURATION_PENDING");
  });

  it("returns no cross-tenant data for unknown user/company scopes", async () => {
    expect(await getDb()).toBeTruthy();
    const companies = await getCompaniesForUser(987654321);
    const documents = await getDocumentsForUserCompany(987654321, 987654321);
    const trialBalance = await getTrialBalanceForUserCompany(987654321, 987654321);
    const audit = await getAuditEventsForUserCompany(987654321, 987654321);
    const entityAudit = await getAuditEventsForUserCompany(987654321, 987654321, "journalEntry", "99");
    const stock = await reconcileStockForUserCompany({ userId: 987654321, companyId: 987654321, inventoryAccountId: 987654321 });
    const trace = await getReportTraceForUserCompany(987654321, 987654321, "TRIAL_BALANCE", "11.1");

    expect(companies).toEqual([]);
    expect(documents).toEqual([]);
    expect(trialBalance.rows).toEqual([]);
    expect(audit).toEqual([]);
    expect(entityAudit).toEqual([]);
    expect(stock).toMatchObject({ reconciled: true, difference: 0 });
    expect(trace).toMatchObject({ report: "TRIAL_BALANCE", accountCode: "11.1", origins: [] });
  });
});

