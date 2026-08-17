import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { auditEvents, cashAccounts, counterparties, payments, products, treasuryTransactions } from "../drizzle/schema";

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
    try {
      const customer = await caller.counterparties.create({ organizationId: ORGANIZATION_ID, companyId: COMPANY_ID, kind: "CUSTOMER", taxId: `999${suffix}`, name: `Cliente E2E ${suffix}`, email: `customer-${suffix}@example.invalid` });
      counterpartyId = customer.id;
      const product = await caller.catalog.create({ companyId: COMPANY_ID, code: `SVC-${suffix}`, name: "Serviço E2E", kind: "SERVICE", taxCode: "IVA-EXCLUSAO" });
      productId = product.id;
      const cash = await caller.treasury.createAccount({ organizationId: ORGANIZATION_ID, companyId: COMPANY_ID, name: `Caixa E2E ${suffix}`, kind: "CASH" });
      cashAccountId = cash.id;
      const payment = await caller.treasury.createPayment({ organizationId: ORGANIZATION_ID, companyId: COMPANY_ID, cashAccountId, direction: "RECEIPT", amount: 250, paidAt: new Date("2026-08-17T12:00:00Z"), method: "CASH", idempotencyKey: `payment-e2e-${suffix}`, correlationId: `payment-e2e-${suffix}` });
      paymentId = Number(payment.payment.id);
      treasuryTransactionId = Number(payment.treasuryTransactionId);
      expect(treasuryTransactionId).toBeGreaterThan(0);
      expect((await caller.treasury.transactions({ companyId: COMPANY_ID })).some(({ transaction }) => transaction.id === treasuryTransactionId && transaction.direction === "IN")).toBe(true);
      const replay = await caller.treasury.createPayment({ organizationId: ORGANIZATION_ID, companyId: COMPANY_ID, cashAccountId, direction: "RECEIPT", amount: 250, paidAt: new Date("2026-08-17T12:00:00Z"), method: "CASH", idempotencyKey: `payment-e2e-${suffix}`, correlationId: `payment-e2e-${suffix}` });
      expect(replay).toMatchObject({ idempotent: true, payment: { id: paymentId } });
      expect((await caller.counterparties.list({ companyId: COMPANY_ID, kind: "CUSTOMER" })).some(({ counterparty }) => counterparty.id === counterpartyId)).toBe(true);
      expect((await caller.catalog.list({ companyId: COMPANY_ID })).some(({ product: row }) => row.id === productId)).toBe(true);
      expect((await caller.treasury.accounts({ companyId: COMPANY_ID })).some(({ account }) => account.id === cashAccountId)).toBe(true);
      const normative = await caller.normative.list({ companyId: COMPANY_ID });
      expect(normative.some(({ rule }) => rule.code === "AO-FATURAS-71-25" && rule.verificationStatus === "EXTERNAL_PENDING")).toBe(true);
      const audit = await db!.select({ event: auditEvents }).from(auditEvents).where(and(eq(auditEvents.companyId, COMPANY_ID), eq(auditEvents.entityId, String(paymentId))));
      expect(audit.some(({ event }) => event.action === "PAYMENT_CREATED" && event.actorUserId === USER_ID && event.afterState)).toBe(true);
    } finally {
      if (treasuryTransactionId) await db!.delete(treasuryTransactions).where(eq(treasuryTransactions.id, treasuryTransactionId));
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
