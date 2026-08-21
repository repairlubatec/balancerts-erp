import { describe, expect, it, vi } from "vitest";
import { AIRouter, LocalAIProvider, type IAConfig } from "./balancerts-ia/providers";

const baseConfig: IAConfig = { localEnabled: true, localBaseUrl: "http://127.0.0.1", localPort: 11434, localModel: "qwen2.5:3b", azureEnabled: false, azureEndpoint: null, azureDeployment: null, openaiEnabled: false, openaiModel: "gpt-5-mini" };

describe("Balancerts IA providers", () => {
  it("marca offline quando nenhum provider está disponível", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(new AIRouter(baseConfig).status()).resolves.toMatchObject({ local: false, azure: false, openai: false, internet: false, mode: "REGRAS_LOCAIS" });
    vi.unstubAllGlobals();
  });

  it("não consulta providers pagos e funciona com regras locais desactivadas", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);
    await new AIRouter({ ...baseConfig, localEnabled: false, azureEnabled: false, openaiEnabled: false }).status();
    expect(fetchMock).not.toHaveBeenCalled();
    const result = await new AIRouter({ ...baseConfig, localEnabled: false, azureEnabled: false, openaiEnabled: false }).execute({ task: "classificar", input: "factura" });
    expect(result).toMatchObject({ provider: "local", model: "regras-locais-v1" });
    vi.unstubAllGlobals();
  });

  it("usa o endpoint local quando está disponível", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ models: [] }) }).mockResolvedValueOnce({ ok: true, json: async () => ({ response: "sugestão local" }) });
    vi.stubGlobal("fetch", fetchMock);
    const result = await new AIRouter(baseConfig).execute({ task: "classificar", input: "óleo hidráulico" });
    expect(result).toMatchObject({ provider: "local", model: "qwen2.5:3b", content: "sugestão local" });
    vi.unstubAllGlobals();
  });

  it("aceita endereço Ollama já configurado com porta explícita", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ models: [] }) });
    vi.stubGlobal("fetch", fetchMock);
    await new LocalAIProvider({ ...baseConfig, localBaseUrl: "http://127.0.0.1:11434", localPort: 9999 }).isAvailable();
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://127.0.0.1:11434/api/tags");
    vi.unstubAllGlobals();
  });

  it("mantém o provider local independente do runtime Ollama", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(new LocalAIProvider(baseConfig).model).toBe("qwen2.5:3b");
    await expect(new LocalAIProvider(baseConfig).isAvailable()).resolves.toBe(false);
    vi.unstubAllGlobals();
  });
});
