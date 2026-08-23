// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IvaReadinessPanel } from "./IvaReadinessPanel";
import { ThemeProvider } from "@/contexts/ThemeContext";

function renderPanel(ui: React.ReactElement) {
  return render(<ThemeProvider switchable>{ui}</ThemeProvider>);
}

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
  sourceDates: {
    "IVA-LAW-7-19": new Date("2026-08-01T10:00:00Z"),
    "IVA-DP-180-19": new Date("2026-08-03T10:00:00Z"),
    "IVA-DE-134-19": new Date("2026-08-05T10:00:00Z"),
    "IVA-LAW-17-19": new Date("2026-08-07T10:00:00Z"),
    "IVA-LAW-14-23": new Date("2026-08-09T10:00:00Z"),
  },
};

describe("painel de prontidão IVA", () => {
  it("mostra visualmente os diplomas em falta e o motivo do bloqueio", () => {
    renderPanel(<IvaReadinessPanel data={baseReadiness} />);

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
    renderPanel(<IvaReadinessPanel data={baseReadiness} />);
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
    renderPanel(<IvaReadinessPanel data={baseReadiness} />);
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

  it("filtra por etiqueta temática e ordena alfabeticamente", () => {
    renderPanel(<IvaReadinessPanel data={baseReadiness} />);

    fireEvent.click(
      screen.getByRole("combobox", { name: "Filtrar área temática IVA" })
    );
    fireEvent.click(screen.getByRole("option", { name: "Consolidação" }));

    expect(screen.getByText("1/5 diplomas")).toBeTruthy();
    expect(screen.getByTestId("iva-chain-IVA-LAW-14-23")).toBeTruthy();
    expect(screen.queryByTestId("iva-chain-IVA-LAW-7-19")).toBeNull();

    fireEvent.click(
      screen.getByRole("combobox", { name: "Ordenar diplomas IVA" })
    );
    fireEvent.click(screen.getByRole("option", { name: "Ordem alfabética" }));
    expect(screen.getByTestId("iva-chain-IVA-LAW-14-23")).toBeTruthy();
  });

  it("filtra os diplomas por importância", () => {
    renderPanel(<IvaReadinessPanel data={baseReadiness} />);

    fireEvent.click(
      screen.getByRole("combobox", { name: "Filtrar importância IVA" })
    );
    fireEvent.click(screen.getByRole("option", { name: "Central" }));

    expect(screen.getByText("1/5 diplomas")).toBeTruthy();
    expect(screen.getByTestId("iva-chain-IVA-LAW-14-23")).toBeTruthy();
    expect(screen.queryByTestId("iva-chain-IVA-LAW-7-19")).toBeNull();
  });

  it("ordena diplomas por data real das fontes quando disponível", () => {
    renderPanel(<IvaReadinessPanel data={baseReadiness} />);
    fireEvent.click(
      screen.getByRole("combobox", { name: "Ordenar diplomas IVA" })
    );
    fireEvent.click(
      screen.getByRole("option", { name: "Data de carregamento" })
    );

    const cards = Array.from(
      document.querySelectorAll('[data-testid^="iva-chain-IVA-"]')
    ).map(element => element.getAttribute("data-testid"));
    expect(cards).toEqual([
      "iva-chain-IVA-LAW-14-23",
      "iva-chain-IVA-LAW-17-19",
      "iva-chain-IVA-DE-134-19",
      "iva-chain-IVA-DP-180-19",
      "iva-chain-IVA-LAW-7-19",
    ]);
  });

  it("mostra empty state quando ainda não existem exportações", () => {
    renderPanel(<IvaReadinessPanel data={baseReadiness} />);

    expect(screen.getByTestId("iva-export-history-empty")).toBeTruthy();
    expect(screen.getByText("Ainda não existem exportações")).toBeTruthy();
  });

  it("agrupa diplomas pela primeira etiqueta temática sem duplicar cartões", () => {
    renderPanel(<IvaReadinessPanel data={baseReadiness} />);

    expect(screen.getByTestId("iva-diploma-groups")).toBeTruthy();
    expect(screen.getByTestId("iva-diploma-group-Fundamento legal")).toBeTruthy();
    expect(screen.getByTestId("iva-diploma-group-Regulamentação")).toBeTruthy();
    expect(
      document.querySelectorAll('[data-testid^="iva-chain-IVA-"]')
    ).toHaveLength(5);
  });

  it("alterna o tema e actualiza o nome acessível do botão", () => {
    renderPanel(<IvaReadinessPanel data={baseReadiness} />);

    const toggle = screen.getByRole("button", { name: "Mudar para modo escuro" });
    fireEvent.click(toggle);

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(
      screen.getByRole("button", { name: "Mudar para modo claro" })
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Mudar para modo claro" }));
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("permite iniciar uma nova exportação no histórico vazio", () => {
    const onStartExport = vi.fn();
    renderPanel(
      <IvaReadinessPanel
        data={baseReadiness}
        onStartExport={onStartExport}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Nova exportação" }));
    expect(onStartExport).toHaveBeenCalledTimes(1);
  });

  it("ordena o histórico de exportações por tipo de ficheiro", () => {
    const entries = [
      {
        id: "pdf-1",
        format: "PDF" as const,
        filename: "prontidao-iva-3.pdf",
        mimeType: "application/pdf",
        content: "pdf",
        encoding: "base64" as const,
        createdAt: 200,
      },
      {
        id: "csv-1",
        format: "CSV" as const,
        filename: "prontidao-iva-3.csv",
        mimeType: "text/csv;charset=utf-8",
        content: "csv",
        encoding: "text" as const,
        createdAt: 100,
      },
    ];
    renderPanel(<IvaReadinessPanel data={baseReadiness} exportHistory={entries} />);

    fireEvent.click(
      screen.getByRole("combobox", {
        name: "Ordenar histórico de exportações IVA",
      })
    );
    fireEvent.click(screen.getByRole("option", { name: "Tipo de ficheiro" }));

    const filenames = Array.from(
      document.querySelectorAll('[data-testid="iva-export-history"] p.truncate')
    ).map(element => element.textContent);
    expect(filenames).toEqual(["prontidao-iva-3.csv", "prontidao-iva-3.pdf"]);
  });

  it("ordena o histórico de exportações por data mais recente", () => {
    const entries = [
      {
        id: "older",
        format: "CSV" as const,
        filename: "mais-antigo.csv",
        mimeType: "text/csv;charset=utf-8",
        content: "csv",
        encoding: "text" as const,
        createdAt: 100,
      },
      {
        id: "newer",
        format: "PDF" as const,
        filename: "mais-recente.pdf",
        mimeType: "application/pdf",
        content: "pdf",
        encoding: "base64" as const,
        createdAt: 200,
      },
    ];
    renderPanel(<IvaReadinessPanel data={baseReadiness} exportHistory={entries} />);

    const filenames = Array.from(
      document.querySelectorAll('[data-testid="iva-export-history"] p.truncate')
    ).map(element => element.textContent);
    expect(filenames).toEqual(["mais-recente.pdf", "mais-antigo.csv"]);

    fireEvent.click(
      screen.getByRole("combobox", {
        name: "Ordenar histórico de exportações IVA",
      })
    );
    fireEvent.click(screen.getByRole("option", { name: "Mais antigas" }));
    const ascendingFilenames = Array.from(
      document.querySelectorAll('[data-testid="iva-export-history"] p.truncate')
    ).map(element => element.textContent);
    expect(ascendingFilenames).toEqual(["mais-antigo.csv", "mais-recente.pdf"]);
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
    renderPanel(
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
    renderPanel(
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
    renderPanel(
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
