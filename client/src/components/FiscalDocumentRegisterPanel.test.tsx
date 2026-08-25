// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { FiscalDocumentRegisterPanel } from "./FiscalDocumentRegisterPanel";

afterEach(() => cleanup());

describe("FiscalDocumentRegisterPanel", () => {
  it("shows a truthful empty state without inventing fiscal documents", () => {
    render(<FiscalDocumentRegisterPanel fiscalRegister={{ entries: [], reconciled: true, totals: { netAmount: 0, taxAmount: 0, totalAmount: 0 } }} />);
    expect(screen.getByText("Não existem documentos fiscais persistidos para a empresa.")).toBeTruthy();
    expect(screen.getByText("Reconciliado")).toBeTruthy();
  });

  it("shows persisted fiscal provenance and reconciliation state", () => {
    render(
      <FiscalDocumentRegisterPanel
        fiscalRegister={{
          entries: [
            {
              documentId: 10,
              documentNumber: "FT/2026/0010",
              issueDate: "2026-08-25T00:00:00.000Z",
              status: "ISSUED",
              ivaRegime: "GERAL",
              netAmount: 100,
              taxAmount: 14,
              totalAmount: 114,
              normativeRuleIds: [7],
              normativeRuleVersions: ["2026-08-25"],
              legalReferences: ["Lei n.º 14/23, artigo 19.º"],
            },
          ],
          reconciled: false,
          totals: { netAmount: 100, taxAmount: 14, totalAmount: 114 },
        }}
      />
    );
    expect(screen.getByText("Rever")).toBeTruthy();
    expect(screen.getByText("FT/2026/0010")).toBeTruthy();
    expect(screen.getByText(/Regra #7/)).toBeTruthy();
    expect(screen.getByText(/Versão 2026-08-25/)).toBeTruthy();
    expect(screen.getByText(/Lei n.º 14\/23, artigo 19.º/)).toBeTruthy();
    expect(screen.getByText("Com proveniência")).toBeTruthy();
  });
});
