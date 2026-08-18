import { describe, expect, it } from "vitest";
import { getActionPresentation, getQuickActions, resolveActiveCompanyId, resolveNewAction } from "@/lib/homeActions";
import { getAccountTraceRoutes, getDocumentTraceRoutes, getReportTraceRoutes } from "@/lib/traceability";

describe("BALANCERTS command palette flows", () => {
  it.each([
    ["/facturacao?new=1", "1", "Criar novo documento", "Abrir formulário"],
    ["/fecho?new=checklist", "checklist", "Executar checklist de fecho", "Abrir checklist"],
  ])("resolves %s to the correct action and CTA", (search, action, label, cta) => {
    expect(resolveNewAction(search)).toEqual({ action, label });
    expect(getActionPresentation(search)).toMatchObject({ action, label, cta, feedback: null });
    expect(getActionPresentation(search, true)).toMatchObject({ action, label, cta, feedback: "Fluxo iniciado" });
  });

  it("prefers Repair Lubatec over a stale disposable tenant but respects manual selection", () => {
    const rows = [
      { id: 30001, name: "BALANCERTS Test Tenant - Disposable", nif: "999999990" },
      { id: 1, name: "Repair Lubatec", nif: "5001121871" },
    ];
    expect(resolveActiveCompanyId(rows, 30001, false)).toBe(1);
    expect(resolveActiveCompanyId(rows, 30001, true)).toBe(30001);
  });

  it("does not activate an unknown action", () => {
    expect(resolveNewAction("/facturacao?new=unknown")).toEqual({ action: "unknown", label: null });
    expect(getActionPresentation("/facturacao?new=unknown")).toEqual({ action: "unknown", label: null, cta: null, feedback: null });
  });

  it("resolves report trace routes with the selected record", () => {
    expect(getReportTraceRoutes("Demonstração de Resultados")).toEqual({
      account: "/contabilidade?focus=NC%202026%2F00017",
      journal: "/contabilidade?entry=NC%202026%2F00017",
      document: "/documentos?focus=Demonstra%C3%A7%C3%A3o%20de%20Resultados",
      audit: "/auditoria?focus=Demonstra%C3%A7%C3%A3o%20de%20Resultados",
    });
  });

  it("resolves document trace routes to report, account, journal and audit", () => {
    expect(getDocumentTraceRoutes("FT 2026/00482")).toEqual({
      report: "/relatorios?focus=Balancete%20anal%C3%ADtico",
      account: "/contabilidade?focus=FT%202026%2F00482",
      journal: "/contabilidade?entry=FT%202026%2F00482",
      audit: "/auditoria?focus=FT%202026%2F00482",
    });
  });

  it("resolves account trace routes back to reports and source records", () => {
    expect(getAccountTraceRoutes("FT 2026/00482")).toEqual({
      report: "/relatorios?focus=Balancete%20anal%C3%ADtico",
      journal: "/contabilidade?entry=FT%202026%2F00482",
      document: "/documentos?focus=FT%202026%2F00482",
      audit: "/auditoria?focus=FT%202026%2F00482",
    });
  });

  it("filters palette actions and preserves the selected destination route", () => {
    const results = getQuickActions("reconciliação");
    expect(results).toHaveLength(0);
    expect(getQuickActions("checklist")[0]?.[0]).toBe("/fecho?new=checklist");
    expect(getQuickActions("documento")[0]?.[0]).toBe("/facturacao?new=1");
  });
});
