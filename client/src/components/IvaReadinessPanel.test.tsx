// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
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
    expect(
      screen.getByText(/Falta confirmar um ou mais diplomas/)
    ).toBeTruthy();
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
  });
});
