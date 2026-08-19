import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { getPersistedIntegrationOperation, processAgtSubmission } from "./integrations";
import { agtIntegrationConfigs, auditEvents, businessDocuments, cashAccounts, cashReconciliations, chartAccounts, counterparties, documentItems, fixedAssets, documentSeries, documentTaxes, fiscalPeriods, integrationOperations, journalEntries, journalLines, payments, products, treasuryTransactions } from "../drizzle/schema";

const COMPANY_ID = 30001;
const ORGANIZATION_ID = 1;
const USER_ID = 1;

function adminContext(): TrpcContext {
  return {
    user: { id: USER_ID, openId: "MSeLNDb6a4WAPVnEQYiGpH", name: "BALANCERTS Admin", email: "admin@example.invalid", loginMethod: "test", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("expanded tenant-aware operational modules", () => {
  it("creates counterparties, products, cash accounts and an idempotent payment in one company scope", async () => {
    const db = await getDb();
    expect(db).toBeTruthy();
    const caller = appRouter.createCaller(adminContext());
    const suffix = Date.now();
    let counterpartyId: number | undefined;
    let productId: number | undefined;
    let cashAccountId: number | undefined;
    let bankAccountId: number | undefined;
    let supplierId: number | undefined;
    let supplierDocumentId: number | undefined;
    let supplierEntryId: number | undefined;
    let paymentId: number | undefined;
    let treasuryTransactionId: number | undefined;
    let draftDocumentId: number | undefined;
    let itemId: number | undefined;
    let taxId: number | undefined;
    let correctionDocumentId: number | undefined;
    let createdSeries = false;
    let createdCorrectionSeries = false;
    let reconciliationId: number | undefined;
    let mismatchReconciliationId: number | undefined;
    let bankPaymentId: number | undefined;
    let bankTreasuryTransactionId: number | undefined;
    let bankReconciliationId: number | undefined;
    let agtConfigId: number | undefined;
    let submissionId: number | undefined;
    let fixedAssetId: number | undefined;
    try {
      const existingSeries = await db!.select({ id: documentSeries.id }).from(documentSeries).where(and(eq(documentSeries.companyId, COMPANY_ID), eq(documentSeries.code, "FT-TEST"), eq(documentSeries.documentType, "FT"))).limit(1);
      if (!existingSeries[0]) {
        await db!.insert(documentSeries).values({ companyId: COMPANY_ID, code: "FT-TEST", documentType: "FT", nextNumber: 1, active: 1 });
        createdSeries = true;
      }
      const existingCorrectionSeries = await db!.select({ id: documentSeries.id }).from(documentSeries).where(and(eq(documentSeries.companyId, COMPANY_ID), eq(documentSeries.code, "FT-TEST"), eq(documentSeries.documentType, "NC"))).limit(1);
      if (!existingCorrectionSeries[0]) {
        await db!.insert(documentSeries).values({ companyId: COMPANY_ID, code: "FT-TEST", documentType: "NC", nextNumber: 1, active: 1 });
        createdCorrectionSeries = true;
      }
      const agtConfig = await caller.normative.configureAgt({ organizationId: ORGANIZATION_ID, companyId: COMPANY_ID, version: "AO-ADAPTER-1", productId: "BALANCERTS.ERP", productVersion: "1.0.0", softwareValidationNumber: "PENDING", serviceNamespace: "http://sifp.minfin.gov.ao/sigt/fe/ws/v1", xsdVersion: "1.01_01", xsdReference: "https://agt.example.invalid/xsd/SAFT-AO-1.01_01.xsd", endpointReference: "https://agt.example.invalid/submissions", authReference: "secret-ref:agt-test", officialCodes: { IVA_EXCLUSAO: "EXCLUSAO", DOCUMENTO_FT: "FT" }, homologationStatus: "INTERNAL_READY" });
      agtConfigId = agtConfig.id;
      const agtConfigs = await caller.normative.agtConfig({ companyId: COMPANY_ID });
      expect(agtConfigs.some(({ config }) => config.id === agtConfigId && config.homologationStatus === "INTERNAL_READY" && config.authReference === "secret-ref:agt-test" && config.productId === "BALANCERTS.ERP" && config.productVersion === "1.0.0" && config.softwareValidationNumber === "PENDING" && config.serviceNamespace === "http://sifp.minfin.gov.ao/sigt/fe/ws/v1")).toBe(true);
      const submission = await caller.normative.enqueueSubmission({ organizationId: ORGANIZATION_ID, companyId: COMPANY_ID, idempotencyKey: `agt-submit-${suffix}`, payload: { schemaVersion: "1.01_01", documentScope: "tenant-test" } });
      submissionId = submission.id;
      expect(submission).toMatchObject({ state: "PENDING", idempotent: false });
      const submissionAudit = await db!.select({ event: auditEvents }).from(auditEvents).where(and(eq(auditEvents.companyId, COMPANY_ID), eq(auditEvents.entityId, String(submissionId))));
      expect(submissionAudit.some(({ event }) => event.action === "AGT_SUBMISSION_ENQUEUED" && event.actorUserId === USER_ID && event.correlationId === `agt-submit-${suffix}` && event.afterState)).toBe(true);
      const replaySubmission = await caller.normative.enqueueSubmission({ organizationId: ORGANIZATION_ID, companyId: COMPANY_ID, idempotencyKey: `agt-submit-${suffix}`, payload: { schemaVersion: "1.01_01", documentScope: "tenant-test" } });
      expect(replaySubmission).toMatchObject({ id: submissionId, state: "PENDING", idempotent: true });
      let transportCalls = 0;
      const processedSubmission = await processAgtSubmission({ organizationId: ORGANIZATION_ID, companyId: COMPANY_ID, idempotencyKey: `agt-submit-${suffix}`, execute: async (payload) => { transportCalls += 1; return { accepted: true, schemaVersion: payload.schemaVersion }; }, maxRetries: 0 });
      expect(processedSubmission).toMatchObject({ id: submissionId, state: "COMPLETED", idempotent: false, result: { accepted: true, schemaVersion: "1.01_01" } });
      expect(transportCalls).toBe(1);
      const persistedSubmission = await getPersistedIntegrationOperation({ organizationId: ORGANIZATION_ID, companyId: COMPANY_ID, idempotencyKey: `agt-submit-${suffix}` });
      expect(persistedSubmission).toMatchObject({ id: submissionId, state: "COMPLETED", attempts: 1 });
      const replayProcessed = await processAgtSubmission({ organizationId: ORGANIZATION_ID, companyId: COMPANY_ID, idempotencyKey: `agt-submit-${suffix}`, execute: async () => { transportCalls += 1; return { accepted: false }; } });
      expect(replayProcessed).toMatchObject({ id: submissionId, state: "COMPLETED", idempotent: true });
      expect(transportCalls).toBe(1);
      await expect(caller.normative.enqueueSubmission({ organizationId: ORGANIZATION_ID, companyId: COMPANY_ID + 999999, idempotencyKey: `agt-submit-${suffix}`, payload: { schemaVersion: "1.01_01" } })).rejects.toThrow();
      const customer = await caller.counterparties.create({ organizationId: ORGANIZATION_ID, companyId: COMPANY_ID, kind: "CUSTOMER", taxId: `999${suffix}`, name: `Cliente E2E ${suffix}`, email: `customer-${suffix}@example.invalid` });
      counterpartyId = customer.id;
      const supplier = await caller.counterparties.create({ organizationId: ORGANIZATION_ID, companyId: COMPANY_ID, kind: "SUPPLIER", taxId: `888${suffix}`, name: `Fornecedor E2E ${suffix}`, email: `supplier-${suffix}@example.invalid` });
      supplierId = supplier.id;
      expect((await caller.counterparties.list({ companyId: COMPANY_ID, kind: "CUSTOMER" })).some(({ counterparty }) => counterparty.id === counterpartyId)).toBe(true);
      expect((await caller.counterparties.list({ companyId: COMPANY_ID, kind: "SUPPLIER" })).some(({ counterparty }) => counterparty.id === supplierId)).toBe(true);
      const updatedSupplier = await caller.counterparties.update({ companyId: COMPANY_ID, counterpartyId: supplierId, phone: `+244921${suffix}` });
      expect(updatedSupplier).toMatchObject({ id: supplierId });
      expect((await caller.counterparties.list({ companyId: COMPANY_ID, kind: "SUPPLIER" })).some(({ counterparty }) => counterparty.id === supplierId && counterparty.phone === `+244921${suffix}`)).toBe(true);
      const supplierDraft = await caller.documents.createDraft({ companyId: COMPANY_ID, series: "FT-TEST", documentType: "FT", counterpartyId: supplierId, counterpartyType: "SUPPLIER", ivaRegime: "EXCLUSAO", items: [{ description: "Compra de serviço E2E", quantity: 1, unitPrice: 100, netAmount: 100, taxAmount: 0, totalAmount: 100, taxType: "IVA-EXCLUSAO", taxRate: 0 }] });
      supplierDocumentId = supplierDraft.id;
      await caller.documents.transition({ companyId: COMPANY_ID, documentId: supplierDocumentId, to: "VALIDATED", correlationId: `supplier-${suffix}-validated` });
      await caller.documents.transition({ companyId: COMPANY_ID, documentId: supplierDocumentId, to: "ISSUED", correlationId: `supplier-${suffix}-issued` });
      const period = await db!.select({ id: fiscalPeriods.id }).from(fiscalPeriods).where(eq(fiscalPeriods.companyId, COMPANY_ID)).limit(1);
      const accounts = await db!.select({ id: chartAccounts.id }).from(chartAccounts).where(and(eq(chartAccounts.companyId, COMPANY_ID), eq(chartAccounts.postable, 1))).limit(2);
      expect(period[0]).toBeTruthy();
      expect(accounts.length).toBe(2);
      const postedSupplier = await caller.accounting.post({ companyId: COMPANY_ID, periodId: period[0].id, sourceDocumentId: supplierDocumentId, idempotencyKey: `supplier-post-${suffix}`, description: "Lançamento fornecedor E2E", lines: [{ accountId: accounts[0].id, debit: 100, credit: 0, postable: true, validFrom: new Date("2023-09-01") }, { accountId: accounts[1].id, debit: 0, credit: 100, postable: true, validFrom: new Date("2023-09-01") }] });
      supplierEntryId = postedSupplier.entryId;
      const linkedEntry = await db!.select({ entry: journalEntries }).from(journalEntries).where(eq(journalEntries.id, supplierEntryId));
      expect(linkedEntry[0]?.entry.sourceDocumentId).toBe(supplierDocumentId);
      const fixedAsset = await caller.fixedAssets.create({ organizationId: ORGANIZATION_ID, companyId: COMPANY_ID, code: `FA-${suffix}`, name: "Equipamento E2E", acquisitionDate: new Date("2026-08-18T00:00:00Z"), acquisitionCost: 1000, residualValue: 100, usefulLifeMonths: 60 });
      fixedAssetId = fixedAsset.id;
      expect((await caller.fixedAssets.list({ companyId: COMPANY_ID })).some(({ asset }) => asset.id === fixedAssetId && asset.code === `FA-${suffix}`)).toBe(true);
      const fixedAssetAudit = await db!.select({ event: auditEvents }).from(auditEvents).where(and(eq(auditEvents.companyId, COMPANY_ID), eq(auditEvents.entityId, String(fixedAssetId))));
      expect(fixedAssetAudit.some(({ event }) => event.action === "FIXED_ASSET_CREATED" && event.afterState)).toBe(true);
      const product = await caller.catalog.create({ companyId: COMPANY_ID, code: `SVC-${suffix}`, name: "Serviço E2E", kind: "SERVICE", taxCode: "IVA-EXCLUSAO" });
      productId = product.id;
      const updatedProduct = await caller.catalog.update({ companyId: COMPANY_ID, productId, name: `Serviço E2E actualizado ${suffix}` });
      expect(updatedProduct).toMatchObject({ id: productId });
      expect((await caller.catalog.list({ companyId: COMPANY_ID })).some(({ product }) => product.id === productId && product.name.includes("actualizado"))).toBe(true);
      const cash = await caller.treasury.createAccount({ organizationId: ORGANIZATION_ID, companyId: COMPANY_ID, name: `Caixa E2E ${suffix}`, kind: "CASH" });
      cashAccountId = cash.id;
      expect((await caller.treasury.accounts({ companyId: COMPANY_ID })).some(({ account }) => account.id === cashAccountId)).toBe(true);
      const bank = await caller.treasury.createAccount({ organizationId: ORGANIZATION_ID, companyId: COMPANY_ID, name: `Banco E2E ${suffix}`, kind: "BANK", accountNumber: `AO06${suffix}` });
      bankAccountId = bank.id;
      const updatedBank = await caller.treasury.updateAccount({ companyId: COMPANY_ID, cashAccountId: bankAccountId, name: `Banco E2E actualizado ${suffix}`, accountNumber: `AO07${suffix}` });
      expect(updatedBank).toMatchObject({ id: bankAccountId });
      expect((await caller.treasury.accounts({ companyId: COMPANY_ID })).some(({ account }) => account.id === bankAccountId && account.name.includes("actualizado") && account.accountNumber === `AO07${suffix}`)).toBe(true);
      const emptyBankReconciliation = await caller.treasury.reconcile({ companyId: COMPANY_ID, cashAccountId: bankAccountId, statementDate: new Date("2026-08-18T23:00:00Z"), openingBalance: 0, closingBalance: 0 });
      expect(emptyBankReconciliation).toMatchObject({ status: "RECONCILED", systemBalance: 0, difference: 0 });
      bankReconciliationId = emptyBankReconciliation.id;
      const bankPayment = await caller.treasury.createPayment({ organizationId: ORGANIZATION_ID, companyId: COMPANY_ID, cashAccountId: bankAccountId, direction: "PAYMENT", amount: 50, paidAt: new Date("2026-08-18T12:00:00Z"), method: "BANK_TRANSFER", idempotencyKey: `bank-payment-e2e-${suffix}`, correlationId: `bank-payment-e2e-${suffix}` });
      bankPaymentId = Number(bankPayment.payment.id);
      bankTreasuryTransactionId = Number(bankPayment.treasuryTransactionId);
      expect((await caller.treasury.payments({ companyId: COMPANY_ID })).some(({ payment }) => payment.id === bankPaymentId && payment.direction === "PAYMENT")).toBe(true);
      const bankClosing = await caller.treasury.reconcile({ companyId: COMPANY_ID, cashAccountId: bankAccountId, statementDate: new Date("2026-08-19T23:00:00Z"), openingBalance: 0, closingBalance: -50 });
      expect(bankClosing).toMatchObject({ status: "RECONCILED", systemBalance: -50, difference: 0 });
      const draft = await caller.documents.createDraft({ companyId: COMPANY_ID, series: "FT-TEST", documentType: "FT", counterpartyId, counterpartyType: "CUSTOMER", ivaRegime: "EXCLUSAO", items: [{ productId, description: "Serviço E2E", quantity: 1, unitPrice: 250, netAmount: 250, taxAmount: 0, totalAmount: 250, taxType: "IVA-EXCLUSAO", taxRate: 0 }] });
      draftDocumentId = draft.id;
      const updatedCustomer = await caller.counterparties.update({ companyId: COMPANY_ID, counterpartyId, email: `updated-${suffix}@example.invalid` });
      expect(updatedCustomer).toMatchObject({ id: counterpartyId });
      expect((await caller.counterparties.list({ companyId: COMPANY_ID, kind: "CUSTOMER" })).some(({ counterparty }) => counterparty.id === counterpartyId && counterparty.email === `updated-${suffix}@example.invalid`)).toBe(true);
      expect(draft).toMatchObject({ status: "DRAFT", counterpartyId });
      const persistedDraft = await db!.select({ document: businessDocuments }).from(businessDocuments).where(eq(businessDocuments.id, draftDocumentId));
      const persistedItems = await db!.select({ item: documentItems }).from(documentItems).where(eq(documentItems.documentId, draftDocumentId));
      const persistedTaxes = await db!.select({ tax: documentTaxes }).from(documentTaxes).where(eq(documentTaxes.documentId, draftDocumentId));
      expect(persistedDraft[0]?.document).toMatchObject({ counterpartyId, netAmount: "250.00", taxAmount: "0.00", totalAmount: "250.00", status: "DRAFT" });
      expect(persistedItems).toHaveLength(1);
      expect(persistedTaxes).toHaveLength(1);
      itemId = persistedItems[0].item.id;
      taxId = persistedTaxes[0].tax.id;
      const payment = await caller.treasury.createPayment({ organizationId: ORGANIZATION_ID, companyId: COMPANY_ID, documentId: draftDocumentId, cashAccountId, direction: "RECEIPT", amount: 250, paidAt: new Date("2026-08-17T12:00:00Z"), method: "CASH", idempotencyKey: `payment-e2e-${suffix}`, correlationId: `payment-e2e-${suffix}` });
      paymentId = Number(payment.payment.id);
      treasuryTransactionId = Number(payment.treasuryTransactionId);
      expect(treasuryTransactionId).toBeGreaterThan(0);
      expect((await caller.treasury.transactions({ companyId: COMPANY_ID })).some(({ transaction }) => transaction.id === treasuryTransactionId)).toBe(true);
      const transactionReconciliation = await caller.treasury.reconcileTransaction({ companyId: COMPANY_ID, transactionId: treasuryTransactionId, reason: "Conferência com extracto bancário de teste" });
      expect(transactionReconciliation).toMatchObject({ id: treasuryTransactionId, reconciliationStatus: "RECONCILED", alreadyReconciled: false });
      const transactionReplay = await caller.treasury.reconcileTransaction({ companyId: COMPANY_ID, transactionId: treasuryTransactionId, reason: "Repetição idempotente" });
      expect(transactionReplay).toMatchObject({ id: treasuryTransactionId, reconciliationStatus: "RECONCILED", alreadyReconciled: true });
      const confirmedPayment = await caller.treasury.updatePayment({ companyId: COMPANY_ID, paymentId, status: "CONFIRMED" });
      expect(confirmedPayment).toMatchObject({ id: paymentId });
      expect((await caller.treasury.payments({ companyId: COMPANY_ID })).some(({ payment }) => payment.id === paymentId && payment.status === "CONFIRMED")).toBe(true);
      const mismatch = await caller.treasury.reconcile({ companyId: COMPANY_ID, cashAccountId, statementDate: new Date("2026-08-17T23:00:00Z"), openingBalance: 0, closingBalance: 249 });
      mismatchReconciliationId = mismatch.id;
      expect(mismatch).toMatchObject({ status: "OPEN", difference: -1 });
      const reconciliation = await caller.treasury.reconcile({ companyId: COMPANY_ID, cashAccountId, statementDate: new Date("2026-08-18T23:00:00Z"), openingBalance: 0, closingBalance: 250 });
      reconciliationId = reconciliation.id;
      expect(reconciliation).toMatchObject({ status: "RECONCILED", systemBalance: 250, difference: 0 });
      expect(payment.payment.documentId).toBe(draftDocumentId);
      await caller.documents.transition({ companyId: COMPANY_ID, documentId: draftDocumentId, to: "VALIDATED", correlationId: `doc-${suffix}-validated` });
      await caller.documents.transition({ companyId: COMPANY_ID, documentId: draftDocumentId, to: "ISSUED", correlationId: `doc-${suffix}-issued` });
      await expect(caller.counterparties.update({ companyId: COMPANY_ID, counterpartyId, name: "Nome proibido após emissão" })).rejects.toThrow("COUNTERPARTY_IMMUTABLE_AFTER_DOCUMENT_ISSUANCE");
      await expect(caller.catalog.update({ companyId: COMPANY_ID, productId, name: "Produto proibido após emissão" })).rejects.toThrow("PRODUCT_IMMUTABLE_AFTER_DOCUMENT_ISSUANCE");
      await expect(caller.documents.updateItem({ companyId: COMPANY_ID, itemId, netAmount: 240 })).rejects.toThrow("DOCUMENT_IMMUTABLE_AFTER_ISSUANCE");
      await expect(caller.documents.updateTax({ companyId: COMPANY_ID, taxId, taxAmount: 1 })).rejects.toThrow("DOCUMENT_IMMUTABLE_AFTER_ISSUANCE");
      await expect(caller.treasury.updatePayment({ companyId: COMPANY_ID, paymentId, amount: 240 })).rejects.toThrow("DOCUMENT_IMMUTABLE_AFTER_ISSUANCE");
      expect((await caller.treasury.transactions({ companyId: COMPANY_ID })).some(({ transaction }) => transaction.id === treasuryTransactionId && transaction.direction === "IN")).toBe(true);
      const replay = await caller.treasury.createPayment({ organizationId: ORGANIZATION_ID, companyId: COMPANY_ID, documentId: draftDocumentId, cashAccountId, direction: "RECEIPT", amount: 250, paidAt: new Date("2026-08-17T12:00:00Z"), method: "CASH", idempotencyKey: `payment-e2e-${suffix}`, correlationId: `payment-e2e-${suffix}` });
      expect(replay).toMatchObject({ idempotent: true, payment: { id: paymentId } });
      await expect(caller.documents.transition({ companyId: COMPANY_ID, documentId: draftDocumentId, to: "CANCELLED", correlationId: `doc-${suffix}-cancel` })).rejects.toThrow("CANCELLATION_REASON_REQUIRED");
      await caller.documents.transition({ companyId: COMPANY_ID, documentId: draftDocumentId, to: "CANCELLED", cancellationReason: "Operação anulada para teste legal", correlationId: `doc-${suffix}-cancel` });
      const archived = await caller.documents.archive({ companyId: COMPANY_ID, documentId: draftDocumentId });
      expect(archived).toMatchObject({ id: draftDocumentId, idempotent: false });
      const archivedReplay = await caller.documents.archive({ companyId: COMPANY_ID, documentId: draftDocumentId });
      expect(archivedReplay).toMatchObject({ id: draftDocumentId, idempotent: true });
      await expect(caller.documents.createDraft({ companyId: COMPANY_ID, series: "FT-TEST", documentType: "NC", counterpartyId, counterpartyType: "CUSTOMER", ivaRegime: "EXCLUSAO", items: [{ productId, description: "NC inválida", quantity: 1, unitPrice: 10, netAmount: 10, taxAmount: 0, totalAmount: 10 }] })).rejects.toThrow("CORRECTION_ORIGIN_REQUIRED");
      const correction = await caller.documents.createDraft({ companyId: COMPANY_ID, series: "FT-TEST", documentType: "NC", counterpartyId, counterpartyType: "CUSTOMER", ivaRegime: "EXCLUSAO", correctsDocumentId: draftDocumentId, items: [{ productId, description: "Nota de crédito E2E", quantity: 1, unitPrice: 10, netAmount: 10, taxAmount: 0, totalAmount: 10 }] });
      correctionDocumentId = correction.id;
      const persistedCorrection = await db!.select({ document: businessDocuments }).from(businessDocuments).where(eq(businessDocuments.id, correctionDocumentId));
      expect(persistedCorrection[0]?.document).toMatchObject({ documentType: "NC", correctsDocumentId: draftDocumentId, status: "DRAFT" });
      expect((await caller.counterparties.list({ companyId: COMPANY_ID, kind: "CUSTOMER" })).some(({ counterparty }) => counterparty.id === counterpartyId)).toBe(true);
      expect((await caller.catalog.list({ companyId: COMPANY_ID })).some(({ product: row }) => row.id === productId)).toBe(true);
      expect((await caller.treasury.accounts({ companyId: COMPANY_ID })).some(({ account }) => account.id === cashAccountId)).toBe(true);
      const normative = await caller.normative.list({ companyId: COMPANY_ID });
      expect(normative.some(({ rule }) => rule.code === "AO-FATURAS-71-25" && rule.verificationStatus === "EXTERNAL_PENDING")).toBe(true);
      const normativeCoverage = await caller.normative.coverage({ companyId: COMPANY_ID });
      expect(normativeCoverage).toMatchObject({ instrument: "DP-71-25", eligibleForCertification: false });
      expect(normativeCoverage.requirements).toHaveLength(6);
      expect(normativeCoverage.requirements.find((requirement) => requirement.code === "DP71-RECEIPT")?.status).toBe("EXTERNAL_PENDING");
      const saftExport = await caller.reports.saftExport({ companyId: COMPANY_ID });
      expect(saftExport).toMatchObject({ namespace: "urn:OECD:StandardAuditFile-Tax:AO_1.01_01", version: "1.01_01", submissionEligible: false, xml: null, contentType: "application/xml" });
      const audit = await db!.select({ event: auditEvents }).from(auditEvents).where(and(eq(auditEvents.companyId, COMPANY_ID), eq(auditEvents.entityId, String(paymentId))));
      expect(audit.some(({ event }) => event.action === "PAYMENT_CREATED" && event.actorUserId === USER_ID && event.afterState)).toBe(true);
    } finally {
      if (reconciliationId) await db!.delete(cashReconciliations).where(eq(cashReconciliations.id, reconciliationId));
      if (bankReconciliationId) await db!.delete(cashReconciliations).where(eq(cashReconciliations.id, bankReconciliationId));
      if (bankTreasuryTransactionId) await db!.delete(treasuryTransactions).where(eq(treasuryTransactions.id, bankTreasuryTransactionId));
      if (bankPaymentId) await db!.delete(payments).where(eq(payments.id, bankPaymentId));
      if (agtConfigId) await db!.delete(agtIntegrationConfigs).where(eq(agtIntegrationConfigs.id, agtConfigId));
      if (submissionId) await db!.delete(integrationOperations).where(eq(integrationOperations.id, submissionId));
      if (mismatchReconciliationId) await db!.delete(cashReconciliations).where(eq(cashReconciliations.id, mismatchReconciliationId));
      if (treasuryTransactionId) await db!.delete(treasuryTransactions).where(eq(treasuryTransactions.id, treasuryTransactionId));
      if (supplierEntryId) {
        await db!.delete(journalLines).where(eq(journalLines.entryId, supplierEntryId));
        await db!.delete(journalEntries).where(eq(journalEntries.id, supplierEntryId));
      }
      if (supplierDocumentId) {
        await db!.delete(documentTaxes).where(eq(documentTaxes.documentId, supplierDocumentId));
        await db!.delete(documentItems).where(eq(documentItems.documentId, supplierDocumentId));
        await db!.delete(businessDocuments).where(eq(businessDocuments.id, supplierDocumentId));
      }
      if (correctionDocumentId) {
        await db!.delete(documentTaxes).where(eq(documentTaxes.documentId, correctionDocumentId));
        await db!.delete(documentItems).where(eq(documentItems.documentId, correctionDocumentId));
        await db!.delete(businessDocuments).where(eq(businessDocuments.id, correctionDocumentId));
      }
      if (draftDocumentId) {
        await db!.delete(documentTaxes).where(eq(documentTaxes.documentId, draftDocumentId));
        await db!.delete(documentItems).where(eq(documentItems.documentId, draftDocumentId));
        await db!.delete(businessDocuments).where(eq(businessDocuments.id, draftDocumentId));
      }
      if (createdSeries) await db!.delete(documentSeries).where(and(eq(documentSeries.companyId, COMPANY_ID), eq(documentSeries.code, "FT-TEST"), eq(documentSeries.documentType, "FT")));
      else await db!.update(documentSeries).set({ nextNumber: 1 }).where(and(eq(documentSeries.companyId, COMPANY_ID), eq(documentSeries.code, "FT-TEST"), eq(documentSeries.documentType, "FT")));
      if (createdCorrectionSeries) await db!.delete(documentSeries).where(and(eq(documentSeries.companyId, COMPANY_ID), eq(documentSeries.code, "FT-TEST"), eq(documentSeries.documentType, "NC")));
      else await db!.update(documentSeries).set({ nextNumber: 1 }).where(and(eq(documentSeries.companyId, COMPANY_ID), eq(documentSeries.code, "FT-TEST"), eq(documentSeries.documentType, "NC")));
      if (paymentId) await db!.delete(payments).where(eq(payments.id, paymentId));
      if (cashAccountId) await db!.delete(cashAccounts).where(eq(cashAccounts.id, cashAccountId));
      if (bankAccountId) await db!.delete(cashAccounts).where(eq(cashAccounts.id, bankAccountId));
      if (fixedAssetId) await db!.delete(fixedAssets).where(eq(fixedAssets.id, fixedAssetId));
      if (productId) await db!.delete(products).where(eq(products.id, productId));
      if (counterpartyId) await db!.delete(counterparties).where(eq(counterparties.id, counterpartyId));
      if (supplierId) await db!.delete(counterparties).where(eq(counterparties.id, supplierId));
      await db!.delete(auditEvents).where(and(eq(auditEvents.companyId, COMPANY_ID), eq(auditEvents.correlationId, `payment-e2e-${suffix}`)));
      await db!.delete(auditEvents).where(and(eq(auditEvents.companyId, COMPANY_ID), eq(auditEvents.correlationId, `counterparty:${counterpartyId ?? -1}`)));
      await db!.delete(auditEvents).where(and(eq(auditEvents.companyId, COMPANY_ID), eq(auditEvents.correlationId, `product:${productId ?? -1}`)));
      await db!.delete(auditEvents).where(and(eq(auditEvents.companyId, COMPANY_ID), eq(auditEvents.correlationId, `cash-account:${cashAccountId ?? -1}`)));
    }
  }, 30000);

  it("returns empty data and rejects writes for a forged or nonexistent company scope", async () => {
    const caller = appRouter.createCaller(adminContext());
    expect(await caller.counterparties.list({ companyId: 999999 })).toEqual([]);
    expect(await caller.catalog.list({ companyId: 999999 })).toEqual([]);
    expect(await caller.treasury.accounts({ companyId: 999999 })).toEqual([]);
    expect(await caller.fixedAssets.list({ companyId: 999999 })).toEqual([]);
    await expect(caller.counterparties.create({ organizationId: ORGANIZATION_ID, companyId: 999999, kind: "CUSTOMER", name: "Não deve persistir" })).rejects.toThrow();
    await expect(caller.treasury.createAccount({ organizationId: ORGANIZATION_ID, companyId: 999999, name: "Não deve persistir", kind: "BANK" })).rejects.toThrow();
    await expect(caller.fixedAssets.create({ organizationId: ORGANIZATION_ID, companyId: 999999, code: "FORGED", name: "Não deve persistir", acquisitionDate: new Date(), acquisitionCost: 1, usefulLifeMonths: 1 })).rejects.toThrow();
  });
});
