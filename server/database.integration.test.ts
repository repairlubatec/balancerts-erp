import { describe, expect, it } from "vitest";
import { getAuditEventsForUserCompany, getCompaniesForUser, getDocumentsForUserCompany, getTrialBalanceForUserCompany, reconcileStockForUserCompany } from "./db";

describe("database tenant integration", () => {
  it("returns no cross-tenant data for unknown user/company scopes", async () => {
    const companies = await getCompaniesForUser(987654321);
    const documents = await getDocumentsForUserCompany(987654321, 987654321);
    const trialBalance = await getTrialBalanceForUserCompany(987654321, 987654321);
    const audit = await getAuditEventsForUserCompany(987654321, 987654321);
    const stock = await reconcileStockForUserCompany({ userId: 987654321, companyId: 987654321, inventoryAccountId: 987654321 });

    expect(companies).toEqual([]);
    expect(documents).toEqual([]);
    expect(trialBalance.rows).toEqual([]);
    expect(audit).toEqual([]);
    expect(stock).toMatchObject({ reconciled: true, difference: 0 });
  });
});

