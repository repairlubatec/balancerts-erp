import type { TaskUrgencyNotification } from "./taskUrgencyNotifications";

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function buildTaskNotificationsCsv(notifications: TaskUrgencyNotification[]) {
  const headers = ["Tarefa", "Intervalo de prazo", "Data limite", "Identificador"];
  const rows = notifications.map((notification) => [
    notification.title,
    notification.bucket === "HOJE" ? "Hoje" : "Amanhã",
    notification.dueDate ? new Date(`${notification.dueDate}T12:00:00`).toLocaleDateString("pt-PT") : "Sem data limite",
    notification.id,
  ]);
  return `\uFEFF${[headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
}

export function taskNotificationsExportFilename(companyId?: number) {
  const date = new Date().toISOString().slice(0, 10);
  return `historico-notificacoes-${companyId ?? "empresa"}-${date}.csv`;
}
