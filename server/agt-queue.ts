export const AGT_MAX_POLL_ATTEMPTS = 8;
export const AGT_POLL_BACKOFF_MS = [60_000, 120_000, 300_000, 600_000, 900_000, 1_800_000, 3_600_000, 7_200_000] as const;

export function getAgtNextPollAt(attempts: number, now = new Date()) {
  const safeAttempts = Math.max(0, Math.floor(attempts));
  const delay = AGT_POLL_BACKOFF_MS[Math.min(safeAttempts, AGT_POLL_BACKOFF_MS.length - 1)];
  return new Date(now.getTime() + delay);
}

export function canPollAgtSubmission(state: string, attempts: number) {
  return state === "PROCESSING" && attempts < AGT_MAX_POLL_ATTEMPTS;
}

export function classifyAgtResult(resultCode?: string) {
  if (!resultCode) return "UNKNOWN" as const;
  if (resultCode === "0" || resultCode === "00") return "SUCCESS" as const;
  if (/^1|^2/.test(resultCode)) return "REJECTED" as const;
  return "RETRYABLE" as const;
}
