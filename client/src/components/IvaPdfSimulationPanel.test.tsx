// @vitest-environment jsdom
import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
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

  it("mostra progresso e bloqueia nova simulação durante o processamento", async () => {
    render(<IvaPdfSimulationPanel />);
    const file = new File(["pdf de teste"], "progresso.pdf", {
      type: "application/pdf",
      lastModified: 456,
    });

    fireEvent.change(screen.getByLabelText("PDF para simulação"), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simular envio" }));

    expect(
      screen.getByRole("progressbar", { name: "Progresso da simulação" })
    ).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: "A simular…" }) as HTMLButtonElement)
        .disabled
    ).toBe(true);
    await waitFor(
      () => expect(screen.getByText("Simulação concluída")).toBeTruthy(),
      {
        timeout: 1200,
      }
    );
  });

  it("simula o percurso local sem criar confirmação normativa", async () => {
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

    await waitFor(
      () => expect(screen.getByText("Simulação concluída")).toBeTruthy(),
      {
        timeout: 1200,
      }
    );
    expect(
      screen.getByText(/O fluxo de selecção e submissão visual foi concluído/)
    ).toBeTruthy();
    expect(screen.getByText(/PDF não é enviado para a API/)).toBeTruthy();
    expect(screen.getByText(/não substitui a evidência primária/)).toBeTruthy();
  });

  it("limpa o upload simulado e solicita a reposição da prontidão", async () => {
    const onResetReadiness = vi.fn();
    render(<IvaPdfSimulationPanel onResetReadiness={onResetReadiness} />);
    const file = new File(["pdf de teste"], "limpar.pdf", {
      type: "application/pdf",
      lastModified: 789,
    });

    fireEvent.change(screen.getByLabelText("PDF para simulação"), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simular envio" }));
    await waitFor(
      () => expect(screen.getByText("Simulação concluída")).toBeTruthy(),
      {
        timeout: 1200,
      }
    );

    fireEvent.click(screen.getByRole("button", { name: "Limpar e repor" }));

    expect(onResetReadiness).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("limpar.pdf")).toBeNull();
    expect(
      (
        screen.getByRole("button", {
          name: "Simular envio",
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true);
  });
});
