import { describe, expect, it } from "vitest";
import { isDueTodayOrTomorrow } from "./taskDueFilters";

describe("filtro de prazos de hoje ou amanhã", () => {
  const today = new Date("2026-08-20T00:00:00.000Z");
  const tomorrowEnd = new Date("2026-08-21T23:59:59.999Z");

  it("inclui prazos durante hoje e durante amanhã", () => {
    expect(isDueTodayOrTomorrow("2026-08-20T15:00:00.000Z", today, tomorrowEnd, "Pendente")).toBe(true);
    expect(isDueTodayOrTomorrow("2026-08-21T12:00:00.000Z", today, tomorrowEnd, "Em curso")).toBe(true);
  });

  it("exclui prazos anteriores, posteriores e tarefas sem prazo", () => {
    expect(isDueTodayOrTomorrow("2026-08-19T23:59:59.000Z", today, tomorrowEnd, "Pendente")).toBe(false);
    expect(isDueTodayOrTomorrow("2026-08-22T00:00:00.000Z", today, tomorrowEnd, "Pendente")).toBe(false);
    expect(isDueTodayOrTomorrow(null, today, tomorrowEnd, "Pendente")).toBe(false);
  });

  it("exclui tarefas concluídas ou canceladas mesmo que tenham prazo próximo", () => {
    expect(isDueTodayOrTomorrow("2026-08-20T10:00:00.000Z", today, tomorrowEnd, "Concluída")).toBe(false);
    expect(isDueTodayOrTomorrow("2026-08-21T10:00:00.000Z", today, tomorrowEnd, "Cancelada")).toBe(false);
  });
});
