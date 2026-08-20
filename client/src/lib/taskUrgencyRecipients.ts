export function taskUrgencyRecipientsKey(userId: number | string | undefined, companyId: number | undefined) {
  return `balancerts.taskUrgencyRecipients.v1:${userId ?? "anonimo"}:${companyId ?? "sem-empresa"}`;
}

export function readTaskUrgencyRecipients(storage: Pick<Storage, "getItem"> | undefined, key: string, fallback: number[] = []) {
  if (!storage) return fallback;
  try {
    const parsed = JSON.parse(storage.getItem(key) ?? "null");
    return Array.isArray(parsed) ? parsed.filter((value): value is number => Number.isInteger(value) && value > 0) : fallback;
  } catch {
    return fallback;
  }
}

export function writeTaskUrgencyRecipients(storage: Pick<Storage, "setItem"> | undefined, key: string, userIds: number[]) {
  storage?.setItem(key, JSON.stringify(Array.from(new Set(userIds)).filter((id) => Number.isInteger(id) && id > 0)));
}
