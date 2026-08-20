// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => cleanup());
import { DesktopConfirmDialog } from "./DesktopConfirmDialog";

describe("DesktopConfirmDialog", () => {
  it("não renderiza quando está fechado", () => {
    render(<DesktopConfirmDialog open={false} title="Alterar estado" subtitle="Centro de Tarefas" description="Confirme a operação." onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("apresenta a descrição e encaminha cancelar e confirmar", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<DesktopConfirmDialog open title="Alterar estado em massa" subtitle="Centro de Tarefas" description="Vai alterar 3 tarefas para Concluída." onConfirm={onConfirm} onCancel={onCancel} confirmLabel="Aplicar alteração" />);
    expect(screen.getByRole("dialog").getAttribute("aria-modal")).toBe("true");
    expect(screen.getByText("Vai alterar 3 tarefas para Concluída.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    fireEvent.click(screen.getByRole("button", { name: "Aplicar alteração" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("bloqueia os controlos enquanto processa", () => {
    render(<DesktopConfirmDialog open title="Alterar estado" subtitle="Centro de Tarefas" description="A processar." onConfirm={vi.fn()} onCancel={vi.fn()} pending />);
    expect((screen.getByRole("button", { name: "Cancelar" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "A actualizar…" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
