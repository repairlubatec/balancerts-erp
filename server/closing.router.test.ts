import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import type { TrpcContext } from "./_core/context";

const context: TrpcContext = {
  user: { id: 41, openId: "closing-test", name: "Contabilista", email: "contabilista@example.com", loginMethod: "test", role: "contabilista", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: { clearCookie: () => undefined } as TrpcContext["res"],
};

afterEach(() => vi.restoreAllMocks());

describe("closing.validateReopen integration", () => {
  it("persists an audited reopen event with actor and correlation", async () => {
    const scope = vi.spyOn(db, "assertAuditScopeForUser").mockResolvedValue(true);
    const append = vi.spyOn(db, "appendAuditEventForUser").mockResolvedValue({} as never);
    const caller = appRouter.createCaller(context);
    const result = await caller.closing.validateReopen({ organizationId: 7, companyId: 8, periodId: 9, reason: "Correcção de documento emitido", correlationId: "reopen-7-9" });
    expect(result).toEqual({ reason: "Correcção de documento emitido", audited: true });
    expect(scope).toHaveBeenCalledWith({ actorUserId: 41, organizationId: 7, companyId: 8 });
    expect(append).toHaveBeenCalledWith(expect.objectContaining({ organizationId: 7, companyId: 8, actorUserId: 41, entityId: "9", action: "PERIOD_REOPEN", beforeState: "CLOSED", afterState: "REOPEN_REQUESTED", correlationId: "reopen-7-9" }));
  });
});
