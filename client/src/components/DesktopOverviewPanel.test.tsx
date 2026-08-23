// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DesktopOverviewPanel } from "./DesktopOverviewPanel";

const baseProps = {
  companies: [],
  activities: [],
  actions: [],
  query: "",
  onQueryChange: vi.fn(),
  statusFilter: "TODOS" as const,
  onStatusFilterChange: vi.fn(),
  onOpenCompanies: vi.fn(),
  onOpenCompany: vi.fn(),
  onOpenAudit: vi.fn(),
  onOpenAction: vi.fn(),
  onOpenNewCompany: vi.fn(),
  volumeFacturado: "—",
  aReceber: "—",
  reconciliation: "—",
  documentosPendentes: 0,
  obrigacoesPendentes: 0,
  prontidaoFiscal: "—",
  companiesLoading: false,
  paletteOpen: false,
  paletteQuery: "",
  onPaletteQueryChange: vi.fn(),
  onClosePalette: vi.fn(),
};

afterEach(() => cleanup());

describe("filtro de alertas do dashboard principal", () => {
  it("altera os alertas visíveis para o estado seleccionado", () => {
    function Harness() {
      const [alertFilter, setAlertFilter] = React.useState<"ALL" | "OPEN" | "REVIEWED" | "RESOLVED">("ALL");
      return <DesktopOverviewPanel {...baseProps} alerts={[{ id: 1, title: "Alerta em aberto", meta: "Conta #1", status: "OPEN", risk: "HIGH" }, { id: 2, title: "Alerta resolvido", meta: "Fonte #2", status: "RESOLVED", risk: "CRITICAL" }]} alertFilter={alertFilter} onAlertFilterChange={setAlertFilter} onOpenAlert={vi.fn()} />;
    }
    render(<Harness />);
    expect(screen.getByText("Alerta em aberto")).toBeTruthy();
    expect(screen.getByText("Alerta resolvido")).toBeTruthy();
    const resolvedIndicator = screen.getByLabelText("Alerta resolvido");
    expect(resolvedIndicator.querySelector("svg")).toBeTruthy();
    expect(resolvedIndicator.parentElement?.className).toContain("bg-emerald-50/70");
    fireEvent.change(screen.getByLabelText("Filtrar alertas por estado"), { target: { value: "RESOLVED" } });
    expect(screen.getByText("Alerta resolvido")).toBeTruthy();
    expect(screen.queryByText("Alerta em aberto")).toBeNull();
  });

  it("encaminha o alerta seleccionado para o detalhe de auditoria", () => {
    const onOpenAlert = vi.fn();
    render(<DesktopOverviewPanel {...baseProps} alerts={[{ id: 42, title: "Alerta para abrir", meta: "Regra #42", status: "REVIEWED", risk: "HIGH" }]} alertFilter="ALL" onAlertFilterChange={vi.fn()} onOpenAlert={onOpenAlert} />);
    fireEvent.click(screen.getByRole("button", { name: "Ver detalhe" }));
    expect(onOpenAlert).toHaveBeenCalledWith(42);
  });
});
