export type IntegrationState = "PENDING" | "SENT" | "ACKNOWLEDGED" | "FAILED" | "RECONCILIATION_REQUIRED";

export async function executeIdempotentIntegration<T>(input: { idempotencyKey: string; execute: () => Promise<T>; maxRetries?: number; timeoutMs?: number }) {
  const maxRetries = input.maxRetries ?? 2;
  const timeoutMs = input.timeoutMs ?? 5000;
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      const result = await Promise.race([input.execute(), new Promise<never>((_, reject) => setTimeout(() => reject(new Error("INTEGRATION_TIMEOUT")), timeoutMs))]);
      return { state: "ACKNOWLEDGED" as const, idempotencyKey: input.idempotencyKey, attempts: attempt + 1, result };
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries) break;
    }
  }
  return { state: "RECONCILIATION_REQUIRED" as const, idempotencyKey: input.idempotencyKey, attempts: maxRetries + 1, error: lastError instanceof Error ? lastError.message : "INTEGRATION_FAILED" };
}
