export type AuditMetricEvent = { action: string; actorUserId: number; actor?: { name?: string | null; email?: string | null } | null };
export type AuditMetricRow = { key: string; label: string; count: number; percentage: number; rank: number };

export function aggregateAuditMetrics(events: AuditMetricEvent[], labels: Record<string, string> = {}) {
  const actions = new Map<string, number>();
  const users = new Map<string, { count: number; label: string }>();
  for (const event of events) {
    actions.set(event.action, (actions.get(event.action) ?? 0) + 1);
    const userKey = String(event.actorUserId);
    const userLabel = event.actor?.name || event.actor?.email || `Utilizador #${event.actorUserId}`;
    const previous = users.get(userKey);
    users.set(userKey, { count: (previous?.count ?? 0) + 1, label: previous?.label ?? userLabel });
  }
  const actionRows = Array.from(actions, ([key, count]) => ({ key, label: labels[key] ?? key, count })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "pt-PT")).slice(0, 5).map((row, index) => ({ ...row, percentage: events.length ? (row.count / events.length) * 100 : 0, rank: index + 1 }));
  const userRows = Array.from(users, ([key, value]) => ({ key, label: value.label, count: value.count })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "pt-PT")).slice(0, 5).map((row, index) => ({ ...row, percentage: events.length ? (row.count / events.length) * 100 : 0, rank: index + 1 }));
  return { actionRows, userRows, sampleSize: events.length };
}
