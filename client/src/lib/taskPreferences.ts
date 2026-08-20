import type { TaskDueValue } from "./taskSorting";

export type TaskPreferenceSort = { field: "name" | "priority" | "dueDate"; direction: "asc" | "desc" };
export type TaskPreferenceFilters = { search: string; priority: string; state: string; assignee: string; due: string };
export type TaskPreferences = { sort: TaskPreferenceSort; filters: TaskPreferenceFilters };

const DEFAULT_PREFERENCES: TaskPreferences = {
  sort: { field: "name", direction: "asc" },
  filters: { search: "", priority: "", state: "", assignee: "", due: "" },
};

export function taskPreferencesKey(userId: number | string | undefined, companyId: number | undefined) {
  return `balancerts.taskCenterPreferences.v1:${userId ?? "anonimo"}:${companyId ?? "sem-empresa"}`;
}

export function readTaskPreferences(storage: Pick<Storage, "getItem"> | undefined, key: string): TaskPreferences {
  if (!storage) return DEFAULT_PREFERENCES;
  try {
    const parsed = JSON.parse(storage.getItem(key) ?? "null") as Partial<TaskPreferences> | null;
    const sort = parsed?.sort;
    const filters = parsed?.filters;
    const validSort = sort?.field === "name" || sort?.field === "priority" || sort?.field === "dueDate" ? { field: sort.field, direction: sort.direction === "desc" ? "desc" : "asc" } as TaskPreferenceSort : DEFAULT_PREFERENCES.sort;
    return { sort: validSort, filters: { ...DEFAULT_PREFERENCES.filters, ...(filters ?? {}), search: typeof filters?.search === "string" ? filters.search : "", priority: typeof filters?.priority === "string" ? filters.priority : "", state: typeof filters?.state === "string" ? filters.state : "", assignee: typeof filters?.assignee === "string" ? filters.assignee : "", due: typeof filters?.due === "string" ? filters.due : "" } };
  } catch { return DEFAULT_PREFERENCES; }
}

export function writeTaskPreferences(storage: Pick<Storage, "setItem"> | undefined, key: string, preferences: TaskPreferences) {
  if (!storage) return;
  storage.setItem(key, JSON.stringify(preferences));
}

export function clearTaskPreferences(storage: Pick<Storage, "removeItem"> | undefined, key: string) {
  storage?.removeItem(key);
}

export type { TaskDueValue };
