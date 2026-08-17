import { describe, expect, it, vi } from "vitest";
import * as db from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function contextWithRole(role: "admin" | "financeiro" | "contabilista" | "auditor" | "operador" | "user"): TrpcContext {
  return {
    user: { id: 8, openId: `test-${role}`, name: role, email: `${role}@example.com`, loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("protected accounting procedures", () => {
  it("rejects direct API posting for Financeiro", async () => {
    const caller = appRouter.createCaller(contextWithRole("financeiro"));
    await expect(caller.accounting.post({
      companyId: 1,
      periodId: 1,
      idempotencyKey: "permission-test-1",
      description: "Teste",
      lines: [
        { accountId: 1, debit: 100, credit: 0, postable: true, validFrom: new Date("2020-01-01") },
        { accountId: 2, debit: 0, credit: 100, postable: true, validFrom: new Date("2020-01-01") },
      ],
    })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects direct API reversal for Auditor", async () => {
    const caller = appRouter.createCaller(contextWithRole("auditor"));
    await expect(caller.reversal.preview({ originalEntryId: 1, reason: "Correcção auditada", lines: [{ accountId: 1, debit: 10, credit: 0, currency: "AOA", exchangeRate: 1 }, { accountId: 2, debit: 0, credit: 10, currency: "AOA", exchangeRate: 1 }] })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("posts a controlled reversal for an authorized accountant", async () => {
    const post = vi.spyOn(db, "postJournalEntry").mockResolvedValue({ entryId: 99, idempotent: false });
    const caller = appRouter.createCaller(contextWithRole("contabilista"));
    await expect(caller.reversal.post({ companyId: 1, periodId: 1, originalEntryId: 12, reason: "Correcção de lançamento", idempotencyKey: "reverse-test-12", lines: [{ accountId: 1, debit: 10, credit: 0, currency: "AOA", exchangeRate: 1, postable: true, validFrom: new Date("2020-01-01") }, { accountId: 2, debit: 0, credit: 10, currency: "AOA", exchangeRate: 1, postable: true, validFrom: new Date("2020-01-01") }] })).resolves.toMatchObject({ entryId: 99 });
    expect(post).toHaveBeenCalledWith(expect.objectContaining({ companyId: 1, periodId: 1, createdBy: 8, description: expect.stringContaining("12") }));
  });

  it("rejects direct API close for Operador", async () => {
    const caller = appRouter.createCaller(contextWithRole("operador"));
    await expect(caller.closing.evaluate({ checks: [] })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects unauthorized critical modules before database access", async () => {
    const caller = appRouter.createCaller(contextWithRole("user"));
    await expect(caller.companies.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.documents.validateTransition({ from: "DRAFT", to: "VALIDATED" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.files.downloadUrl({ companyId: 1, fileId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.reports.trialBalance({ companyId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("passes authenticated tenant scope to persisted stock reconciliation", async () => {
    const reconcile = vi.spyOn(db, "reconcileStockForUserCompany").mockResolvedValue({ reconciled: true, difference: 0, inventoryValue: 300, ledgerValue: 300 });
    const caller = appRouter.createCaller(contextWithRole("contabilista"));
    await expect(caller.inventory.reconcile({ companyId: 41, inventoryAccountId: 12 })).resolves.toMatchObject({ reconciled: true });
    expect(reconcile).toHaveBeenCalledWith({ userId: 8, companyId: 41, inventoryAccountId: 12 });
  });

  it("rejects role-incompatible fiscal, treasury, stock and fixed-asset operations", async () => {
    const caller = appRouter.createCaller(contextWithRole("auditor"));
    await expect(caller.fiscal.calculateIva({ netAmount: 100, regime: "GERAL", rule: { code: "IVA", regime: "GERAL", validFrom: new Date("2026-01-01"), rate: 0.14, evidence: "DP-71/25" } })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.reconciliation.bank({ bank: [], ledger: [] })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.inventory.record({ organizationId: 1, companyId: 1, periodId: 1, productCode: "SKU-1", type: "IN", quantity: 1, unitCost: 10, correlationId: "stock-permission" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.fixedAssets.postDepreciation({ organizationId: 1, companyId: 1, periodId: 1, assetId: 1, amount: 10, expenseAccountId: 1, accumulatedDepreciationAccountId: 2, correlationId: "asset-permission" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
