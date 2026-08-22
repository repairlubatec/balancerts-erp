// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { NormativeConfirmationDashboard } from "./NormativeConfirmationDashboard";

afterEach(() => cleanup());

describe("painel de confirmação normativa", () => {
  it("apresenta o resumo real do catálogo e mantém os movimentos bloqueados", () => {
    render(<NormativeConfirmationDashboard />);

    expect(screen.getByTestId("normative-stat-Contas no catálogo").textContent).toContain("760");
    expect(screen.getByTestId("normative-stat-Confirmadas").textContent).toContain("27");
    expect(screen.getByTestId("normative-stat-Pendentes").textContent).toContain("733");
    expect(screen.getByTestId("normative-stat-Movimentos activos").textContent).toContain("0");
    expect(screen.getByText("CONFIRMED_ONLY")).toBeTruthy();
    expect(screen.queryByText("Nenhuma conta corresponde aos filtros actuais.")).toBeNull();
  });

  it("filtra por pendentes e permite pesquisar uma conta sem alterar o estado normativo", () => {
    render(<NormativeConfirmationDashboard />);

    fireEvent.click(screen.getByRole("button", { name: "Filtrar por estado Pendentes" }));
    expect(screen.getAllByText("Aguarda confirmação humana").length).toBeGreaterThan(0);
    expect(screen.queryByText("Confirmada visualmente")).toBeNull();

    fireEvent.change(screen.getByPlaceholderText("Pesquisar código ou designação"), { target: { value: "cfsubscrição" } });
    const pendingAccount = screen.getByRole("button", { name: /3\.1\.3\.1/ });
    expect(pendingAccount).toBeTruthy();
    fireEvent.click(pendingAccount);
    expect(screen.getByText(/Não utilizar em posting automático/)).toBeTruthy();
  });

  it("aplica filtro por classe a partir do resumo de pendências", () => {
    render(<NormativeConfirmationDashboard />);

    const classFive = screen.getByTestId("normative-class-summary-5");
    fireEvent.click(classFive);
    expect(screen.getAllByText("Classe 5").length).toBeGreaterThan(0);
    expect(screen.getByText("CAPITAL E RESERVAS")).toBeTruthy();
  });
});
