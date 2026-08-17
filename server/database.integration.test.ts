import { describe, expect, it } from "vitest";
import { getAuditEventsForUserCompany, getCompaniesForUser, getDocumentsForUserCompany, getTrialBalanceForUserCompany } from "./db";

describe("database tenant integration", () => {
  it("returns no cross-tenant data for unknown user/company scopes", async () => {
    const companies = await getCompaniesForUser(987654321);
    const documents = await getDocumentsForUserCompany(987654321, 987654321);
    const trialBalance = await getTrialBalanceForUserCompany(987654321, 987654321);
    const audit = await getAuditEventsForUserCompany(987654321, 987654321);

    expect(companies).toEqual([]);
    expect(documents).toEqual([]);
    expect(trialBalance.rows).toEqual([]);
    expect(audit).toEqual([]);
  });
});

