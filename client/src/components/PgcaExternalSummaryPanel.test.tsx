// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PgcaExternalSummaryPanel } from "./PgcaExternalSummaryPanel";

describe("PgcaExternalSummaryPanel", () => {
  afterEach(() => cleanup());
  it("permite seleccionar um motivo para filtrar a tabela", () => {
    const onSelectBlocker = vi.fn();
    render(<PgcaExternalSummaryPanel onSelectBlocker={onSelectBlocker} />);
    fireEvent.click(screen.getByRole("button", { name: /Restauro isolado: 9 pendências/ }));
    expect(onSelectBlocker).toHaveBeenCalledWith("Restauro isolado");
  });

  it("mostra o total de 27 pendências e a distribuição por motivo", () => {
    render(<PgcaExternalSummaryPanel />);
    expect(screen.getByTestId("pgca-external-summary")).toBeTruthy();
    expect(screen.getByText("27")).toBeTruthy();
    expect(screen.getByLabelText(/Restauro isolado: 9 pendências/)).toBeTruthy();
    expect(screen.getByLabelText(/Aceitação Repair Lubatec: 5 pendências/)).toBeTruthy();
  });
});
