import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import type { TrpcContext } from "./_core/context";

function context(role: "admin" | "auditor" | "operador"): TrpcContext {
  return { user: { id: 52, openId: role, name: role, email: `${role}@example.com`, loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: () => undefined } as TrpcContext["res"] };
}

afterEach(() => vi.restoreAllMocks());

describe("router de compras", () => {
  it("permite ao auditor consultar encomendas da empresa", async () => {
    const list = vi.spyOn(db, "getPurchaseOrdersForUserCompany").mockResolvedValue([]);
    const result = await appRouter.createCaller(context("auditor")).purchases.list({ companyId: 2 });
    expect(result).toEqual([]);
    expect(list).toHaveBeenCalledWith({ userId: 52, companyId: 2 });
  });

  it("bloqueia criação ao auditor sem permissão de criação", async () => {
    const create = vi.spyOn(db, "createPurchaseOrderForUser");
    await expect(appRouter.createCaller(context("auditor")).purchases.create({ organizationId: 1, companyId: 2, supplierId: 3, requestedDate: new Date(), items: [{ description: "Serviço", quantity: 1, unitPrice: 100 }] })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(create).not.toHaveBeenCalled();
  });

  it("cria uma encomenda através do contrato persistente", async () => {
    const create = vi.spyOn(db, "createPurchaseOrderForUser").mockResolvedValue({ id: 10, orderNumber: "EC/2026/10", status: "DRAFT", totals: { net: 100, tax: 14, total: 114 }, itemCount: 1 });
    const result = await appRouter.createCaller(context("operador")).purchases.create({ organizationId: 1, companyId: 2, supplierId: 3, requestedDate: new Date(), items: [{ description: "Serviço", quantity: 1, unitPrice: 100, taxRate: 14 }] });
    expect(result.status).toBe("DRAFT");
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ userId: 52, supplierId: 3, items: [expect.objectContaining({ description: "Serviço" })] }));
  });

  it("transita uma encomenda com validação", async () => {
    const transition = vi.spyOn(db, "transitionPurchaseOrderForUser").mockResolvedValue({ id: 10, previousStatus: "DRAFT", status: "SUBMITTED" });
    const result = await appRouter.createCaller(context("admin")).purchases.transition({ companyId: 2, orderId: 10, target: "SUBMITTED" });
    expect(result.status).toBe("SUBMITTED");
    expect(transition).toHaveBeenCalledWith({ userId: 52, companyId: 2, orderId: 10, target: "SUBMITTED" });
  });
});
