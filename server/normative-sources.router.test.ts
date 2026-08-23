import { describe, expect, it, vi } from "vitest";
import * as db from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function contextWithRole(role: "admin" | "contabilista" | "auditor" | "operador" | "user"): TrpcContext {
  return {
    user: { id: 8, openId: `normative-${role}`, name: role, email: `${role}@example.com`, loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("fontes normativas IVA", () => {
  it("lista fontes por organização com limite seguro", async () => {
    const list = vi.spyOn(db, "listNormativeSourcesForUser").mockResolvedValue([{ id: 1, organizationId: 3, code: "IVA-LAW-14-23", title: "Lei n.º 14/23", instrumentType: "LAW", publicationDate: null, effectiveFrom: null, effectiveTo: null, sourceUrl: null, storageKey: null, sha256: null, pageCount: 77, verificationStatus: "CONFIRMED" as never, verifiedBy: null, verifiedAt: null, createdBy: 8, createdAt: new Date() }] as never);
    const caller = appRouter.createCaller(contextWithRole("contabilista"));
    await expect(caller.normative.sources({ organizationId: 3, limit: 500 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.normative.sources({ organizationId: 3, limit: 50 })).resolves.toHaveLength(1);
    expect(list).toHaveBeenCalledWith({ userId: 8, organizationId: 3, limit: 50 });
  });

  it("bloqueia operador antes de consultar fontes normativas", async () => {
    const list = vi.spyOn(db, "listNormativeSourcesForUser");
    const caller = appRouter.createCaller(contextWithRole("operador"));
    await expect(caller.normative.sources({ organizationId: 3 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(list).not.toHaveBeenCalled();
  });

  it("aceita relações com filtro de fonte e limite contratual", async () => {
    const list = vi.spyOn(db, "listNormativeSourceRelationsForUser").mockResolvedValue([]);
    const caller = appRouter.createCaller(contextWithRole("auditor"));
    await expect(caller.normative.sourceRelations({ organizationId: 3, sourceId: 1, limit: 100 })).resolves.toEqual([]);
    expect(list).toHaveBeenCalledWith({ userId: 8, organizationId: 3, sourceId: 1, limit: 100 });
  });
});
