import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import type { TrpcContext } from "./_core/context";

function context(role: "admin" | "auditor" | "operador"): TrpcContext {
  return { user: { id: 52, openId: role, name: role, email: `${role}@example.com`, loginMethod: "test", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: () => undefined } as TrpcContext["res"] };
}

afterEach(() => vi.restoreAllMocks());

describe("router Balancerts IA", () => {
  it("permite ao auditor consultar o estado sem acesso ao banco directo", async () => {
    const status = vi.spyOn(db, "getBalancertsIaStatusForUserCompany").mockResolvedValue({ enabled: true, local: false, azure: false, openai: false, internet: false, mode: "OFFLINE" });
    const result = await appRouter.createCaller(context("auditor")).ia.status({ companyId: 2 });
    expect(result.mode).toBe("OFFLINE");
    expect(status).toHaveBeenCalledWith({ userId: 52, companyId: 2 });
  });

  it("consulta sugestões pendentes com isolamento pelo router", async () => {
    const list = vi.spyOn(db, "getBalancertsIaSuggestionsForUserCompany").mockResolvedValue([]);
    const result = await appRouter.createCaller(context("auditor")).ia.suggestions({ companyId: 2, status: "PROPOSED" });
    expect(result).toEqual([]);
    expect(list).toHaveBeenCalledWith({ userId: 52, companyId: 2, status: "PROPOSED" });
  });

  it("bloqueia revisão a operador sem validação", async () => {
    const review = vi.spyOn(db, "reviewBalancertsIaSuggestionForUser");
    await expect(appRouter.createCaller(context("operador")).ia.reviewSuggestion({ companyId: 2, suggestionId: 4, decision: "APPROVED" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(review).not.toHaveBeenCalled();
  });

  it("aprova apenas a evidência e mantém applied false", async () => {
    const review = vi.spyOn(db, "reviewBalancertsIaSuggestionForUser").mockResolvedValue({ id: 4, status: "APPROVED", applied: false });
    const result = await appRouter.createCaller(context("admin")).ia.reviewSuggestion({ companyId: 2, suggestionId: 4, decision: "APPROVED", reviewNote: "Confirmado pelo contabilista" });
    expect(result).toEqual({ id: 4, status: "APPROVED", applied: false });
    expect(review).toHaveBeenCalledWith({ userId: 52, companyId: 2, suggestionId: 4, decision: "APPROVED", reviewNote: "Confirmado pelo contabilista" });
  });

  it("permite a configuração apenas a um perfil com alteração", async () => {
    const update = vi.spyOn(db, "updateBalancertsIaConfigForUser").mockResolvedValue({ id: 1, organizationId: 1, companyId: 2, enabled: 1, localEnabled: 1, localBaseUrl: "http://127.0.0.1", localPort: 11434, localModel: "qwen2.5:3b", azureEnabled: 0, azureEndpoint: null, azureDeployment: null, azureSecretRef: null, openaiEnabled: 0, openaiModel: "gpt-5-mini", openaiSecretRef: null, createdAt: new Date(), updatedAt: new Date() });
    await expect(appRouter.createCaller(context("auditor")).ia.updateConfig({ companyId: 2, enabled: true, localEnabled: true, localBaseUrl: "http://127.0.0.1", localPort: 11434, localModel: "qwen2.5:3b", azureEnabled: false, openaiEnabled: false, openaiModel: "gpt-5-mini" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    const result = await appRouter.createCaller(context("admin")).ia.updateConfig({ companyId: 2, enabled: true, localEnabled: true, localBaseUrl: "http://127.0.0.1", localPort: 11434, localModel: "qwen2.5:3b", azureEnabled: false, openaiEnabled: false, openaiModel: "gpt-5-mini" });
    expect(result.companyId).toBe(2);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ userId: 52, companyId: 2, localEnabled: true }));
  });
});
