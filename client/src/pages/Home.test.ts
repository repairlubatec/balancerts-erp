import { describe, expect, it } from "vitest";
import { getActionPresentation, getQuickActions, resolveNewAction } from "./Home";

describe("BALANCERTS command palette flows", () => {
  it.each([
    ["/facturacao?new=1", "1", "Criar novo documento", "Abrir formulário"],
    ["/tesouraria?new=reconcile", "reconcile", "Iniciar reconciliação bancária", "Seleccionar movimentos"],
    ["/fecho?new=checklist", "checklist", "Executar checklist de fecho", "Abrir checklist"],
  ])("resolves %s to the correct action and CTA", (search, action, label, cta) => {
    expect(resolveNewAction(search)).toEqual({ action, label });
    expect(getActionPresentation(search)).toMatchObject({ action, label, cta, feedback: null });
    expect(getActionPresentation(search, true)).toMatchObject({ action, label, cta, feedback: "Fluxo iniciado" });
  });

  it("does not activate an unknown action", () => {
    expect(resolveNewAction("/facturacao?new=unknown")).toEqual({ action: "unknown", label: null });
    expect(getActionPresentation("/facturacao?new=unknown")).toEqual({ action: "unknown", label: null, cta: null, feedback: null });
  });

  it("filters palette actions and preserves the selected destination route", () => {
    const results = getQuickActions("reconciliação");
    expect(results).toHaveLength(1);
    expect(results[0]?.[0]).toBe("/tesouraria?new=reconcile");
    expect(getQuickActions("checklist")[0]?.[0]).toBe("/fecho?new=checklist");
    expect(getQuickActions("documento")[0]?.[0]).toBe("/facturacao?new=1");
  });
});
