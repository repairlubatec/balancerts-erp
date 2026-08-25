export type AiHistoryLike = { blocker: string; title: string; confidence: "LOW" | "MEDIUM" | "HIGH"; generatedAt: string; diagnosis: string };

export function getSuggestionComparison<T extends AiHistoryLike>(history: T[], blocker: string | null) {
  return blocker ? history.filter(item => item.blocker === blocker) : [];
}

export function summarizeSuggestionHistory<T extends AiHistoryLike>(history: T[], review: Record<string, "REVIEWED" | "DISCARDED">) {
  return history.map(item => ({ code: item.blocker, label: `${item.title} · ${item.confidence} · ${review[item.generatedAt] ?? "PENDENTE"}`, value: 1 }));
}
