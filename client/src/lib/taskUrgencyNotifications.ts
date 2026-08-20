import { getTaskDueBucket, type TaskUrgencyTask } from "./taskUrgency";

export type TaskUrgencyNotification = {
  id: string;
  taskId: string;
  title: string;
  bucket: "HOJE" | "AMANHA";
  dueDate: string;
};

export function taskUrgencyNotificationsKey(userId: number | string | undefined, companyId: number | undefined) {
  return `balancerts.taskUrgencyNotifications.v1:${userId ?? "anonimo"}:${companyId ?? "sem-empresa"}`;
}

export function taskUrgencyNotificationId(task: TaskUrgencyTask & { id: string }, bucket: "HOJE" | "AMANHA") {
  const dueDate = task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "sem-data";
  return `${task.id}:${bucket}:${dueDate}`;
}

export function readTaskUrgencyNotificationLedger(storage: Pick<Storage, "getItem"> | undefined, key: string): string[] {
  if (!storage) return [];
  try {
    const parsed = JSON.parse(storage.getItem(key) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return [];
  }
}

export function collectNewTaskUrgencyNotifications(tasks: Array<TaskUrgencyTask & { id: string; title: string }>, ledger: string[], today = new Date()) {
  const known = new Set(ledger);
  const notifications: TaskUrgencyNotification[] = [];
  for (const task of tasks) {
    if (["Concluída", "Cancelada"].includes(task.state)) continue;
    const bucket = getTaskDueBucket(task.dueDate, today);
    if (bucket !== "HOJE" && bucket !== "AMANHA") continue;
    const id = taskUrgencyNotificationId(task, bucket);
    if (known.has(id)) continue;
    known.add(id);
    notifications.push({ id, taskId: task.id, title: task.title, bucket, dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "" });
  }
  return { notifications, ledger: Array.from(known).slice(-500) };
}

export function writeTaskUrgencyNotificationLedger(storage: Pick<Storage, "setItem"> | undefined, key: string, ledger: string[]) {
  storage?.setItem(key, JSON.stringify(ledger));
}
