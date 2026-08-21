export type IATask = "classificar" | "preencher_rascunho" | "autocomplete" | "sugerir" | "analisar_documento" | "assistente" | "detectar_duplicado";

export type IARequest = { task: IATask; input: string; context?: Record<string, unknown> };
export type IAResult = { provider: "local" | "regras_locais"; model: string; content: string; confidence?: number; responseMs: number };
export type IAConfig = { localEnabled: boolean; localBaseUrl: string; localPort: number; localModel: string; azureEnabled?: boolean; azureEndpoint?: string | null; azureDeployment?: string | null; openaiEnabled?: boolean; openaiModel?: string };

export interface IAProvider { readonly id: "local"; readonly model: string; isAvailable(): Promise<boolean>; execute(request: IARequest): Promise<IAResult>; }

function promptFor(request: IARequest) { return `Tarefa: ${request.task}\nEntrada: ${request.input}\nContexto autorizado: ${JSON.stringify(request.context ?? {})}\nResponda de forma concisa, apenas como sugestão para revisão humana, sem executar operações.`; }

async function fetchWithTimeout(url: string, init?: RequestInit, timeoutMs = 1200) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { ...init, signal: controller.signal }); } finally { clearTimeout(timer); }
}

export class LocalAIProvider implements IAProvider {
  readonly id = "local" as const;
  constructor(private readonly config: Pick<IAConfig, "localBaseUrl" | "localPort" | "localModel">) {}
  get model() { return this.config.localModel; }
  private baseUrl() {
    const configured = this.config.localBaseUrl.replace(/\/$/, "");
    try { const parsed = new URL(configured); return parsed.port ? configured : `${configured}:${this.config.localPort}`; } catch { return `${configured}:${this.config.localPort}`; }
  }
  async isAvailable() { try { const response = await fetchWithTimeout(`${this.baseUrl()}/api/tags`); return response.ok; } catch { return false; } }
  async execute(request: IARequest) {
    const started = Date.now();
    const response = await fetchWithTimeout(`${this.baseUrl()}/api/generate`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ model: this.model, prompt: promptFor(request), stream: false }) }, 15000);
    if (!response.ok) throw new Error("IA_LOCAL_INDISPONIVEL");
    const payload = await response.json() as { response?: string };
    return { provider: this.id, model: this.model, content: payload.response ?? "", confidence: 0.7, responseMs: Date.now() - started };
  }
}

export class LocalRulesProvider implements IAProvider {
  readonly id = "local" as const;
  readonly model = "regras-locais-v1";
  async isAvailable() { return true; }
  async execute(request: IARequest) { return { provider: this.id, model: this.model, content: JSON.stringify({ tarefa: request.task, sugestao: "Processamento local por regras; necessita de validação humana.", aplicaçãoAutomática: false }), confidence: 0.45, responseMs: 0 }; }
}

export class AIRouter {
  constructor(private readonly config: IAConfig) {}
  providers() { return { local: new LocalAIProvider(this.config), rules: new LocalRulesProvider() }; }
  async status() {
    const providers = this.providers();
    const localRuntime = this.config.localEnabled && await providers.local.isAvailable();
    return { local: localRuntime, azure: false, openai: false, internet: false, mode: localRuntime ? "IA_LOCAL" : "REGRAS_LOCAIS" as const, custoPorDocumento: 0, apiPagaNecessaria: false };
  }
  async execute(request: IARequest) {
    if (this.config.localEnabled) {
      const runtime = this.providers().local;
      if (await runtime.isAvailable()) { try { return await runtime.execute(request); } catch { /* fallback local determinístico */ } }
    }
    return this.providers().rules.execute(request);
  }
}
