import * as XLSX from "xlsx";
import type { TaskExportItem } from "./taskExport";

export function buildTasksXlsx(tasks: TaskExportItem[]) {
  const rows = tasks.map((task) => ({
    Tarefa: task.title,
    Descrição: task.description ?? "",
    Prioridade: task.priority,
    Estado: task.state,
    Origem: task.origin,
    Empresa: task.company,
    Responsável: task.assigneeLabel ?? "Sem responsável",
    Prazo: task.dueDate ? new Date(task.dueDate).toLocaleDateString("pt-PT") : "Sem prazo",
  }));
  const sheet = XLSX.utils.json_to_sheet(rows, { header: ["Tarefa", "Descrição", "Prioridade", "Estado", "Origem", "Empresa", "Responsável", "Prazo"] });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Tarefas");
  return XLSX.write(workbook, { bookType: "xlsx", type: "array" });
}

export function taskExcelFilename(companyId?: number) {
  const date = new Date().toISOString().slice(0, 10);
  return `tarefas-filtradas-${companyId ?? "empresa"}-${date}.xlsx`;
}
