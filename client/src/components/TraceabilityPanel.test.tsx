// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TraceabilityPanel } from "./TraceabilityPanel";

describe("TraceabilityPanel", () => {
  afterEach(() => cleanup());
  it("navigates to the selected journal entry from a report", () => {
    const onNavigate = vi.fn();
    render(<TraceabilityPanel mode="report" selected="FT 2026/00482" onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole("button", { name: "Lançamento" }));
    expect(onNavigate).toHaveBeenCalledWith("/contabilidade?entry=FT%202026%2F00482");
  });

  it("navigates from a document to its journal entry and report", () => {
    const onNavigate = vi.fn();
    render(<TraceabilityPanel mode="document" selected="FT 2026/00482" onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole("button", { name: "Lançamento" }));
    expect(onNavigate).toHaveBeenCalledWith("/contabilidade?entry=FT%202026%2F00482");
    fireEvent.click(screen.getByRole("button", { name: "Relatório" }));
    expect(onNavigate).toHaveBeenCalledWith("/relatorios?focus=Balancete%20anal%C3%ADtico");
  });

  it("navigates back to the report from an account context", () => {
    const onNavigate = vi.fn();
    render(<TraceabilityPanel mode="account" selected="FT 2026/00482" onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole("button", { name: "Relatório" }));
    expect(onNavigate).toHaveBeenCalledWith("/relatorios?focus=Balancete%20anal%C3%ADtico");
  });
});
