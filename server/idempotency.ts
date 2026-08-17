export type IdempotencyRecord<T> = { key: string; status: "PROCESSING" | "COMPLETED" | "FAILED"; result?: T; error?: string };

export function resolveIdempotentRequest<T>(records: IdempotencyRecord<T>[], key: string) {
  if (!key.trim()) throw new Error("IDEMPOTENCY_KEY_REQUIRED");
  const existing = records.find((record) => record.key === key);
  if (!existing) return { action: "EXECUTE" as const };
  if (existing.status === "COMPLETED") return { action: "RETURN_EXISTING" as const, result: existing.result };
  if (existing.status === "PROCESSING") return { action: "RETRY_LATER" as const };
  return { action: "RETRY" as const, error: existing.error };
}
