export type IntegrationState = "PENDING" | "SENT" | "ACKNOWLEDGED" | "FAILED" | "RECONCILIATION_REQUIRED";

export async function executeIdempotentIntegration<T>(input: { idempotencyKey: string; execute: (signal?: AbortSignal) => Promise<T>; maxRetries?: number; timeoutMs?: number }) {
  const maxRetries = input.maxRetries ?? 2;
  const timeoutMs = input.timeoutMs ?? 5000;
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const controller = new AbortController();
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    try {
      const timeout = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error("INTEGRATION_TIMEOUT")), timeoutMs);
      });
      const result = await Promise.race([input.execute(controller.signal), timeout]);
      return { state: "ACKNOWLEDGED" as const, idempotencyKey: input.idempotencyKey, attempts: attempt + 1, result };
    } catch (error) {
      lastError = error;
      if (error instanceof Error && error.message === "INTEGRATION_TIMEOUT") controller.abort();
      if (attempt === maxRetries) break;
    } finally {
      if (timeoutHandle) clearTimeout(timeoutHandle);
    }
  }
  return { state: "RECONCILIATION_REQUIRED" as const, idempotencyKey: input.idempotencyKey, attempts: maxRetries + 1, error: lastError instanceof Error ? lastError.message : "INTEGRATION_FAILED" };
}
