import { describe, expect, it } from "vitest";
import { compareTaskOperationalUrgency, getTaskDueBucket, getTaskOperationalUrgencyScore } from "./taskUrgency";

const reference = new Date("2026-08-20T10:00:00");

describe("urgência operacional das tarefas", () => {
  it("classifica prazo atrasado, hoje, amanhã e sem prazo", () => {
    expect(getTaskDueBucket("2026-08-19T12:00:00", reference)).toBe("ATRASADA");
    expect(getTaskDueBucket("2026-08-20T18:00:00", reference)).toBe("HOJE");
    expect(getTaskDueBucket("2026-08-21T18:00:00", reference)).toBe("AMANHA");
    expect(getTaskDueBucket(null, reference)).toBe("SEM_PRAZO");
  });

  it("pondera prazo antes de prioridade e estado", () => {
    const atrasadaBaixa = { title: "A", dueDate: "2026-08-19T12:00:00", priority: "Baixa", state: "Pendente" };
    const hojeUrgente = { title: "B", dueDate: "2026-08-20T12:00:00", priority: "Urgente", state: "Em curso" };
    expect(getTaskOperationalUrgencyScore(atrasadaBaixa, reference)).toBeGreaterThan(getTaskOperationalUrgencyScore(hojeUrgente, reference));
    expect(compareTaskOperationalUrgency(atrasadaBaixa, hojeUrgente, reference)).toBeLessThan(0);
  });

  it("coloca tarefas concluídas e canceladas sem urgência operacional", () => {
    const active = { dueDate: "2026-08-20T12:00:00", priority: "Baixa", state: "Pendente" };
    expect(getTaskOperationalUrgencyScore({ ...active, state: "Concluída" }, reference)).toBe(0);
    expect(getTaskOperationalUrgencyScore({ ...active, state: "Cancelada" }, reference)).toBe(0);
    expect(getTaskOperationalUrgencyScore(active, reference)).toBeGreaterThan(0);
  });
});
