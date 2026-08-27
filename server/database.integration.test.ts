import { describe, expect, it } from "vitest";
import { assertClosedFiscalPeriodForUserCompany, assertFiscalPeriodForUserCompany, createFileAsset, getAuditEventsForUserCompany, getBalanceSheetForUserCompany, getCompaniesForUser, getDb, getDocumentsForUserCompany, getFiscalRegisterForUserCompany, getIncomeStatementForUserCompany, getJournalForUserCompany, getLedgerForUserCompany, getReportTraceForUserCompany, getReportsReconciliationForUserCompany, getSaftReadinessForUserCompany, getTrialBalanceForUserCompany, getVatSummaryForUserCompany, postJournalEntry, recordStockMovement, reconcileStockForUserCompany, reserveDocumentNumber, transitionBusinessDocument } from "./db";

describe("database tenant integration", () => {
  it("reads Repair Lubatec without exposing operational records", async () => {
    expect(await getDb()).toBeTruthy();
    const companies = await getCompaniesForUser(1);
    const repair = companies.find(({ company }) => company.nif === "5001121871");
    expect(repair?.company).toMatchObject({ name: "Repair Lubatec", ivaRegime: "EXCLUSAO", functionalCurrency: "AOA", configurationStatus: "READY" });
    const documents = await getDocumentsForUserCompany(1, repair!.company.id);
    expect(documents.every(({ document }) => document.companyId === repair!.company.id)).toBe(true);
    const trialBalance = await getTrialBalanceForUserCompany(1, repair!.company.id);
    const journal = await getJournalForUserCompany(1, repair!.company.id);
    const ledger = await getLedgerForUserCompany(1, repair!.company.id);
    const incomeStatement = await getIncomeStatementForUserCompany(1, repair!.company.id);
    const balanceSheet = await getBalanceSheetForUserCompany(1, repair!.company.id);
    const fiscalRegister = await getFiscalRegisterForUserCompany(1, repair!.company.id);
    const vatSummary = await getVatSummaryForUserCompany(1, repair!.company.id);
    expect(trialBalance.reconciled).toBe(true);
    expect(trialBalance.rows).toEqual(expect.arrayContaining([
      expect.objectContaining({ accountCode: "45.1.1", debit: 50000, credit: 0 }),
      expect.objectContaining({ accountCode: "61.3.1", debit: 0, credit: 50000 }),
    ]));
    expect(journal.totals).toMatchObject({ debit: 50000, credit: 50000 });
    expect(ledger.entries.length).toBeGreaterThan(0);
    expect(incomeStatement.revenue).toBeGreaterThanOrEqual(0);
    expect(balanceSheet.reconciled).toBe(true);
    expect(fiscalRegister.reconciled).toBe(true);
    expect(vatSummary.totals).toEqual(expect.objectContaining({ netAmount: expect.any(Number), taxAmount: expect.any(Number), totalAmount: expect.any(Number) }));
    expect(await reconcileStockForUserCompany({ userId: 1, companyId: repair!.company.id, inventoryAccountId: 999999 })).toMatchObject({ reconciled: true, difference: 0 });
    const reconciliation = await getReportsReconciliationForUserCompany(1, repair!.company.id);
    expect(reconciliation).toMatchObject({ companyId: repair!.company.id, checks: { trialBalance: true, journal: true, balanceSheet: true, vat: true, fiscalRegister: true } });
    expect(reconciliation.reconciled).toBe(reconciliation.documentOrigin.reconciled && Object.values(reconciliation.checks).every(Boolean));
    expect(reconciliation.documentOrigin.orphanJournalEntryIds).toEqual([]);
    const saft = await getSaftReadinessForUserCompany(1, repair!.company.id);
    expect(saft).toMatchObject({ format: "SAFTAO1.01_01", ready: false, submissionEligible: false });
    expect(saft.missing).toEqual(expect.arrayContaining(["MASTERFILES_SUPPLIERS", "MASTERFILES_PRODUCTS"]));
    expect(saft.missing).not.toContain("MASTERFILES_CUSTOMERS");
    expect(saft.missing).not.toContain("MASTERFILES_TAX_TABLES");
  }, 15000);

  it("rejects incomplete critical mutations after Repair Lubatec activation", async () => {
    await expect(reserveDocumentNumber({ userId: 1, companyId: 1, series: "UNCONFIGURED", documentType: "FT" })).rejects.toThrow();
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

  it("rejects accounting posting outside tenant scope before insertion", async () => {
    const lines = [{ accountId: 1, debit: 10, credit: 0 }, { accountId: 2, debit: 0, credit: 10 }];
    await expect(postJournalEntry({ companyId: 1, periodId: 1, createdBy: 987654321, idempotencyKey: "cross-tenant-post", description: "Não deve ser criado", lines })).rejects.toThrow("COMPANY_NOT_FOUND_OR_FORBIDDEN");
    await expect(postJournalEntry({ companyId: 1, periodId: 999999, createdBy: 1, idempotencyKey: "missing-period-post", description: "Não deve ser criado", lines })).rejects.toThrow("FISCAL_PERIOD_NOT_FOUND_OR_FORBIDDEN");
  });

  it("validates persisted audit shape for the real tenant", async () => {
    const rows = await getAuditEventsForUserCompany(1, 1);
    expect(rows.length).toBeGreaterThan(0);
    for (const { event } of rows) {
      expect(event.actorUserId).toBe(1);
      expect(event.organizationId).toBe(1);
      expect(event.companyId).toBe(1);
      expect(event.entityType).toBeTruthy();
      expect(event.entityId).toBeTruthy();
      expect(event.action).toBeTruthy();
      expect(event.correlationId).toBeTruthy();
      expect(event).toHaveProperty("beforeState");
      expect(event.afterState).toBeTruthy();
    }
    const first = rows[0].event;
    const reconstructed = await getAuditEventsForUserCompany(1, 1, first.entityType, first.entityId);
    expect(reconstructed.length).toBeGreaterThan(0);
    expect(reconstructed.every(({ event }) => event.entityType === first.entityType && event.entityId === first.entityId)).toBe(true);
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
    const reconciliation = await getReportsReconciliationForUserCompany(987654321, 987654321);
    await expect(getSaftReadinessForUserCompany(987654321, 987654321)).rejects.toThrow("COMPANY_NOT_FOUND_OR_FORBIDDEN");

    expect(companies).toEqual([]);
    expect(documents).toEqual([]);
    expect(trialBalance.rows).toEqual([]);
    expect(audit).toEqual([]);
    expect(entityAudit).toEqual([]);
    expect(stock).toMatchObject({ reconciled: true, difference: 0 });
    expect(trace).toMatchObject({ report: "TRIAL_BALANCE", accountCode: "11.1", origins: [] });
    expect(reconciliation).toMatchObject({ companyId: 987654321, reconciled: true, checks: { trialBalance: true, journal: true, balanceSheet: true, vat: true, fiscalRegister: true } });
  });
});

