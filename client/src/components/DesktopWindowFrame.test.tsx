// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DesktopWindowFrame } from "./DesktopWindowFrame";

describe("DesktopWindowFrame", () => {
  it("dispara os controlos da janela activa", () => {
    const onMinimize = vi.fn();
    const onMaximize = vi.fn();
    const onClose = vi.fn();

    render(
      <DesktopWindowFrame
        title="Facturação"
        subtitle="Sessão operacional · Angola"
        onMinimize={onMinimize}
        onMaximize={onMaximize}
        onClose={onClose}
      >
        <div>conteúdo operacional</div>
      </DesktopWindowFrame>,
    );

    expect(screen.getByText("conteúdo operacional")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Minimizar Facturação" }));
    fireEvent.click(screen.getByRole("button", { name: "Maximizar Facturação" }));
    fireEvent.click(screen.getByRole("button", { name: "Fechar Facturação" }));

    expect(onMinimize).toHaveBeenCalledOnce();
    expect(onMaximize).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("apresenta uma janela minimizada restaurável", () => {
    const onMinimize = vi.fn();
    render(
      <DesktopWindowFrame title="Contabilidade" minimized onMinimize={onMinimize}>
        <div>não deve aparecer</div>
      </DesktopWindowFrame>,
    );

    expect(screen.queryByText("não deve aparecer")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Restaurar Contabilidade" }));
    expect(onMinimize).toHaveBeenCalledOnce();
  });
});
