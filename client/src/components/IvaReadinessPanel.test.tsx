// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IvaReadinessPanel } from "./IvaReadinessPanel";

afterEach(() => cleanup());

const baseReadiness = {
  ready: false,
  activeRules: 1,
  activeMappings: 0,
  confirmedSources: 3,
  missingChainSources: ["IVA-DP-180-19", "IVA-LAW-14-23"],
  activeByRegime: { GERAL: 1, SIMPLIFICADO: 0, EXCLUSAO: 0 },
  blockers: [
    "IVA_CADEIA_NORMATIVA_INCOMPLETA",
    "IVA_SEM_MAPEAMENTO_34_5_ACTIVE",
  ],
};

describe("painel de prontidão IVA", () => {
  it("mostra visualmente os diplomas em falta e o motivo do bloqueio", () => {
    render(<IvaReadinessPanel data={baseReadiness} />);

    expect(
      screen.getByRole("status", { name: "Prontidão IVA bloqueada" })
    ).toBeTruthy();
    expect(screen.getByTestId("iva-chain-IVA-DP-180-19").textContent).toContain(
      "Em falta"
    );
    expect(screen.getByTestId("iva-chain-IVA-LAW-14-23").textContent).toContain(
      "Em falta"
    );
    expect(screen.getByTestId("iva-chain-IVA-LAW-7-19").textContent).toContain(
      "Confirmado"
    );
    expect(screen.getByTestId("iva-chain-IVA-DP-180-19").className).toContain(
      "border-red-300"
    );
    expect(screen.getByTestId("iva-chain-IVA-LAW-7-19").className).toContain(
      "border-emerald-300"
    );
    expect(screen.getByTestId("iva-chain-summary").textContent).toContain(
      "Diplomas em falta: 2"
    );
    expect(screen.getByTestId("iva-chain-completion").textContent).toContain(
      "3/5 · 60%"
    );
    expect(screen.getByTestId("iva-chain-completion").className).toContain(
      "border-red-200"
    );
    expect(
      screen.getByText(/Falta confirmar um ou mais diplomas/)
    ).toBeTruthy();
  });

  it("alterna entre diplomas em falta, confirmados e todos", () => {
    render(<IvaReadinessPanel data={baseReadiness} />);
    const filter = screen.getByRole("combobox", {
      name: "Filtrar diplomas IVA",
    });

    fireEvent.click(filter);
    fireEvent.click(screen.getByRole("option", { name: "Em falta" }));

    expect(screen.getByText("Filtro: Em falta")).toBeTruthy();
    expect(screen.getByText("2/5 diplomas")).toBeTruthy();
    expect(screen.getByTestId("iva-chain-IVA-DP-180-19")).toBeTruthy();
    expect(screen.getByTestId("iva-chain-IVA-LAW-14-23")).toBeTruthy();
    expect(screen.queryByTestId("iva-chain-IVA-LAW-7-19")).toBeNull();

    fireEvent.click(
      screen.getByRole("combobox", {
        name: "Filtrar diplomas IVA",
      })
    );
    fireEvent.click(screen.getByRole("option", { name: "Confirmados" }));

    expect(screen.getByText("Filtro: Confirmados")).toBeTruthy();
    expect(screen.getByText("3/5 diplomas")).toBeTruthy();
    expect(screen.queryByTestId("iva-chain-IVA-DP-180-19")).toBeNull();
    expect(screen.getByTestId("iva-chain-IVA-LAW-7-19")).toBeTruthy();

    fireEvent.click(
      screen.getByRole("combobox", {
        name: "Filtrar diplomas IVA",
      })
    );
    fireEvent.click(screen.getByRole("option", { name: "Todos" }));

    expect(screen.getByText("Filtro: Todos")).toBeTruthy();
    expect(screen.getByText("5/5 diplomas")).toBeTruthy();
  });

  it("pesquisa rapidamente um diploma pelo nome", () => {
    render(<IvaReadinessPanel data={baseReadiness} />);
    fireEvent.change(
      screen.getByRole("textbox", { name: "Pesquisar diploma IVA" }),
      {
        target: { value: "Lei n.º 14/23" },
      }
    );

    expect(screen.getByText("Pesquisa: “Lei n.º 14/23”")).toBeTruthy();
    expect(screen.getByText("1/5 diplomas")).toBeTruthy();
    expect(screen.getByTestId("iva-chain-IVA-LAW-14-23")).toBeTruthy();
    expect(screen.queryByTestId("iva-chain-IVA-LAW-7-19")).toBeNull();
  });

  it("mostra histórico local com re-download e abertura", () => {
    const entry = {
      id: "csv-1",
      format: "CSV" as const,
      filename: "prontidao-iva-3.csv",
      mimeType: "text/csv;charset=utf-8",
      content: "csv",
      encoding: "text" as const,
      createdAt: Date.now(),
    };
    const onRedownloadExport = vi.fn();
    const onOpenExport = vi.fn();
    render(
      <IvaReadinessPanel
        data={baseReadiness}
        exportHistory={[entry]}
        onRedownloadExport={onRedownloadExport}
        onOpenExport={onOpenExport}
      />
    );

    expect(screen.getByTestId("iva-export-history")).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Descarregar novamente prontidao-iva-3.csv",
      })
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Abrir prontidao-iva-3.csv" })
    );

    expect(onRedownloadExport).toHaveBeenCalledWith(entry);
    expect(onOpenExport).toHaveBeenCalledWith(entry);
  });

  it("mostra a prontidão como pronta quando a cadeia está completa", () => {
    render(
      <IvaReadinessPanel
        data={{
          ...baseReadiness,
          ready: true,
          activeMappings: 1,
          confirmedSources: 5,
          missingChainSources: [],
          blockers: [],
        }}
      />
    );

    expect(
      screen.getByRole("status", { name: "Prontidão IVA pronta" })
    ).toBeTruthy();
    expect(screen.getByTestId("iva-chain-summary").textContent).toContain(
      "Os cinco diplomas estão identificados como confirmados."
    );
    expect(screen.getAllByText("Confirmado")).toHaveLength(5);
    expect(screen.getByTestId("iva-chain-completion").textContent).toContain(
      "5/5 · 100%"
    );
    expect(
      screen.getByRole("progressbar", {
        name: "Conclusão da cadeia normativa IVA",
      })
    ).toBeTruthy();
  });

  it("expõe exportação CSV e PDF quando recebe os handlers", () => {
    const onExportCsv = vi.fn();
    const onExportPdf = vi.fn();
    render(
      <IvaReadinessPanel
        data={{ ...baseReadiness }}
        onExportCsv={onExportCsv}
        onExportPdf={onExportPdf}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "CSV" }));
    fireEvent.click(screen.getByRole("button", { name: "PDF" }));

    expect(onExportCsv).toHaveBeenCalledTimes(1);
    expect(onExportPdf).toHaveBeenCalledTimes(1);
  });
});
