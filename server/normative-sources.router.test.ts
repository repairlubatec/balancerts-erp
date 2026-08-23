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

  it("devolve apenas regras activas por defeito e aceita uma data de vigência", async () => {
    const list = vi.spyOn(db, "listIvaNormativeRulesForUser").mockResolvedValue([]);
    const caller = appRouter.createCaller(contextWithRole("auditor"));
    await expect(caller.normative.ivaRules({ organizationId: 3, regime: "GERAL", ruleType: "TAX_RATE", asOf: new Date("2026-08-23T00:00:00Z"), limit: 25 })).resolves.toEqual([]);
    expect(list).toHaveBeenCalledWith({ userId: 8, organizationId: 3, regime: "GERAL", ruleType: "TAX_RATE", asOf: new Date("2026-08-23T00:00:00Z"), includePending: false, limit: 25 });
  });

  it("consulta a conta 34.5 por código sem activar mapeamentos pendentes", async () => {
    const list = vi.spyOn(db, "listIvaAccountMappingsForUser").mockResolvedValue([]);
    const caller = appRouter.createCaller(contextWithRole("contabilista"));
    await expect(caller.normative.ivaAccounts({ organizationId: 3, accountCode: "34.5", asOf: new Date("2026-08-23T00:00:00Z"), limit: 10 })).resolves.toEqual([]);
    expect(list).toHaveBeenCalledWith({ userId: 8, organizationId: 3, accountCode: "34.5", asOf: new Date("2026-08-23T00:00:00Z"), includePending: false, limit: 10 });
  });

  it("ignora includePending quando solicitado por um leitor", async () => {
    const list = vi.spyOn(db, "listIvaNormativeRulesForUser").mockResolvedValue([]);
    const caller = appRouter.createCaller(contextWithRole("auditor"));
    await expect(caller.normative.ivaRules({ organizationId: 3, includePending: true })).resolves.toEqual([]);
    expect(list).toHaveBeenCalledWith({ userId: 8, organizationId: 3, includePending: false });
  });

  it("restringe revisão e activação ao papel administrativo", async () => {
    const review = vi.spyOn(db, "reviewIvaNormativeRuleForUser").mockResolvedValue({ id: 9, verificationStatus: "HUMAN_APPROVED", activated: false });
    const activate = vi.spyOn(db, "activateIvaNormativeRuleForUser").mockResolvedValue({ id: 9, verificationStatus: "ACTIVE", activated: true });
    const accountant = appRouter.createCaller(contextWithRole("contabilista"));
    await expect(accountant.normative.reviewIvaRule({ organizationId: 3, ruleId: 9, decision: "HUMAN_APPROVED" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    const admin = appRouter.createCaller(contextWithRole("admin"));
    await expect(admin.normative.reviewIvaRule({ organizationId: 3, ruleId: 9, decision: "HUMAN_APPROVED" })).resolves.toMatchObject({ verificationStatus: "HUMAN_APPROVED", activated: false });
    await expect(admin.normative.activateIvaRule({ organizationId: 3, ruleId: 9 })).resolves.toMatchObject({ verificationStatus: "ACTIVE", activated: true });
    expect(review).toHaveBeenCalledWith({ userId: 8, organizationId: 3, ruleId: 9, decision: "HUMAN_APPROVED" });
    expect(activate).toHaveBeenCalledWith({ userId: 8, organizationId: 3, ruleId: 9 });
  });

  it("aceita relações com filtro de fonte e limite contratual", async () => {
    const list = vi.spyOn(db, "listNormativeSourceRelationsForUser").mockResolvedValue([]);
    const caller = appRouter.createCaller(contextWithRole("auditor"));
    await expect(caller.normative.sourceRelations({ organizationId: 3, sourceId: 1, limit: 100 })).resolves.toEqual([]);
    expect(list).toHaveBeenCalledWith({ userId: 8, organizationId: 3, sourceId: 1, limit: 100 });
  });
});
