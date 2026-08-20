import { describe, expect, it } from "vitest";
import { compareTaskDueDates } from "./taskSorting";

describe("ordenação por data limite", () => {
  it("coloca uma tarefa vencida antes de uma tarefa com prazo futuro", () => {
    expect(compareTaskDueDates("2026-08-18T00:00:00.000Z", "2026-08-22T00:00:00.000Z")).toBeLessThan(0);
  });

  it("coloca a data mais próxima antes da data mais distante", () => {
    expect(compareTaskDueDates("2026-08-21T00:00:00.000Z", "2026-09-01T00:00:00.000Z")).toBeLessThan(0);
  });

  it("mantém tarefas sem prazo no fim da ordenação ascendente", () => {
    expect(compareTaskDueDates(null, "2026-08-21T00:00:00.000Z")).toBeGreaterThan(0);
    expect(compareTaskDueDates(null, null)).toBe(0);
  });
});
