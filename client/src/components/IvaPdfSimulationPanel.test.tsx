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

let restorePreviewUrl: (() => void) | undefined;

afterEach(() => {
  cleanup();
  restorePreviewUrl?.();
  restorePreviewUrl = undefined;
  vi.unstubAllGlobals();
});

describe("simulação de envio de PDF IVA", () => {
  it("mantém a simulação bloqueada até existir um PDF seleccionado", () => {
    render(<IvaPdfSimulationPanel />);

    const button = screen.getByRole("button", { name: "Simular envio" });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/não é enviado para a API/)).toBeTruthy();
  });

  it("selecciona um PDF através de arrastar e largar", () => {
    render(<IvaPdfSimulationPanel />);
    const file = new File(["pdf de teste"], "arrastado.pdf", {
      type: "application/pdf",
      lastModified: 999,
    });
    const dropzone = screen.getByRole("group", {
      name: "Zona de arrastar e largar PDF",
    });

    fireEvent.dragEnter(dropzone);
    expect(
      screen.getByText("Largue o PDF aqui para o seleccionar")
    ).toBeTruthy();
    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });

    expect(screen.getByText("arrastado.pdf")).toBeTruthy();
    expect(
      (
        screen.getByRole("button", {
          name: "Simular envio",
        }) as HTMLButtonElement
      ).disabled
    ).toBe(false);
  });

  it("rejeita ficheiros que não sejam PDF no arrastar e largar", () => {
    render(<IvaPdfSimulationPanel />);
    const file = new File(["texto"], "notas.txt", { type: "text/plain" });
    const dropzone = screen.getByRole("group", {
      name: "Zona de arrastar e largar PDF",
    });

    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });

    expect(screen.queryByText("notas.txt")).toBeNull();
    expect(screen.getByRole("button", { name: "Simular envio" })).toBeTruthy();
  });

  it("mostra a pré-visualização local e remove-a ao limpar", () => {
    const createObjectURL = vi.fn(() => "blob:iva-pdf-preview");
    const revokeObjectURL = vi.fn();
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });
    restorePreviewUrl = () => {
      if (originalCreateObjectURL) {
        Object.defineProperty(URL, "createObjectURL", {
          configurable: true,
          value: originalCreateObjectURL,
        });
      } else {
        delete (URL as unknown as { createObjectURL?: unknown })
          .createObjectURL;
      }
      if (originalRevokeObjectURL) {
        Object.defineProperty(URL, "revokeObjectURL", {
          configurable: true,
          value: originalRevokeObjectURL,
        });
      } else {
        delete (URL as unknown as { revokeObjectURL?: unknown })
          .revokeObjectURL;
      }
    };

    render(<IvaPdfSimulationPanel />);
    const file = new File(["pdf de teste"], "preview.pdf", {
      type: "application/pdf",
    });

    fireEvent.change(screen.getByLabelText("PDF para simulação"), {
      target: { files: [file] },
    });

    const preview = screen.getByTitle("Pré-visualização do PDF simulado");
    expect(preview.getAttribute("data")).toBe("blob:iva-pdf-preview");
    expect(createObjectURL).toHaveBeenCalledWith(file);

    fireEvent.click(screen.getByRole("button", { name: "Limpar e repor" }));

    expect(screen.queryByTestId("iva-pdf-preview")).toBeNull();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:iva-pdf-preview");
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
