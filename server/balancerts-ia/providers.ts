import { invokeLLM } from "../_core/llm";

export type IATask = "classificar" | "autocomplete" | "sugerir" | "analisar_documento" | "assistente" | "detectar_duplicado";

export type IARequest = {
  task: IATask;
  input: string;
  context?: Record<string, unknown>;
};

export type IAResult = {
  provider: string;
  model: string;
  content: string;
  confidence?: number;
  responseMs: number;
};

export type IAConfig = {
  localEnabled: boolean;
  localBaseUrl: string;
  localPort: number;
  localModel: string;
  azureEnabled: boolean;
  azureEndpoint?: string | null;
  azureDeployment?: string | null;
  openaiEnabled: boolean;
  openaiModel: string;
};

export interface IAProvider {
  readonly id: "local" | "azure" | "openai";
  readonly model: string;
  isAvailable(): Promise<boolean>;
  execute(request: IARequest): Promise<IAResult>;
}

function promptFor(request: IARequest) {
  return `Tarefa: ${request.task}\nEntrada: ${request.input}\nContexto autorizado: ${JSON.stringify(request.context ?? {})}\nResponda de forma concisa e não execute operações.`;
}

async function fetchWithTimeout(url: string, init?: RequestInit, timeoutMs = 1200) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { ...init, signal: controller.signal }); } finally { clearTimeout(timer); }
}

export class LocalAIProvider implements IAProvider {
  readonly id = "local" as const;
  constructor(private readonly config: Pick<IAConfig, "localBaseUrl" | "localPort" | "localModel">) {}
  get model() { return this.config.localModel; }
  private baseUrl() { return `${this.config.localBaseUrl.replace(/\/$/, "")}:${this.config.localPort}`; }
  async isAvailable() { try { const response = await fetchWithTimeout(`${this.baseUrl()}/api/tags`); return response.ok; } catch { return false; } }
  async execute(request: IARequest) {
    const started = Date.now();
    const response = await fetchWithTimeout(`${this.baseUrl()}/api/generate`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ model: this.model, prompt: promptFor(request), stream: false }) }, 15000);
    if (!response.ok) throw new Error("IA_LOCAL_INDISPONIVEL");
    const payload = await response.json() as { response?: string };
    return { provider: this.id, model: this.model, content: payload.response ?? "", responseMs: Date.now() - started };
  }
}

export class AzureAIProvider implements IAProvider {
  readonly id = "azure" as const;
  constructor(private readonly config: Pick<IAConfig, "azureEndpoint" | "azureDeployment">) {}
  get model() { return this.config.azureDeployment ?? "deployment-nao-configurado"; }
  private apiKey() { return process.env.AZURE_OPENAI_API_KEY; }
  async isAvailable() { return Boolean(this.config.azureEndpoint && this.config.azureDeployment && this.apiKey()); }
  async execute(request: IARequest) {
    const started = Date.now();
    if (!(await this.isAvailable())) throw new Error("IA_AZURE_NAO_CONFIGURADA");
    const endpoint = `${this.config.azureEndpoint!.replace(/\/$/, "")}/openai/deployments/${this.config.azureDeployment}/chat/completions?api-version=2024-10-21`;
    const response = await fetchWithTimeout(endpoint, { method: "POST", headers: { "content-type": "application/json", "api-key": this.apiKey()! }, body: JSON.stringify({ messages: [{ role: "system", content: "És o Balancerts IA. Não executes operações; devolve apenas análise ou sugestão." }, { role: "user", content: promptFor(request) }] }) }, 30000);
    if (!response.ok) throw new Error("IA_AZURE_INDISPONIVEL");
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    return { provider: this.id, model: this.model, content: payload.choices?.[0]?.message?.content ?? "", responseMs: Date.now() - started };
  }
}

export class OpenAIProvider implements IAProvider {
  readonly id = "openai" as const;
  constructor(private readonly config: Pick<IAConfig, "openaiModel">) {}
  get model() { return this.config.openaiModel; }
  private apiKey() { return process.env.OPENAI_API_KEY; }
  async isAvailable() { return Boolean(this.apiKey()); }
  async execute(request: IARequest) {
    const started = Date.now();
    if (!(await this.isAvailable())) throw new Error("IA_OPENAI_NAO_CONFIGURADA");
    const response = await fetchWithTimeout("https://api.openai.com/v1/chat/completions", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${this.apiKey()}` }, body: JSON.stringify({ model: this.model, messages: [{ role: "system", content: "És o Balancerts IA. Não executes operações; devolve apenas análise ou sugestão." }, { role: "user", content: promptFor(request) }] }) }, 30000);
    if (!response.ok) throw new Error("IA_OPENAI_INDISPONIVEL");
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    return { provider: this.id, model: this.model, content: payload.choices?.[0]?.message?.content ?? "", responseMs: Date.now() - started };
  }
}

export class AIRouter {
  constructor(private readonly config: IAConfig) {}
  providers() { return { local: new LocalAIProvider(this.config), azure: new AzureAIProvider(this.config), openai: new OpenAIProvider(this.config) }; }
  async status() {
    const providers = this.providers();
    const [localAvailable, azureAvailable, openaiAvailable] = await Promise.all([this.config.localEnabled ? providers.local.isAvailable() : Promise.resolve(false), this.config.azureEnabled ? providers.azure.isAvailable() : Promise.resolve(false), this.config.openaiEnabled ? providers.openai.isAvailable() : Promise.resolve(false)]);
    const local = this.config.localEnabled && localAvailable;
    const azure = this.config.azureEnabled && azureAvailable;
    const openai = this.config.openaiEnabled && openaiAvailable;
    return { local, azure, openai, internet: azure || openai, mode: local ? (azure || openai ? "ONLINE_LOCAL_DISPONIVEL" : "ONLINE_IA_LOCAL") : (azure || openai ? "ONLINE_CLOUD" : "OFFLINE") } as const;
  }
  async execute(request: IARequest) {
    const providers = this.providers();
    const preferred: IAProvider[] = ["analisar_documento", "assistente", "detectar_duplicado"].includes(request.task) ? [...(this.config.azureEnabled ? [providers.azure] : []), ...(this.config.openaiEnabled ? [providers.openai] : []), ...(this.config.localEnabled ? [providers.local] : [])] : [...(this.config.localEnabled ? [providers.local] : []), ...(this.config.azureEnabled ? [providers.azure] : []), ...(this.config.openaiEnabled ? [providers.openai] : [])];
    for (const provider of preferred) { if (await provider.isAvailable()) { try { return await provider.execute(request); } catch { /* tenta o próximo sem bloquear o ERP */ } } }
    throw new Error("IA_SEM_PROVEDOR_DISPONIVEL");
  }
}

export async function invokeBuiltInCloud(request: IARequest) {
  const response = await invokeLLM({ messages: [{ role: "system", content: "És o Balancerts IA. Não executes operações; devolve apenas análise ou sugestão." }, { role: "user", content: promptFor(request) }] });
  return response.choices[0]?.message?.content ?? "";
}
