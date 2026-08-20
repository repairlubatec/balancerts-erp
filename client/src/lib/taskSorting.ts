export type TaskDueValue = Date | string | null | undefined;

export function compareTaskDueDates(leftDueDate: TaskDueValue, rightDueDate: TaskDueValue) {
  const left = leftDueDate ? new Date(leftDueDate).getTime() : Number.POSITIVE_INFINITY;
  const right = rightDueDate ? new Date(rightDueDate).getTime() : Number.POSITIVE_INFINITY;
  if (left === Number.POSITIVE_INFINITY && right === Number.POSITIVE_INFINITY) return 0;
  return left - right;
}
