import { describe, expect, it } from "vitest";
import { getSuggestionComparison, summarizeSuggestionHistory } from "./aiSuggestionHistory";

const history = [
  { blocker: "B1", title: "Primeira", confidence: "LOW" as const, generatedAt: "2026-08-25T00:00:00.000Z", diagnosis: "D1" },
  { blocker: "B1", title: "Segunda", confidence: "HIGH" as const, generatedAt: "2026-08-25T00:01:00.000Z", diagnosis: "D2" },
  { blocker: "B2", title: "Outra", confidence: "MEDIUM" as const, generatedAt: "2026-08-25T00:02:00.000Z", diagnosis: "D3" },
];

describe("histórico consultivo IA", () => {
  it("compara apenas sugestões do mesmo bloqueio", () => {
    expect(getSuggestionComparison(history, "B1")).toHaveLength(2);
    expect(getSuggestionComparison(history, "B2")[0]?.title).toBe("Outra");
    expect(getSuggestionComparison(history, null)).toEqual([]);
  });

  it("resume estados sem alterar os itens originais", () => {
    const rows = summarizeSuggestionHistory(history, { "2026-08-25T00:00:00.000Z": "REVIEWED" });
    expect(rows[0]).toMatchObject({ code: "B1", label: "Primeira · LOW · REVIEWED", value: 1 });
    expect(rows[1]?.label).toContain("PENDENTE");
    expect(history[0]?.title).toBe("Primeira");
  });
});
