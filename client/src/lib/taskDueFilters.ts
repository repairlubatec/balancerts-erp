export type DueFilterDate = Date | string | null | undefined;

export function isDueTodayOrTomorrow(dueDate: DueFilterDate, today: Date, tomorrowEnd: Date, state: string) {
  if (!dueDate || ["Concluída", "Cancelada"].includes(state)) return false;
  const dueTime = new Date(dueDate).getTime();
  return dueTime >= today.getTime() && dueTime <= tomorrowEnd.getTime();
}
