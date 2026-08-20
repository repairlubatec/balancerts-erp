export type BulkTaskPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type BulkTaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export function getBulkTaskPriorityLabel(priority: BulkTaskPriority) {
  return priority === "URGENT" ? "Urgente" : priority === "HIGH" ? "Alta" : priority === "NORMAL" ? "Média" : "Baixa";
}

export function getBulkTaskStatusLabel(status: BulkTaskStatus) {
  return status === "COMPLETED" ? "Concluída" : status === "IN_PROGRESS" ? "Em curso" : status === "CANCELLED" ? "Cancelada" : "Pendente";
}

export function canApplyBulkTaskChange(taskIds: number[], maximum = 100) {
  return taskIds.length > 0 && taskIds.length <= maximum;
}

export function describeBulkTaskChange(kind: "priority" | "status", count: number, label: string) {
  return `Vai alterar ${kind === "priority" ? "a prioridade" : "o estado"} de ${count} tarefa(s) seleccionada(s) para “${label}”.`;
}

export function describeBulkTaskUndo(count: number, kind: "priority" | "status") {
  return `${count} ${kind === "priority" ? "prioridade(s)" : "estado(s)"} foram repostos ao valor anterior.`;
}
