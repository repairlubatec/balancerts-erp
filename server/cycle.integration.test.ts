import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";

const callerFor = (role: "admin" | "contabilista") => appRouter.createCaller({
  user: { id: 8, role, openId: "cycle-user", name: "Cycle User" },
  req: {} as never,
  res: {} as never,
});

describe("commercial-to-accounting tRPC cycle", () => {
  it("reserves, emits and posts in order without crossing procedure contracts", async () => {
    const reserve = vi.spyOn(db, "reserveDocumentNumber").mockResolvedValue({ companyId: 41, series: "FT", documentType: "INVOICE", number: 1, formatted: "FT/1" });
    const transition = vi.spyOn(db, "transitionBusinessDocument").mockResolvedValue({ id: 7, from: "VALIDATED", to: "ISSUED" });
    const post = vi.spyOn(db, "postJournalEntry").mockResolvedValue({ entryId: 99, idempotent: false });
    const admin = callerFor("admin");
    const accountant = callerFor("contabilista");

    await expect(admin.documents.reserveNumber({ companyId: 41, series: "FT", documentType: "INVOICE" })).resolves.toMatchObject({ formatted: "FT/1" });
    await expect(accountant.documents.transition({ companyId: 41, documentId: 7, to: "ISSUED" })).resolves.toMatchObject({ to: "ISSUED" });
    await expect(accountant.accounting.post({ companyId: 41, periodId: 9, sourceDocumentId: 7, idempotencyKey: "cycle-post-99", description: "Factura FT/1", lines: [
      { accountId: 1, debit: 100, credit: 0, postable: true, validFrom: new Date("2020-01-01") },
      { accountId: 2, debit: 0, credit: 100, postable: true, validFrom: new Date("2020-01-01") },
    ] })).resolves.toMatchObject({ entryId: 99 });

    expect(reserve).toHaveBeenCalledWith({ companyId: 41, series: "FT", documentType: "INVOICE", userId: 8 });
    expect(transition).toHaveBeenCalledWith({ companyId: 41, documentId: 7, to: "ISSUED", userId: 8 });
    expect(post).toHaveBeenCalledWith(expect.objectContaining({ companyId: 41, periodId: 9, sourceDocumentId: 7, createdBy: 8 }));
  });

  it("completes fiscal validation and close evaluation after the accounting cycle", async () => {
    const scope = vi.spyOn(db, "assertAuditScopeForUser").mockResolvedValue(true);
    const append = vi.spyOn(db, "appendAuditEventForUser").mockResolvedValue({} as never);
    const accountant = callerFor("contabilista");
    await expect(accountant.fiscal.calculateIva({ netAmount: 1000, regime: "GERAL", rule: { code: "IVA-GER-001", regime: "GERAL", validFrom: new Date("2026-01-01"), rate: 0.14, evidence: "AGT Calendário Fiscal 2026" } })).resolves.toMatchObject({ netAmount: 1000, taxAmount: 140, totalAmount: 1140 });
    await expect(accountant.closing.evaluate({ checks: [{ code: "BALANCE", label: "Balancete equilibrado", passed: true, blocking: true }, { code: "IVA", label: "IVA validado", passed: true, blocking: true }] })).resolves.toMatchObject({ canClose: true });
    await expect(accountant.closing.validateReopen({ organizationId: 41, companyId: 41, periodId: 9, reason: "Correcção fiscal", correlationId: "cycle-reopen-41-9" })).resolves.toEqual({ reason: "Correcção fiscal", audited: true });
    expect(scope).toHaveBeenCalledWith({ actorUserId: 8, organizationId: 41, companyId: 41 });
    expect(append).toHaveBeenCalledWith(expect.objectContaining({ action: "PERIOD_REOPEN", actorUserId: 8, correlationId: "cycle-reopen-41-9" }));
  });
});

