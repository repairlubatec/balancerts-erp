import { describe, expect, it } from "vitest";
import { getBulkTaskStatusNotification } from "./taskNotifications";

describe("notificação de alteração de tarefas em massa", () => {
  it("apresenta quantidade e estado concluído", () => {
    expect(getBulkTaskStatusNotification("COMPLETED", 3)).toEqual({
      title: "Tarefas actualizadas",
      description: "3 tarefa(s) passaram para “Concluída”.",
      feedback: "3 tarefa(s) actualizada(s) para Concluída. Cada alteração foi auditada.",
      statusText: "Concluída",
    });
  });

  it("traduz os restantes estados sem termos técnicos", () => {
    expect(getBulkTaskStatusNotification("PENDING", 1).statusText).toBe("Pendente");
    expect(getBulkTaskStatusNotification("IN_PROGRESS", 2).statusText).toBe("Em curso");
    expect(getBulkTaskStatusNotification("CANCELLED", 4).statusText).toBe("Cancelada");
  });
});
