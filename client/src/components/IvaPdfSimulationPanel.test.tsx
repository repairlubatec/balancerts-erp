// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IvaPdfSimulationPanel } from "./IvaPdfSimulationPanel";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

afterEach(() => cleanup());

describe("simulação de envio de PDF IVA", () => {
  it("mantém a simulação bloqueada até existir um PDF seleccionado", () => {
    render(<IvaPdfSimulationPanel />);

    const button = screen.getByRole("button", { name: "Simular envio" });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/não é enviado para a API/)).toBeTruthy();
  });

  it("simula o percurso local sem criar confirmação normativa", () => {
    render(<IvaPdfSimulationPanel />);
    const file = new File(["pdf de teste"], "lei-iva-teste.pdf", {
      type: "application/pdf",
      lastModified: 123,
    });

    fireEvent.change(screen.getByLabelText("PDF para simulação"), {
      target: { files: [file] },
    });
    const button = screen.getByRole("button", { name: "Simular envio" });
    expect((button as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(button);

    expect(screen.getByText("Simulação concluída")).toBeTruthy();
    expect(
      screen.getByText(/O fluxo de selecção e submissão visual foi concluído/)
    ).toBeTruthy();
    expect(screen.getByText(/PDF não é enviado para a API/)).toBeTruthy();
    expect(screen.getByText(/não substitui a evidência primária/)).toBeTruthy();
  });
});
