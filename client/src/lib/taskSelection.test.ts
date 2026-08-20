import { describe, expect, it } from "vitest";
import { getVisibleTaskSelectionState, toggleVisibleTaskSelection } from "./taskSelection";

describe("selecção de tarefas visíveis", () => {
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
