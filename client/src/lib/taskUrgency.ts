export type TaskUrgencyDueValue = Date | string | number | null | undefined;
export type TaskUrgencyPriority = "Baixa" | "Normal" | "Média" | "Alta" | "Urgente" | string;
export type TaskUrgencyState = "Pendente" | "Em curso" | "Concluída" | "Cancelada" | string;

export type TaskUrgencyTask = {
  dueDate?: TaskUrgencyDueValue;
  priority: TaskUrgencyPriority;
  state: TaskUrgencyState;
  title?: string;
};

export type TaskDueBucket = "ATRASADA" | "HOJE" | "AMANHA" | "FUTURA" | "SEM_PRAZO";

const priorityWeight: Record<string, number> = { Baixa: 1, Normal: 2, Média: 2, Alta: 3, Urgente: 4 };
const stateWeight: Record<string, number> = { "Em curso": 3, Pendente: 2, Preparação: 1, Concluída: 0, Cancelada: 0 };

export function getTaskDueBucket(dueDate: TaskUrgencyDueValue, todayInput = new Date()): TaskDueBucket {
  if (!dueDate) return "SEM_PRAZO";
  const due = new Date(dueDate).getTime();
  if (!Number.isFinite(due)) return "SEM_PRAZO";
  const today = new Date(todayInput);
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(23, 59, 59, 999);
  if (due < today.getTime()) return "ATRASADA";
  if (due <= today.getTime() + 24 * 60 * 60 * 1000 - 1) return "HOJE";
  if (due <= tomorrowEnd.getTime()) return "AMANHA";
  return "FUTURA";
}

export function getTaskOperationalUrgencyScore(task: TaskUrgencyTask, todayInput = new Date()) {
  if (task.state === "Concluída" || task.state === "Cancelada") return 0;
  const dueWeight: Record<TaskDueBucket, number> = { ATRASADA: 400, HOJE: 300, AMANHA: 220, FUTURA: 100, SEM_PRAZO: 0 };
  const bucket = getTaskDueBucket(task.dueDate, todayInput);
  return dueWeight[bucket] + (priorityWeight[task.priority] ?? 0) * 10 + (stateWeight[task.state] ?? 0);
}

export function compareTaskOperationalUrgency(left: TaskUrgencyTask, right: TaskUrgencyTask, todayInput = new Date()) {
  const scoreDifference = getTaskOperationalUrgencyScore(right, todayInput) - getTaskOperationalUrgencyScore(left, todayInput);
  if (scoreDifference !== 0) return scoreDifference;
  return (left.title ?? "").localeCompare(right.title ?? "", "pt-PT", { sensitivity: "base" });
}
