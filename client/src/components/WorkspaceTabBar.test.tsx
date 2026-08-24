// @vitest-environment jsdom

import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Building2, Calculator } from "lucide-react";
import { WorkspaceTabBar, type WorkspaceTab } from "./WorkspaceTabBar";

describe("WorkspaceTabBar", () => {
  afterEach(() => cleanup());

  const tabs: WorkspaceTab[] = [
    { path: "/", label: "Minhas Empresas", icon: Building2 },
    { path: "/contabilidade", label: "Contabilidade", icon: Calculator },
  ];

  it("selecciona um separador e expõe o contexto de teclado", () => {
    const onSelect = vi.fn();
    render(<WorkspaceTabBar tabs={tabs} activePath="/" onSelect={onSelect} onClose={vi.fn()} onNew={vi.fn()} />);

    expect(screen.getByText(/Janelas · 2 janelas/)).toBeTruthy();
    expect(screen.queryByText(/Windows ·/)).toBeNull();
    const accountingTab = screen.getByRole("tab", { name: /Contabilidade/ });
    expect(accountingTab?.getAttribute("title")).toContain("Ctrl+2");
    fireEvent.click(accountingTab!);
    expect(onSelect).toHaveBeenCalledWith("/contabilidade");
  });

  it("fecha separadores e abre o selector de módulos", () => {
    const onClose = vi.fn();
    const onNew = vi.fn();
    render(<WorkspaceTabBar tabs={tabs} activePath="/contabilidade" onSelect={vi.fn()} onClose={onClose} onNew={onNew} />);

    fireEvent.click(screen.getByRole("button", { name: "Fechar Minhas Empresas" }));
    fireEvent.click(screen.getByRole("button", { name: "Abrir módulo" }));
    expect(onClose).toHaveBeenCalledWith("/");
    expect(onNew).toHaveBeenCalledTimes(1);
  });
});
