import { and, eq, isNull, like } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { auditEvents, businessDocuments, chartAccounts, companies, documentSeries, fileAssets, fiscalExercises, fiscalPeriods, journalEntries, journalLines, stockMovements } from "../drizzle/schema";
import { createFileAsset, getDb, getReportsReconciliationForUserCompany, getDocumentAccountingChainForUserCompany, getAuditEventsForUserCompany, postJournalEntry, recordStockMovement, reserveDocumentNumber, transitionBusinessDocument } from "./db";

const TEST_USER_ID = 1;
const TEST_COMPANY_ID = 30001;
const TEST_ORGANIZATION_ID = 1;

const caller = appRouter.createCaller({
  user: { id: TEST_USER_ID, role: "admin", openId: "disposable-e2e", name: "Disposable E2E" },
  req: {} as never,
  res: {} as never,
});

describe("disposable tenant persisted E2E cycle", () => {
  it("reserves, emits, posts, reconciles, closes and reopens without touching Repair Lubatec", async () => {
    const db = await getDb();
    expect(db).toBeTruthy();
    await db!.update(fiscalPeriods).set({ status: "OPEN", closedAt: null }).where(and(eq(fiscalPeriods.companyId, TEST_COMPANY_ID), eq(fiscalPeriods.year, 2026), eq(fiscalPeriods.month, 1)));
    const periodRows = await db!.select({ id: fiscalPeriods.id }).from(fiscalPeriods).where(and(eq(fiscalPeriods.companyId, TEST_COMPANY_ID), eq(fiscalPeriods.year, 2026), eq(fiscalPeriods.month, 1)));
    const periodId = periodRows[0]?.id;
    expect(periodId).toBeTruthy();
    const accountRows = await db!.select({ id: chartAccounts.id, code: chartAccounts.code }).from(chartAccounts).where(eq(chartAccounts.companyId, TEST_COMPANY_ID));
    const debitAccount = accountRows.find((row) => row.code === "11.1");
    const creditAccount = accountRows.find((row) => row.code === "71.1");
    expect(debitAccount).toBeTruthy();
    expect(creditAccount).toBeTruthy();

    let documentId: number | undefined;
    let entryId: number | undefined;
    let orphanEntryId: number | undefined;
    let recoveryEntryId: number | undefined;
    let movementId: number | undefined;
    let fileId: number | undefined;
    let depreciationEntryId: number | undefined;
    let reversalEntryId: number | undefined;
    let createdCompanyId: number | undefined;
    let createdExerciseId: number | undefined;
    let createdPeriodId: number | undefined;
    let createdSeriesId: number | undefined;
    const correlation = `disposable-e2e-${Date.now()}`;
    try {
      const createdCompany = await caller.companies.create({ name: "BALANCERTS Audit Disposable", nif: `999${Date.now().toString().slice(-7)}`, functionalCurrency: "AOA", ivaRegime: "EXCLUSAO", legalForm: "Sociedade por Quotas", address: "Morada E2E", municipality: "Lubango", province: "Huíla", phone: "+244900000000", email: `audit-${Date.now()}@example.invalid`, activity: "Prestação de Serviço", incorporationYear: 2026, legalRepresentatives: "Representante E2E" });
      createdCompanyId = createdCompany.company.id;
      await caller.companies.setPrimaryRepresentative({ companyId: createdCompanyId, representative: "Representante E2E" });
      const createdExercise = await caller.companies.createExercise({ companyId: createdCompanyId, year: 2026 });
      createdExerciseId = createdExercise.exercise.id;
      const createdPeriod = await caller.companies.createPeriod({ companyId: createdCompanyId, year: 2026, month: 1 });
      createdPeriodId = createdPeriod.period.id;
      const createdSeries = await caller.documents.createSeries({ companyId: createdCompanyId, code: "FT-E2E", documentType: "FT", nextNumber: 1 });
      createdSeriesId = createdSeries.series.id;
      const activatedDisposable = await caller.companies.activate({ companyId: createdCompanyId, confirmation: "ACTIVATE_COMPANY" });
      expect(activatedDisposable).toMatchObject({ companyId: createdCompanyId, configurationStatus: "READY" });
      const companyAudit = await getAuditEventsForUserCompany(TEST_USER_ID, createdCompanyId);
      expect(companyAudit.some(({ event }) => event.action === "COMPANY_CREATED_PENDING" && event.entityId === String(createdCompanyId))).toBe(true);
      expect(companyAudit.some(({ event }) => event.action === "COMPANY_ACTIVATED" && event.entityId === String(createdCompanyId))).toBe(true);
      for (const { event } of companyAudit.filter(({ event }) => ["COMPANY_CREATED_PENDING", "COMPANY_ACTIVATED"].includes(event.action))) {
        expect(event.actorUserId).toBe(TEST_USER_ID);
        expect(event.companyId).toBe(createdCompanyId);
        expect(event.createdAt).toBeTruthy();
        expect(event.afterState).toBeTruthy();
        expect(() => JSON.parse(event.afterState!)).not.toThrow();
      }

      const reservation = await reserveDocumentNumber({ userId: TEST_USER_ID, companyId: TEST_COMPANY_ID, series: "FT-TEST", documentType: "FT" });
      expect(reservation.formatted).toMatch(/^FT-TEST\/\d{6}$/);

      const insertedDocument = await db!.insert(businessDocuments).values({
        companyId: TEST_COMPANY_ID,
        documentNumber: reservation.formatted,
        series: "FT-TEST",
        status: "DRAFT",
        documentType: "FT",
        customerName: "Contraparte E2E descartável",
        counterpartyType: "CUSTOMER",
        ivaRegime: "EXCLUSAO",
        netAmount: "100.00",
        taxAmount: "0.00",
        totalAmount: "100.00",
        dueDate: new Date("2026-02-01T00:00:00.000Z"),
        settledAmount: "0.00",
        createdBy: TEST_USER_ID,
      });
      documentId = Number(insertedDocument[0].insertId);

      await transitionBusinessDocument({ userId: TEST_USER_ID, companyId: TEST_COMPANY_ID, documentId, to: "VALIDATED", correlationId: `${correlation}:validated` });
      await transitionBusinessDocument({ userId: TEST_USER_ID, companyId: TEST_COMPANY_ID, documentId, to: "ISSUED", correlationId: `${correlation}:issued` });
      const issuedDocument = await db!.select({ immutableHash: businessDocuments.immutableHash, status: businessDocuments.status }).from(businessDocuments).where(and(eq(businessDocuments.id, documentId), eq(businessDocuments.companyId, TEST_COMPANY_ID))).limit(1);
      expect(issuedDocument[0]).toMatchObject({ status: "ISSUED" });
      expect(issuedDocument[0]?.immutableHash).toMatch(/^[a-f0-9]{64}$/);
      const posting = await postJournalEntry({
        companyId: TEST_COMPANY_ID,
        periodId: periodId!,
        sourceDocumentId: documentId,
        idempotencyKey: `${correlation}:post`,
        description: reservation.formatted,
        createdBy: TEST_USER_ID,
        lines: [
          { accountId: debitAccount!.id, debit: 100, credit: 0, postable: true, validFrom: new Date("2026-01-01") },
          { accountId: creditAccount!.id, debit: 0, credit: 100, postable: true, validFrom: new Date("2026-01-01") },
        ],
      });
      entryId = Number(posting.entryId);
      expect(entryId).toBeGreaterThan(0);
      await transitionBusinessDocument({ userId: TEST_USER_ID, companyId: TEST_COMPANY_ID, documentId, to: "ACCOUNTED", correlationId: `${correlation}:accounted` });

      const movement = await recordStockMovement({ userId: TEST_USER_ID, organizationId: TEST_ORGANIZATION_ID, companyId: TEST_COMPANY_ID, periodId: periodId!, productCode: "E2E-DISPOSABLE", type: "IN", quantity: 1, unitCost: 100, sourceDocumentId: documentId, journalEntryId: entryId, correlationId: `${correlation}:stock` });
      movementId = Number(movement.id);
      expect(movementId).toBeGreaterThan(0);

      const reconciliation = await getReportsReconciliationForUserCompany(TEST_USER_ID, TEST_COMPANY_ID);
      expect(reconciliation).toMatchObject({ companyId: TEST_COMPANY_ID, reconciled: true, documentOrigin: { reconciled: true, missingJournalDocumentIds: [], orphanJournalEntryIds: [] } });
      const [trialBalance, journal, ledger, incomeStatement, balanceSheet, fiscalRegister, vatSummary, ageing, supplierAging, trace, agtValidation, saftReadiness] = await Promise.all([
        caller.reports.trialBalance({ companyId: TEST_COMPANY_ID }),
        caller.reports.journal({ companyId: TEST_COMPANY_ID }),
        caller.reports.ledger({ companyId: TEST_COMPANY_ID, accountCode: "11.1" }),
        caller.reports.incomeStatement({ companyId: TEST_COMPANY_ID }),
        caller.reports.balanceSheet({ companyId: TEST_COMPANY_ID }),
        caller.reports.fiscalRegister({ companyId: TEST_COMPANY_ID }),
        caller.reports.vatSummary({ companyId: TEST_COMPANY_ID }),
        caller.reports.customerAging({ companyId: TEST_COMPANY_ID, asOf: new Date("2026-01-31T23:59:59Z") }),
        caller.reports.supplierAging({ companyId: TEST_COMPANY_ID, asOf: new Date("2026-01-31T23:59:59Z") }),
        caller.reports.trace({ companyId: TEST_COMPANY_ID, report: "TRIAL_BALANCE", accountCode: "11.1" }),
        caller.reports.agtValidation({ companyId: TEST_COMPANY_ID, year: 2026, month: 1 }),
        caller.reports.saftReadiness({ companyId: TEST_COMPANY_ID }),
      ]);
      expect(trialBalance.reconciled).toBe(true);
      expect(journal.entries.some((entry) => entry.entryId === entryId)).toBe(true);
      expect(ledger.entries.some((row) => row.entryId === entryId)).toBe(true);
      expect(incomeStatement.netIncome).toBe(100);
      expect(balanceSheet.reconciled).toBe(true);
      expect(fiscalRegister.entries).toHaveLength(1);
      expect(vatSummary.totals).toEqual({ netAmount: 100, taxAmount: 0, totalAmount: 100 });
      expect(ageing.totals.outstanding).toBe(100);
      expect(supplierAging.totals.outstanding).toBe(0);
      expect(fiscalRegister.reconciled).toBe(true);
      expect(vatSummary.reconciled).toBe(true);
      expect(balanceSheet.rows.some((row) => row.accountCode === "11.1")).toBe(true);
      expect(trace.origins.some((origin) => origin.entryId === entryId && origin.sourceDocumentId === documentId)).toBe(true);
      expect(agtValidation.validation.valid).toBe(true);
      expect(saftReadiness.submissionEligible).toBe(false);

      const chainBeforeReversal = await getDocumentAccountingChainForUserCompany(TEST_USER_ID, TEST_COMPANY_ID, documentId);
      expect(chainBeforeReversal?.entries[0]?.entryId).toBe(entryId);
      const file = await createFileAsset({ userId: TEST_USER_ID, organizationId: TEST_ORGANIZATION_ID, companyId: TEST_COMPANY_ID, storageKey: `${correlation}:file`, filename: "e2e.txt", mimeType: "text/plain", size: 3, sha256: "a".repeat(64) });
      fileId = Number(file.id);
      const depreciation = await caller.fixedAssets.postDepreciation({ organizationId: TEST_ORGANIZATION_ID, companyId: TEST_COMPANY_ID, periodId: periodId!, assetId: 9001, amount: 10, expenseAccountId: debitAccount!.id, accumulatedDepreciationAccountId: creditAccount!.id, correlationId: `${correlation}:depreciation` });
      depreciationEntryId = Number(depreciation.entry.entryId);
      const reversal = await caller.reversal.post({ companyId: TEST_COMPANY_ID, periodId: periodId!, originalEntryId: entryId!, reason: "Correcção E2E auditável", idempotencyKey: `${correlation}:reversal`, lines: [{ accountId: debitAccount!.id, debit: 100, credit: 0, currency: "AOA", exchangeRate: 1, postable: true, validFrom: new Date("2026-01-01") }, { accountId: creditAccount!.id, debit: 0, credit: 100, currency: "AOA", exchangeRate: 1, postable: true, validFrom: new Date("2026-01-01") }] });
      reversalEntryId = Number(reversal.entryId);
      const orphanInserted = await db!.insert(journalEntries).values({ companyId: TEST_COMPANY_ID, periodId: periodId!, sourceDocumentId: 999999, idempotencyKey: `${correlation}:orphan`, description: "Lançamento órfão temporário", createdBy: TEST_USER_ID, status: "POSTED" });
      orphanEntryId = Number(orphanInserted[0].insertId);
      await db!.insert(journalLines).values([
        { entryId: orphanEntryId, accountId: debitAccount!.id, debit: "5.00", credit: "0.00", currency: "AOA", exchangeRate: "1.00000000" },
        { entryId: orphanEntryId, accountId: creditAccount!.id, debit: "0.00", credit: "5.00", currency: "AOA", exchangeRate: "1.00000000" },
      ]);
      const divergent = await getReportsReconciliationForUserCompany(TEST_USER_ID, TEST_COMPANY_ID);
      expect(divergent).toMatchObject({ reconciled: false, documentOrigin: { reconciled: false, orphanJournalEntryIds: [orphanEntryId] } });
      await db!.delete(journalLines).where(eq(journalLines.entryId, orphanEntryId));
      await db!.delete(journalEntries).where(eq(journalEntries.id, orphanEntryId));
      orphanEntryId = undefined;
      const repairDocuments = await db!.select({ id: businessDocuments.id }).from(businessDocuments).where(and(eq(businessDocuments.companyId, 1), isNull(businessDocuments.archivedAt)));
      expect(repairDocuments).toEqual([]);

      const recoveryKey = `${correlation}:recovery`;
      await expect(postJournalEntry({ companyId: TEST_COMPANY_ID, periodId: periodId!, sourceDocumentId: 999999, idempotencyKey: recoveryKey, description: "Falha transitória recuperável", createdBy: TEST_USER_ID, lines: [{ accountId: debitAccount!.id, debit: 7, credit: 0, postable: true, validFrom: new Date("2026-01-01") }, { accountId: creditAccount!.id, debit: 0, credit: 7, postable: true, validFrom: new Date("2026-01-01") }] })).rejects.toThrow("SOURCE_DOCUMENT_NOT_FOUND_OR_FORBIDDEN");
      const recovered = await postJournalEntry({ companyId: TEST_COMPANY_ID, periodId: periodId!, idempotencyKey: recoveryKey, description: "Falha transitória recuperada", createdBy: TEST_USER_ID, lines: [{ accountId: debitAccount!.id, debit: 7, credit: 0, postable: true, validFrom: new Date("2026-01-01") }, { accountId: creditAccount!.id, debit: 0, credit: 7, postable: true, validFrom: new Date("2026-01-01") }] });
      recoveryEntryId = Number(recovered.entryId);
      expect(recovered.idempotent).toBe(false);
      const replayed = await postJournalEntry({ companyId: TEST_COMPANY_ID, periodId: periodId!, idempotencyKey: recoveryKey, description: "Não deve duplicar", createdBy: TEST_USER_ID, lines: [{ accountId: debitAccount!.id, debit: 7, credit: 0, postable: true, validFrom: new Date("2026-01-01") }, { accountId: creditAccount!.id, debit: 0, credit: 7, postable: true, validFrom: new Date("2026-01-01") }] });
      expect(replayed).toMatchObject({ entry: expect.objectContaining({ id: recoveryEntryId }), idempotent: true });

      await db!.update(fiscalPeriods).set({ status: "CLOSED", closedAt: new Date() }).where(and(eq(fiscalPeriods.id, periodId!), eq(fiscalPeriods.companyId, TEST_COMPANY_ID)));
      const reopened = await caller.closing.validateReopen({ organizationId: TEST_ORGANIZATION_ID, companyId: TEST_COMPANY_ID, periodId: periodId!, reason: "Correcção E2E descartável", correlationId: `${correlation}:reopen` });
      expect(reopened).toEqual({ reason: "Correcção E2E descartável", audited: true });
      await db!.update(fiscalPeriods).set({ status: "REOPENED" }).where(and(eq(fiscalPeriods.id, periodId!), eq(fiscalPeriods.companyId, TEST_COMPANY_ID)));
      const audit = await getAuditEventsForUserCompany(TEST_USER_ID, TEST_COMPANY_ID);
      expect(audit.some(({ event }) => event.action === "DOCUMENT_ISSUED" && event.correlationId === `${correlation}:issued`)).toBe(true);
      expect(audit.some(({ event }) => event.action === "JOURNAL_ENTRY_POSTED" && event.correlationId === `${correlation}:post`)).toBe(true);
      expect(audit.some(({ event }) => event.action === "PERIOD_REOPEN" && event.correlationId === `${correlation}:reopen`)).toBe(true);
      const requiredAudit = [
        ["DOCUMENT_NUMBER_RESERVED", "documentSeries", "FT-TEST:FT"],
        ["DOCUMENT_ISSUED", "businessDocument", String(documentId)],
        ["JOURNAL_ENTRY_POSTED", "journalEntry", String(entryId)],
        ["STOCK_MOVEMENT_RECORDED", "stockMovement", String(movementId)],
        ["PERIOD_REOPEN", "FISCAL_PERIOD", String(periodId)],
        ["FILE_ASSET_REGISTERED", "fileAsset", String(fileId)],
        ["FIXED_ASSET_DEPRECIATION_POST", "FIXED_ASSET", "9001"],
        ["JOURNAL_ENTRY_REVERSED", "journalEntry", String(reversalEntryId)],
      ] as const;
      for (const [action, entityType, entityId] of requiredAudit) {
        const expectedCorrelation = action === "DOCUMENT_NUMBER_RESERVED" ? `${TEST_COMPANY_ID}:FT-TEST:${reservation.number}` : correlation;
        const match = audit.find(({ event }) => event.action === action && event.entityType === entityType && event.entityId === entityId && event.correlationId.includes(expectedCorrelation));
        expect(match, `Missing audit event ${action}/${entityType}/${entityId}; got ${audit.map(({ event }) => `${event.action}/${event.entityType}/${event.entityId}/${event.correlationId}`).join(",")}`).toBeTruthy();
        const reconstructed = await getAuditEventsForUserCompany(TEST_USER_ID, TEST_COMPANY_ID, entityType, entityId);
        const reconstructedMatch = reconstructed.find(({ event }) => event.action === action && event.correlationId.includes(expectedCorrelation));
        expect(reconstructedMatch).toBeTruthy();
        expect(reconstructedMatch!.event.actorUserId).toBe(TEST_USER_ID);
        expect(reconstructedMatch!.event.companyId).toBe(TEST_COMPANY_ID);
        expect(reconstructedMatch!.event.entityType).toBe(entityType);
        expect(reconstructedMatch!.event.entityId).toBe(entityId);
        expect(reconstructedMatch!.event.correlationId).toContain(expectedCorrelation);
        expect(reconstructedMatch!.event.createdAt).toBeTruthy();
        expect(reconstructedMatch!.event.afterState).toBeTruthy();
        expect(() => JSON.parse(reconstructedMatch!.event.afterState!)).not.toThrow();
        if (["DOCUMENT_ISSUED", "DOCUMENT_NUMBER_RESERVED", "COMPANY_ACTIVATED", "PERIOD_REOPEN", "JOURNAL_ENTRY_REVERSED"].includes(action)) {
          expect(reconstructedMatch!.event.beforeState).toBeTruthy();
          expect(() => JSON.parse(reconstructedMatch!.event.beforeState!)).not.toThrow();
        }
      }
    } finally {
      if (reversalEntryId) {
        await db!.delete(journalLines).where(eq(journalLines.entryId, reversalEntryId));
        await db!.delete(journalEntries).where(eq(journalEntries.id, reversalEntryId));
      }
      if (depreciationEntryId) {
        await db!.delete(journalLines).where(eq(journalLines.entryId, depreciationEntryId));
        await db!.delete(journalEntries).where(eq(journalEntries.id, depreciationEntryId));
      }
      if (entryId) await db!.update(journalEntries).set({ status: "POSTED" }).where(eq(journalEntries.id, entryId));
      if (fileId) await db!.delete(fileAssets).where(eq(fileAssets.id, fileId));
      if (movementId) await db!.delete(stockMovements).where(eq(stockMovements.id, movementId));
      if (orphanEntryId) {
        await db!.delete(journalLines).where(eq(journalLines.entryId, orphanEntryId));
        await db!.delete(journalEntries).where(eq(journalEntries.id, orphanEntryId));
      }
      if (recoveryEntryId) {
        await db!.delete(journalLines).where(eq(journalLines.entryId, recoveryEntryId));
        await db!.delete(journalEntries).where(eq(journalEntries.id, recoveryEntryId));
      }
      if (entryId) {
        await db!.delete(journalLines).where(eq(journalLines.entryId, entryId));
        await db!.delete(journalEntries).where(eq(journalEntries.id, entryId));
      }
      if (documentId) await db!.delete(businessDocuments).where(eq(businessDocuments.id, documentId));
      if (createdSeriesId) await db!.delete(documentSeries).where(eq(documentSeries.id, createdSeriesId));
      if (createdPeriodId) await db!.delete(fiscalPeriods).where(eq(fiscalPeriods.id, createdPeriodId));
      if (createdExerciseId) await db!.delete(fiscalExercises).where(eq(fiscalExercises.id, createdExerciseId));
      if (createdCompanyId) {
        await db!.delete(auditEvents).where(eq(auditEvents.companyId, createdCompanyId));
        await db!.delete(companies).where(eq(companies.id, createdCompanyId));
      }
      await db!.delete(auditEvents).where(and(eq(auditEvents.companyId, TEST_COMPANY_ID), like(auditEvents.correlationId, `${correlation}%`)));
    }
  }, 30000);
});
