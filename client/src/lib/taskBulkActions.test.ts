import { describe, expect, it } from "vitest";
import { canApplyBulkTaskChange, describeBulkTaskChange, describeBulkTaskUndo, getBulkTaskPriorityLabel, getBulkTaskStatusLabel } from "./taskBulkActions";

describe("acções em massa do Centro de Tarefas", () => {
  it("traduz todas as prioridades e estados para português", () => {
    expect(["LOW", "NORMAL", "HIGH", "URGENT"].map((value) => getBulkTaskPriorityLabel(value as never))).toEqual(["Baixa", "Média", "Alta", "Urgente"]);
    expect(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map((value) => getBulkTaskStatusLabel(value as never))).toEqual(["Pendente", "Em curso", "Concluída", "Cancelada"]);
  });

  it("limita a operação a uma selecção válida de até 100 tarefas", () => {
    expect(canApplyBulkTaskChange([])).toBe(false);
    expect(canApplyBulkTaskChange([1, 2, 3])).toBe(true);
    expect(canApplyBulkTaskChange(Array.from({ length: 101 }, (_, index) => index + 1))).toBe(false);
  });

  it("produz descrições auditáveis para aplicar e desfazer", () => {
    expect(describeBulkTaskChange("priority", 3, "Alta")).toContain("a prioridade de 3 tarefa(s)");
    expect(describeBulkTaskChange("status", 2, "Concluída")).toContain("o estado de 2 tarefa(s)");
    expect(describeBulkTaskUndo(4, "priority")).toBe("4 prioridade(s) foram repostos ao valor anterior.");
  });
});
