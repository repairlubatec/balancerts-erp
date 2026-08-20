import { describe, expect, it } from "vitest";
import { buildTaskNotificationsCsv, taskNotificationsExportFilename } from "./taskNotificationExport";

describe("exportação do histórico de notificações", () => {
  it("gera cabeçalhos em português, BOM e linhas escapadas", () => {
    const csv = buildTaskNotificationsCsv([{ id: "t1:HOJE:2026-08-20", taskId: "t1", title: "Conferir \"folha\"", bucket: "HOJE", dueDate: "2026-08-20" }]);
    expect(csv.startsWith("\uFEFF"),).toBe(true);
    expect(csv).toContain("Tarefa");
    expect(csv).toContain("Intervalo de prazo");
    expect(csv).toContain('"Conferir ""folha"""');
    expect(csv).toContain("Hoje");
  });

  it("gera nome de ficheiro estável com a empresa", () => {
    expect(taskNotificationsExportFilename(2)).toMatch(/^historico-notificacoes-2-\d{4}-\d{2}-\d{2}\.csv$/);
  });
});
