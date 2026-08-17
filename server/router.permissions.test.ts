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
    expect(post).toHaveBeenCalledWith(expect.objectContaining({ companyId: 1, periodId: 1, createdBy: 8, reversalOfEntryId: 12, description: expect.stringContaining("12") }));
  });

  it("requires explicit activation confirmation and blocks non-admin roles", async () => {
    const admin = appRouter.createCaller(contextWithRole("admin"));
    await expect(admin.companies.activate({ companyId: 1, confirmation: "WRONG_CONFIRMATION" as "ACTIVATE_COMPANY" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    const accountant = appRouter.createCaller(contextWithRole("contabilista"));
    await expect(accountant.companies.activate({ companyId: 1, confirmation: "ACTIVATE_COMPANY" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("creates a company profile with pending configuration", async () => {
    const create = vi.spyOn(db, "createCompanyForUser").mockResolvedValue({ company: { id: 41, name: "Repair Lubatec", nif: "5001121871", ivaRegime: "EXCLUSAO", functionalCurrency: "AOA", configurationStatus: "PENDING" }, organization: { id: 5 } } as never);
    const caller = appRouter.createCaller(contextWithRole("admin"));
    await expect(caller.companies.create({ name: "Repair Lubatec", nif: "5001121871", functionalCurrency: "AOA", ivaRegime: "EXCLUSAO", legalForm: "Sociedade por Quotas", address: "Shopping Millennium, Loja 141", municipality: "Lubango", province: "Huíla", phone: "+244 921346544", email: "repairlubatec@gmail.com", activity: "Prestação de Serviço", incorporationYear: 2023, legalRepresentatives: "Fausto Silva; Luís Jordão" })).resolves.toMatchObject({ company: { configurationStatus: "PENDING" } });
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ userId: 8, nif: "5001121871", legalForm: "Sociedade por Quotas", ivaRegime: "EXCLUSAO", legalRepresentatives: "Fausto Silva; Luís Jordão" }));
  });

  it("allows document emission for Contabilista and blocks Financeiro", async () => {
    const transition = vi.spyOn(db, "transitionBusinessDocument").mockResolvedValue({ id: 7, from: "VALIDATED", to: "ISSUED" });
    const accountant = appRouter.createCaller(contextWithRole("contabilista"));
    await expect(accountant.documents.transition({ companyId: 41, documentId: 7, to: "ISSUED" })).resolves.toMatchObject({ to: "ISSUED" });
    expect(transition).toHaveBeenCalledWith({ companyId: 41, documentId: 7, to: "ISSUED", userId: 8 });
    const finance = appRouter.createCaller(contextWithRole("financeiro"));
    await expect(finance.documents.transition({ companyId: 41, documentId: 7, to: "ISSUED" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects direct API close for Operador", async () => {
    const caller = appRouter.createCaller(contextWithRole("operador"));
    await expect(caller.closing.evaluate({ checks: [] })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows fiscal validation with normative evidence and blocks Operador", async () => {
    const caller = appRouter.createCaller(contextWithRole("contabilista"));
    await expect(caller.fiscal.validateNormative({ area: "FISCAL_DOCUMENT", evidenceCodes: ["DP-71-25", "AGT-FAT-DOC"] })).resolves.toMatchObject({ valid: true });
    const blocked = appRouter.createCaller(contextWithRole("operador"));
    await expect(blocked.fiscal.validateNormative({ area: "FISCAL_DOCUMENT", evidenceCodes: [] })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows Auditor to read fiscal register and blocks Operador", async () => {
    const register = vi.spyOn(db, "getFiscalRegisterForUserCompany").mockResolvedValue({ entries: [], totals: { netAmount: 0, taxAmount: 0, totalAmount: 0 }, reconciled: true });
    const auditor = appRouter.createCaller(contextWithRole("auditor"));
    await expect(auditor.reports.fiscalRegister({ companyId: 41 })).resolves.toMatchObject({ reconciled: true });
    expect(register).toHaveBeenCalledWith(8, 41);
    const operator = appRouter.createCaller(contextWithRole("operador"));
    await expect(operator.reports.fiscalRegister({ companyId: 41 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows Auditor to query tenant-scoped audit history", async () => {
    const list = vi.spyOn(db, "getAuditEventsForUserCompany").mockResolvedValue([{ event: { id: 1, companyId: 41 } } as never]);
    const caller = appRouter.createCaller(contextWithRole("auditor"));
    await expect(caller.audit.list({ companyId: 41 })).resolves.toHaveLength(1);
    expect(list).toHaveBeenCalledWith(8, 41, undefined, undefined);
  });

  it("allows tenant-scoped audit append only for the administrator tenant", async () => {
    const append = vi.spyOn(db, "appendAuditEventForUser").mockResolvedValue({} as never);
    const caller = appRouter.createCaller(contextWithRole("admin"));
    await expect(caller.audit.append({ organizationId: 7, companyId: 41, action: "TEST_AUDIT", entityType: "company", entityId: "41", correlationId: "audit-41" })).resolves.toBeDefined();
    expect(append).toHaveBeenCalledWith(expect.objectContaining({ actorUserId: 8, organizationId: 7, companyId: 41 }));
    append.mockRejectedValueOnce(new Error("AUDIT_SCOPE_FORBIDDEN"));
    await expect(caller.audit.append({ organizationId: 999, companyId: 999, action: "TEST_AUDIT", entityType: "company", entityId: "999", correlationId: "audit-999" })).rejects.toMatchObject({ code: "FORBIDDEN", message: "AUDIT_SCOPE_FORBIDDEN" });
  });

  it("filters audit reconstruction by entity", async () => {
    const list = vi.spyOn(db, "getAuditEventsForUserCompany").mockResolvedValue([]);
    const caller = appRouter.createCaller(contextWithRole("auditor"));
    await expect(caller.audit.list({ companyId: 41, entityType: "journalEntry", entityId: "99" })).resolves.toEqual([]);
    expect(list).toHaveBeenCalledWith(8, 41, "journalEntry", "99");
  });

  it("rejects unauthorized critical modules before database access", async () => {
    const caller = appRouter.createCaller(contextWithRole("user"));
    await expect(caller.companies.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.documents.validateTransition({ from: "DRAFT", to: "VALIDATED" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.files.downloadUrl({ companyId: 1, fileId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.reports.trialBalance({ companyId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.audit.list({ companyId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("exposes report trace with navigable origins", async () => {
    const trace = vi.spyOn(db, "getReportTraceForUserCompany").mockResolvedValue({ report: "TRIAL_BALANCE", companyId: 41, accountCode: null, summary: { rows: [], totals: { debit: 0, credit: 0 }, reconciled: true }, origins: [] });
    const caller = appRouter.createCaller(contextWithRole("auditor"));
    await expect(caller.reports.trace({ companyId: 41, report: "TRIAL_BALANCE" })).resolves.toMatchObject({ report: "TRIAL_BALANCE", companyId: 41, origins: [] });
    expect(trace).toHaveBeenCalledWith(8, 41, "TRIAL_BALANCE", undefined);
  });

  it("passes tenant scope through both document-chain directions", async () => {
    const forward = vi.spyOn(db, "getDocumentAccountingChainForUserCompany").mockResolvedValue({ document: { id: 7 }, entries: [] } as never);
    const reverse = vi.spyOn(db, "getJournalDocumentChainForUserCompany").mockResolvedValue({ entry: { id: 9 }, document: { id: 7 }, lines: [] } as never);
    const caller = appRouter.createCaller(contextWithRole("auditor"));
    await expect(caller.reports.documentChain({ companyId: 41, documentId: 7 })).resolves.toMatchObject({ document: { id: 7 } });
    await expect(caller.reports.entryChain({ companyId: 41, entryId: 9 })).resolves.toMatchObject({ entry: { id: 9 } });
    expect(forward).toHaveBeenCalledWith(8, 41, 7);
    expect(reverse).toHaveBeenCalledWith(8, 41, 9);
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
