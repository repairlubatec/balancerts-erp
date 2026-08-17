import { describe, expect, it } from "vitest";
import { assertClosedFiscalPeriodForUserCompany, assertFiscalPeriodForUserCompany, createFileAsset, getAuditEventsForUserCompany, getBalanceSheetForUserCompany, getCompaniesForUser, getDb, getDocumentsForUserCompany, getFiscalRegisterForUserCompany, getIncomeStatementForUserCompany, getJournalForUserCompany, getLedgerForUserCompany, getReportTraceForUserCompany, getTrialBalanceForUserCompany, getVatSummaryForUserCompany, postJournalEntry, recordStockMovement, reconcileStockForUserCompany, reserveDocumentNumber, transitionBusinessDocument } from "./db";

describe("database tenant integration", () => {
  it("reads Repair Lubatec without exposing operational records", async () => {
    expect(await getDb()).toBeTruthy();
    const companies = await getCompaniesForUser(1);
    const repair = companies.find(({ company }) => company.nif === "5001121871");
    expect(repair?.company).toMatchObject({ name: "Repair Lubatec", ivaRegime: "EXCLUSAO", functionalCurrency: "AOA", configurationStatus: "READY" });
    expect(await getDocumentsForUserCompany(1, repair!.company.id)).toEqual([]);
    const trialBalance = await getTrialBalanceForUserCompany(1, repair!.company.id);
    const journal = await getJournalForUserCompany(1, repair!.company.id);
    const ledger = await getLedgerForUserCompany(1, repair!.company.id);
    const incomeStatement = await getIncomeStatementForUserCompany(1, repair!.company.id);
    const balanceSheet = await getBalanceSheetForUserCompany(1, repair!.company.id);
    const fiscalRegister = await getFiscalRegisterForUserCompany(1, repair!.company.id);
    const vatSummary = await getVatSummaryForUserCompany(1, repair!.company.id);
    expect(trialBalance).toMatchObject({ rows: [], reconciled: true });
    expect(journal).toMatchObject({ entries: [], totals: { debit: 0, credit: 0 } });
    expect(ledger).toMatchObject({ entries: [], closingBalance: 0 });
    expect(incomeStatement).toMatchObject({ rows: [], revenue: 0, expenses: 0, netIncome: 0 });
    expect(balanceSheet).toMatchObject({ rows: [], assets: 0, liabilities: 0, netIncome: 0, reconciled: true });
    expect(fiscalRegister).toMatchObject({ entries: [], totals: { netAmount: 0, taxAmount: 0, totalAmount: 0 }, reconciled: true });
    expect(vatSummary).toMatchObject({ rows: [], totals: { netAmount: 0, taxAmount: 0, totalAmount: 0 } });
    expect(await reconcileStockForUserCompany({ userId: 1, companyId: repair!.company.id, inventoryAccountId: 999999 })).toMatchObject({ reconciled: true, difference: 0 });
  });

  it("rejects incomplete critical mutations after Repair Lubatec activation", async () => {
    await expect(reserveDocumentNumber({ userId: 1, companyId: 1, series: "FT", documentType: "FT" })).rejects.toThrow();
    await expect(transitionBusinessDocument({ userId: 1, companyId: 1, documentId: 999999, to: "ISSUED" })).rejects.toThrow();
    await expect(postJournalEntry({ companyId: 1, periodId: 1, createdBy: 1, idempotencyKey: "ready-company-guard", description: "Não deve ser criado", lines: [{ accountId: 1, debit: 10, credit: 0 }, { accountId: 2, debit: 0, credit: 10 }] })).rejects.toThrow();
    await expect(postJournalEntry({ companyId: 1, periodId: 1, sourceDocumentId: 999999, createdBy: 1, idempotencyKey: "missing-source-document", description: "Não deve ser criado", lines: [{ accountId: 1, debit: 10, credit: 0 }, { accountId: 2, debit: 0, credit: 10 }] })).rejects.toThrow("SOURCE_DOCUMENT_NOT_FOUND_OR_FORBIDDEN");
    await expect(postJournalEntry({ companyId: 1, periodId: 1, reversalOfEntryId: 999999, createdBy: 1, idempotencyKey: "missing-reversal-entry", description: "Não deve ser criado", lines: [{ accountId: 1, debit: 10, credit: 0 }, { accountId: 2, debit: 0, credit: 10 }] })).rejects.toThrow("REVERSAL_ENTRY_NOT_FOUND_OR_FORBIDDEN");
  });

  it("rejects forged organization scope before stock and file writes", async () => {
    const companies = await getCompaniesForUser(1);
    const repair = companies.find(({ company }) => company.nif === "5001121871");
    await expect(recordStockMovement({ userId: 1, organizationId: 999999, companyId: repair!.company.id, periodId: 1, productCode: "FORGED-SCOPE", type: "IN", quantity: 1, unitCost: 1, correlationId: "forged-org-stock" })).rejects.toThrow();
    await expect(createFileAsset({ userId: 1, organizationId: 999999, companyId: repair!.company.id, storageKey: "forged/scope", filename: "forged.txt", mimeType: "text/plain", size: 1, sha256: "0".repeat(64) })).rejects.toThrow();
    await expect(assertFiscalPeriodForUserCompany({ actorUserId: 1, companyId: repair!.company.id, periodId: 999999 })).rejects.toThrow("FISCAL_PERIOD_NOT_FOUND_OR_FORBIDDEN");
    await expect(assertClosedFiscalPeriodForUserCompany({ actorUserId: 1, companyId: repair!.company.id, periodId: 1 })).rejects.toThrow("FISCAL_PERIOD_NOT_CLOSED_OR_FORBIDDEN");
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

