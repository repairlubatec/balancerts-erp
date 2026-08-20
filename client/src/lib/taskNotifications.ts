export type BulkTaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export function getBulkTaskStatusNotification(status: BulkTaskStatus, updatedCount: number) {
  const statusText = status === "COMPLETED" ? "Concluída" : status === "IN_PROGRESS" ? "Em curso" : status === "CANCELLED" ? "Cancelada" : "Pendente";
  return {
    title: "Tarefas actualizadas",
    description: `${updatedCount} tarefa(s) passaram para “${statusText}”.`,
    feedback: `${updatedCount} tarefa(s) actualizada(s) para ${statusText}. Cada alteração foi auditada.`,
    statusText,
  };
}
