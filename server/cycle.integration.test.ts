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
});

