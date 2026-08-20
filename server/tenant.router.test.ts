import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import type { TrpcContext } from "./_core/context";

const auditorContext: TrpcContext = { user: { id: 63, openId: "tenant-auditor", name: "Auditor", email: "auditor@example.com", loginMethod: "test", role: "auditor", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: () => undefined } as TrpcContext["res"] };
const adminContext: TrpcContext = { user: { id: 1, openId: "tenant-admin", name: "Administrador", email: "admin@example.com", loginMethod: "test", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: () => undefined } as TrpcContext["res"] };

afterEach(() => vi.restoreAllMocks());

describe("tenant-aware company queries", () => {
  it("passes the authenticated actor into the company query", async () => {
    vi.spyOn(db, "getCompaniesForUser").mockResolvedValue([]);
    const result = await appRouter.createCaller(auditorContext).companies.list();
    expect(result).toEqual([]);
    expect(db.getCompaniesForUser).toHaveBeenCalledWith(63);
  });
});

describe("effective company role", () => {
  it("resolves the effective role for the authenticated actor and company", async () => {
    vi.spyOn(db, "getEffectiveRoleForUserCompany").mockResolvedValue("contabilista");
    const result = await appRouter.createCaller(auditorContext).companies.effectiveRole({ companyId: 4 });
    expect(result).toBe("contabilista");
    expect(db.getEffectiveRoleForUserCompany).toHaveBeenCalledWith(63, 4);
  });
});

describe("organization memberships", () => {
  it("allows an authenticated user to read own memberships", async () => {
    vi.spyOn(db, "listOrganizationMembershipsForUser").mockResolvedValue([]);
    const result = await appRouter.createCaller(auditorContext).companies.memberships({ organizationId: 9 });
    expect(result).toEqual([]);
    expect(db.listOrganizationMembershipsForUser).toHaveBeenCalledWith({ actorUserId: 63, organizationId: 9 });
  });

  it("allows an administrator to add a membership with a scoped role", async () => {
    vi.spyOn(db, "createOrganizationMembershipForUser").mockResolvedValue([]);
    const result = await appRouter.createCaller(adminContext).companies.addMembership({ organizationId: 9, userId: 72, role: "contabilista" });
    expect(result).toEqual([]);
    expect(db.createOrganizationMembershipForUser).toHaveBeenCalledWith({ actorUserId: 1, organizationId: 9, userId: 72, role: "contabilista" });
  });

  it("blocks an auditor from changing memberships", async () => {
    const createMembership = vi.spyOn(db, "createOrganizationMembershipForUser");
    await expect(appRouter.createCaller(auditorContext).companies.addMembership({ organizationId: 9, userId: 72, role: "auditor" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(createMembership).not.toHaveBeenCalled();
  });

});

describe("multiutilizador e isolamento de permissões", () => {
  const userContext = (id: number): TrpcContext => ({ user: { id, openId: `tenant-user-${id}`, name: `Utilizador ${id}`, email: `user${id}@example.com`, loginMethod: "test", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: () => undefined } as TrpcContext["res"] });

  it("permite consulta a utilizador com override explícito no membership", async () => {
    vi.spyOn(db, "getEffectivePermissionsForUserCompany").mockResolvedValue(["companies:read"]);
    vi.spyOn(db, "getEffectiveRoleForUserCompany").mockResolvedValue("contabilista");
    const result = await appRouter.createCaller(userContext(72)).companies.effectiveRole({ companyId: 14 });
    expect(result).toBe("contabilista");
    expect(db.getEffectivePermissionsForUserCompany).toHaveBeenCalledWith(72, 14);
    expect(db.getEffectiveRoleForUserCompany).toHaveBeenCalledWith(72, 14);
  });

  it("bloqueia utilizador sem membership ou override antes da consulta", async () => {
    vi.spyOn(db, "getEffectivePermissionsForUserCompany").mockResolvedValue([]);
    const getRole = vi.spyOn(db, "getEffectiveRoleForUserCompany");
    await expect(appRouter.createCaller(userContext(73)).companies.effectiveRole({ companyId: 14 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(getRole).not.toHaveBeenCalled();
  });

  it("mantém as consultas separadas por actor", async () => {
    const getCompanies = vi.spyOn(db, "getCompaniesForUser").mockImplementation(async (userId) => [{ company: { id: userId, name: `Empresa ${userId}`, nif: `5000000${userId}`, configurationStatus: "READY", ivaRegime: "EXCLUSAO", functionalCurrency: "AOA", organizationId: userId } } as never]);
    const adminResult = await appRouter.createCaller(adminContext).companies.list();
    const auditorResult = await appRouter.createCaller(auditorContext).companies.list();
    expect(adminResult[0]?.company.id).toBe(1);
    expect(auditorResult[0]?.company.id).toBe(63);
    expect(getCompanies).toHaveBeenNthCalledWith(1, 1);
    expect(getCompanies).toHaveBeenNthCalledWith(2, 63);
  });
});
