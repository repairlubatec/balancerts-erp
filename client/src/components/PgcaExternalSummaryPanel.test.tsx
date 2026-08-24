// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PgcaExternalSummaryPanel } from "./PgcaExternalSummaryPanel";

describe("PgcaExternalSummaryPanel", () => {
  it("mostra o total de 27 pendências e a distribuição por motivo", () => {
    render(<PgcaExternalSummaryPanel />);
    expect(screen.getByTestId("pgca-external-summary")).toBeTruthy();
    expect(screen.getByText("27")).toBeTruthy();
    expect(screen.getByLabelText(/Restauro isolado: 9 pendências/)).toBeTruthy();
    expect(screen.getByLabelText(/Aceitação Repair Lubatec: 5 pendências/)).toBeTruthy();
  });
});
