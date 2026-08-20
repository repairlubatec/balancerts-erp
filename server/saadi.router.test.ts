import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import * as saadi from "./saadi";
import type { TrpcContext } from "./_core/context";

function context(role: "admin" | "contabilista" | "auditor" | "operador" | "user"): TrpcContext {
  return { user: { id: 52, openId: role, name: role, email: `${role}@example.com`, loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: () => undefined } as TrpcContext["res"] };
}

afterEach(() => vi.restoreAllMocks());

describe("router SAADI", () => {
  it("permite ao Auditor consultar estudos, mantendo o escopo da empresa", async () => {
    const list = vi.spyOn(saadi, "listSaadiStudiesForUser").mockResolvedValue([]);
    const result = await appRouter.createCaller(context("auditor")).saadi.studies({ organizationId: 10, companyId: 20 });
    expect(result).toEqual([]);
    expect(list).toHaveBeenCalledWith({ userId: 52, organizationId: 10, companyId: 20 });
  });

  it("permite ao Contabilista criar um estudo SAADI, sem chamar operações do ERP", async () => {
    const create = vi.spyOn(saadi, "createSaadiStudy").mockResolvedValue({ id: 1 } as never);
    const result = await appRouter.createCaller(context("contabilista")).saadi.createStudy({ organizationId: 10, companyId: 20, studyCode: "INV-001", name: "Projecto solar", baseCurrency: "AOA" });
    expect(result).toEqual({ id: 1 });
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ userId: 52, organizationId: 10, companyId: 20 }));
  });

  it("bloqueia utilizador sem módulo autorizado antes de aceder aos helpers", async () => {
    const lookup = vi.spyOn(saadi, "listSaadiStudiesForUser");
    await expect(appRouter.createCaller(context("user")).saadi.studies({ organizationId: 10, companyId: 20 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(lookup).not.toHaveBeenCalled();
  });

  it("encaminha a aprovação de versão apenas para o helper autorizado", async () => {
    const transition = vi.spyOn(saadi, "transitionSaadiVersionForUser").mockResolvedValue({ id: 7, status: "APPROVED", alreadyArchived: false });
    const result = await appRouter.createCaller(context("contabilista")).saadi.transitionVersion({ organizationId: 10, companyId: 20, versionId: 7, decision: "APPROVE" });
    expect(result.status).toBe("APPROVED");
    expect(transition).toHaveBeenCalledWith({ userId: 52, organizationId: 10, companyId: 20, versionId: 7, decision: "APPROVE" });
  });

  it("bloqueia Auditor de aprovar versão, pois apenas lê o módulo", async () => {
    const transition = vi.spyOn(saadi, "transitionSaadiVersionForUser");
    await expect(appRouter.createCaller(context("auditor")).saadi.transitionVersion({ organizationId: 10, companyId: 20, versionId: 7, decision: "APPROVE" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(transition).not.toHaveBeenCalled();
  });

  it("bloqueia Operador de criar snapshots, apesar de permitir leitura", async () => {
    const create = vi.spyOn(saadi, "createSaadiSnapshot");
    const request = { organizationId: 10, companyId: 20, periodIds: [30], currency: "AOA", purpose: "Análise", contractVersion: "v1.0", correlationId: "r-1", includeHrDetails: false };
    const snapshot = { request, status: "CONCLUIDA" as const, provenance: [], metrics: {} };
    await expect(appRouter.createCaller(context("operador")).saadi.createSnapshot({ studyId: 1, request, snapshot, idempotencyKey: "s-1" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(create).not.toHaveBeenCalled();
  });
});
