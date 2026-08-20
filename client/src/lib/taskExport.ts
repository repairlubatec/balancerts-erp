export type TaskExportItem = {
  title: string;
  description?: string | null;
  priority: string;
  state: string;
  origin: string;
  company: string;
  assigneeLabel?: string | null;
  dueDate?: Date | string | null;
};

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function buildTasksCsv(tasks: TaskExportItem[]) {
  const headers = ["Tarefa", "Descrição", "Prioridade", "Estado", "Origem", "Empresa", "Responsável", "Prazo"];
  const rows = tasks.map((task) => [
    task.title,
    task.description ?? "",
    task.priority,
    task.state,
    task.origin,
    task.company,
    task.assigneeLabel ?? "Sem responsável",
    task.dueDate ? new Date(task.dueDate).toLocaleDateString("pt-PT") : "Sem prazo",
  ]);
  return `\uFEFF${[headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
}

export function taskExportFilename(companyId?: number) {
  const date = new Date().toISOString().slice(0, 10);
  return `tarefas-filtradas-${companyId ?? "empresa"}-${date}.csv`;
}
