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
