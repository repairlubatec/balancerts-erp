import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import type { TrpcContext } from "./_core/context";

const auditorContext: TrpcContext = { user: { id: 63, openId: "tenant-auditor", name: "Auditor", email: "auditor@example.com", loginMethod: "test", role: "auditor", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: () => undefined } as TrpcContext["res"] };

afterEach(() => vi.restoreAllMocks());

describe("tenant-aware company queries", () => {
  it("passes the authenticated actor into the company query", async () => {
    vi.spyOn(db, "getCompaniesForUser").mockResolvedValue([]);
    const result = await appRouter.createCaller(auditorContext).companies.list();
    expect(result).toEqual([]);
    expect(db.getCompaniesForUser).toHaveBeenCalledWith(63);
  });
});
