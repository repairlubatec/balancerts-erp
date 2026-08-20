export function getSelectedTaskCount(selectedTaskIds: number[]) {
  return selectedTaskIds.length;
}

export function getVisibleTaskSelectionState(visibleTaskIds: number[], selectedTaskIds: number[]) {
  const selected = new Set(selectedTaskIds);
  const allSelected = visibleTaskIds.length > 0 && visibleTaskIds.every((taskId) => selected.has(taskId));
  const someSelected = visibleTaskIds.some((taskId) => selected.has(taskId));
  return { allSelected, someSelected };
}

export function toggleVisibleTaskSelection(visibleTaskIds: number[], selectedTaskIds: number[]) {
  return getVisibleTaskSelectionState(visibleTaskIds, selectedTaskIds).allSelected ? [] : [...visibleTaskIds];
}
