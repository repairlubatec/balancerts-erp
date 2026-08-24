// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PgcaV2StagingPanel } from "./PgcaV2StagingPanel";
import { cleanup } from "@testing-library/react";

afterEach(() => cleanup());

describe("PgcaV2StagingPanel", () => {
  it("apresenta o resumo do preflight e mantém a versão apenas em revisão", () => {
    render(<PgcaV2StagingPanel />);

    expect(screen.getByText("Nova versão PGCA — revisão controlada")).toBeTruthy();
    expect(screen.getByText("714")).toBeTruthy();
    expect(screen.getByText("5")).toBeTruthy();
    expect(screen.getByText("86")).toBeTruthy();
    expect(screen.getByText("Importação normativa e activação bloqueadas")).toBeTruthy();
    expect(screen.getByText(/18\.1, 18\.2, 18\.3, 34\.5, 34\.6/)).toBeTruthy();
    expect(screen.getByText(/Estado de incorporação: STAGING_ONLY_NOT_ACTIVATED/)).toBeTruthy();
  });

  it("permite aprovar apenas a revisão documental das extensões reservadas", () => {
    render(<PgcaV2StagingPanel />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Seleccionar extensão EXT-001" }));
    const button = screen.getByRole("button", { name: "Aprovar revisão em lote" });

    fireEvent.click(button);

    expect(screen.getByRole("button", { name: "Revisão aprovada" })).toBeTruthy();
    expect(screen.getByText(/As extensões continuam sem designação confirmada/)).toBeTruthy();
  });

  it("filtra os códigos repetidos pela pesquisa sem remover o bloqueio normativo", () => {
    render(<PgcaV2StagingPanel />);
    fireEvent.change(screen.getByRole("textbox", { name: "Pesquisar códigos repetidos" }), { target: { value: "34" } });

    expect(screen.getByText("34.5")).toBeTruthy();
    expect(screen.getByText("34.6")).toBeTruthy();
    expect(screen.queryByText("18.1")).toBeNull();
    expect(screen.getByText("Importação normativa e activação bloqueadas")).toBeTruthy();
  });

  it("explica os grupos de pendências externas com o total correcto", () => {
    render(<PgcaV2StagingPanel />);

    expect(screen.getByText("27 em espera")).toBeTruthy();
    expect(screen.getByLabelText("Restauro isolado (9)")).toBeTruthy();
    expect(screen.getByLabelText("Windows e instaladores (4)")).toBeTruthy();
    expect(screen.getByLabelText("Homologação AGT (3)")).toBeTruthy();
    expect(screen.getByLabelText("Aceitação Repair Lubatec (5)")).toBeTruthy();
  });
});
