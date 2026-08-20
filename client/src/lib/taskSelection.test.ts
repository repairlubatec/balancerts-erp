import { describe, expect, it } from "vitest";
import { getSelectedTaskCount, getVisibleTaskSelectionState, toggleVisibleTaskSelection } from "./taskSelection";

describe("selecção de tarefas visíveis", () => {
  it("mantém a contagem exacta das tarefas seleccionadas", () => {
    expect(getSelectedTaskCount([])).toBe(0);
    expect(getSelectedTaskCount([7, 8])).toBe(2);
    expect(getSelectedTaskCount([7, 8, 9])).toBe(3);
  });
  it("identifica selecção total, parcial e vazia", () => {
    expect(getVisibleTaskSelectionState([1, 2, 3], [1, 2, 3])).toEqual({ allSelected: true, someSelected: true });
    expect(getVisibleTaskSelectionState([1, 2, 3], [2])).toEqual({ allSelected: false, someSelected: true });
    expect(getVisibleTaskSelectionState([1, 2, 3], [])).toEqual({ allSelected: false, someSelected: false });
  });

  it("selecciona as visíveis ou limpa-as quando já estão todas seleccionadas", () => {
    expect(toggleVisibleTaskSelection([4, 5], [])).toEqual([4, 5]);
    expect(toggleVisibleTaskSelection([4, 5], [4, 5])).toEqual([]);
    expect(toggleVisibleTaskSelection([], [9])).toEqual([]);
  });
});
