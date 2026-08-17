import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { auditEvents, businessDocuments, cashAccounts, cashReconciliations, counterparties, documentItems, documentSeries, documentTaxes, payments, products, treasuryTransactions } from "../drizzle/schema";

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
      const customer = await caller.counterparties.create({ organizationId: ORGANIZATION_ID, companyId: COMPANY_ID, kind: "CUSTOMER", taxId: `999${suffix}`, name: `Cliente E2E ${suffix}`, email: `customer-${suffix}@example.invalid` });
      counterpartyId = customer.id;
      const product = await caller.catalog.create({ companyId: COMPANY_ID, code: `SVC-${suffix}`, name: "Serviço E2E", kind: "SERVICE", taxCode: "IVA-EXCLUSAO" });
      productId = product.id;
      const cash = await caller.treasury.createAccount({ organizationId: ORGANIZATION_ID, companyId: COMPANY_ID, name: `Caixa E2E ${suffix}`, kind: "CASH" });
      cashAccountId = cash.id;
      const draft = await caller.documents.createDraft({ companyId: COMPANY_ID, series: "FT-TEST", documentType: "FT", counterpartyId, counterpartyType: "CUSTOMER", ivaRegime: "EXCLUSAO", items: [{ productId, description: "Serviço E2E", quantity: 1, unitPrice: 250, netAmount: 250, taxAmount: 0, totalAmount: 250, taxType: "IVA-EXCLUSAO", taxRate: 0 }] });
      draftDocumentId = draft.id;
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
      if (mismatchReconciliationId) await db!.delete(cashReconciliations).where(eq(cashReconciliations.id, mismatchReconciliationId));
      if (treasuryTransactionId) await db!.delete(treasuryTransactions).where(eq(treasuryTransactions.id, treasuryTransactionId));
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
      if (productId) await db!.delete(products).where(eq(products.id, productId));
      if (counterpartyId) await db!.delete(counterparties).where(eq(counterparties.id, counterpartyId));
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
    await expect(caller.counterparties.create({ organizationId: ORGANIZATION_ID, companyId: 999999, kind: "CUSTOMER", name: "Não deve persistir" })).rejects.toThrow();
    await expect(caller.treasury.createAccount({ organizationId: ORGANIZATION_ID, companyId: 999999, name: "Não deve persistir", kind: "BANK" })).rejects.toThrow();
  });
});
