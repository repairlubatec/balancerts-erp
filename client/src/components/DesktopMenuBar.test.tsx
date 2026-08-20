// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DesktopMenuBar } from "./DesktopMenuBar";

describe("DesktopMenuBar", () => {
  it("abre cada menu e executa um comando real", () => {
    const onCommand = vi.fn();
    render(<DesktopMenuBar activeModule="Minhas Empresas" onCommand={onCommand} />);

    fireEvent.click(screen.getByRole("button", { name: /Ficheiro/i }));
    expect(screen.getByRole("menu", { name: "Ficheiro" })).toBeTruthy();
    fireEvent.click(screen.getByRole("menuitem", { name: "Nova empresa" }));
    expect(onCommand).toHaveBeenCalledWith("new-company");
    expect(screen.queryByRole("menu", { name: "Ficheiro" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Operações/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Tesouraria" }));
    expect(onCommand).toHaveBeenCalledWith("treasury");
  });

  it("fecha o menu com Escape e mantém a barra acessível", () => {
    const onCommand = vi.fn();
    render(<DesktopMenuBar onCommand={onCommand} />);

    const janelaButton = screen.getAllByRole("button").find((button) => button.textContent?.trim() === "Janela");
    expect(janelaButton).toBeTruthy();
    fireEvent.click(janelaButton!);
    expect(screen.getByRole("menu", { name: "Janela" })).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu", { name: "Janela" })).toBeNull();

  });
});
