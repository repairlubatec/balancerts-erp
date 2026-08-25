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

describe("closing.readiness integration", () => {
  it("obtém a prontidão real com o escopo do utilizador autenticado", async () => {
    const readiness = vi.spyOn(db, "getFiscalPeriodCloseReadinessForUser").mockResolvedValue({
      periodId: 9,
      companyId: 8,
      status: "OPEN",
      canClose: false,
      blockers: [{ code: "DOCUMENTS_VALIDATED", label: "Documentos do período validados", passed: false, blocking: true }],
      completed: 4,
      total: 5,
      checks: [],
    });
    const caller = appRouter.createCaller(context);
    const result = await caller.closing.readiness({ organizationId: 7, companyId: 8, periodId: 9 });
    expect(result.canClose).toBe(false);
    expect(result.blockers[0]?.code).toBe("DOCUMENTS_VALIDATED");
    expect(readiness).toHaveBeenCalledWith({ userId: 41, organizationId: 7, companyId: 8, periodId: 9 });
  });
});

describe("closing.validateReopen integration", () => {
  it("persists an audited reopen event with actor and correlation", async () => {
    const scope = vi.spyOn(db, "assertAuditScopeForUser").mockResolvedValue(true);
    const period = vi.spyOn(db, "assertClosedFiscalPeriodForUserCompany").mockResolvedValue(true);
    const append = vi.spyOn(db, "appendAuditEventForUser").mockResolvedValue({} as never);
    const caller = appRouter.createCaller(context);
    const result = await caller.closing.validateReopen({ organizationId: 7, companyId: 8, periodId: 9, reason: "Correcção de documento emitido", correlationId: "reopen-7-9" });
    expect(result).toEqual({ reason: "Correcção de documento emitido", audited: true });
    expect(scope).toHaveBeenCalledWith({ actorUserId: 41, organizationId: 7, companyId: 8 });
    expect(period).toHaveBeenCalledWith({ actorUserId: 41, companyId: 8, periodId: 9 });
    expect(append).toHaveBeenCalledWith(expect.objectContaining({ organizationId: 7, companyId: 8, actorUserId: 41, entityId: "9", action: "PERIOD_REOPEN", beforeState: JSON.stringify({ state: "CLOSED", periodId: 9 }), afterState: JSON.stringify({ state: "REOPEN_REQUESTED", periodId: 9, reason: "Correcção de documento emitido" }), correlationId: "reopen-7-9" }));
  });
});
