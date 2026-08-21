import os from "node:os";
import { LocalAIProvider } from "./providers";

export async function getBalancertsIaDiagnostics(input: { localBaseUrl: string; localPort: number; localModel: string }) {
  const provider = new LocalAIProvider(input);
  const localRuntime = await provider.isAvailable();
  const totalMemoryGb = Number((os.totalmem() / 1024 ** 3).toFixed(1));
  const freeMemoryGb = Number((os.freemem() / 1024 ** 3).toFixed(1));
  const cpuCores = os.cpus().length;
  const gpu = process.platform === "win32" ? "não verificada pelo runtime" : "não detectada pelo processo";
  const recommendedModel = totalMemoryGb >= 16 && cpuCores >= 8 ? "qwen2.5:7b" : totalMemoryGb >= 8 ? "qwen2.5:3b" : "qwen2.5:1.5b";
  return {
    documentIntelligence: true,
    docling: false,
    ocr: false,
    modelLocal: localRuntime,
    cpu: { cores: cpuCores, architecture: process.arch },
    ram: { totalGb: totalMemoryGb, freeGb: freeMemoryGb },
    gpu,
    operatingSystem: `${process.platform}-${process.arch}`,
    offline: true,
    online: true,
    internetRequired: false,
    paidApiRequired: false,
    costPerDocumentKz: 0,
    localRuntimeEndpoint: `${input.localBaseUrl}:${input.localPort}`,
    configuredModel: input.localModel,
    recommendedModel,
    runtimeMessage: localRuntime ? "Runtime local disponível." : "Runtime local indisponível; regras locais continuam activas.",
  } as const;
}
