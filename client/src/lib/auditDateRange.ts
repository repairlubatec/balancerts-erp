export type AuditDateRange = { from?: Date; to?: Date; invalid: boolean; label: string };

export function buildAuditDateRange(from: string, to: string): AuditDateRange {
  const fromDate = from ? new Date(`${from}T00:00:00.000Z`) : undefined;
  const toDate = to ? new Date(`${to}T23:59:59.999Z`) : undefined;
  const invalid = Boolean((fromDate && Number.isNaN(fromDate.getTime())) || (toDate && Number.isNaN(toDate.getTime())) || (fromDate && toDate && fromDate > toDate));
  const label = from && to ? `${from} a ${to}` : from ? `desde ${from}` : to ? `até ${to}` : "todo o período";
  return { from: invalid ? undefined : fromDate, to: invalid ? undefined : toDate, invalid, label };
}
