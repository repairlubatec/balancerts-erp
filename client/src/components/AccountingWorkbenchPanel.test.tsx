// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AccountingWorkbenchPanel } from "./AccountingWorkbenchPanel";

const fixtureAccounts = [
  { id: 1, code: "4511", name: "Caixa Kwanza", parentCode: "451", acceptsEntries: 1, validationStatus: "CONFIRMED", accountType: "MOVEMENT", nature: "DEBIT", balanceType: "DEBIT", balanceSheet: 1, incomeStatement: 0 },
  { id: 2, code: "6131", name: "Mercado nacional", parentCode: "613", acceptsEntries: 1, validationStatus: "PENDING", accountType: "MOVEMENT", nature: "CREDIT", balanceType: "CREDIT", balanceSheet: 0, incomeStatement: 1 },
];

vi.mock("@/lib/trpc", () => ({
  trpc: {
    pgc: {
      versions: { useQuery: () => ({ data: [{ id: 7, status: "ACTIVE", code: "PGCA-82-01", name: "Plano Geral de Contabilidade" }] }) },
      accounts: { useQuery: () => ({ data: fixtureAccounts, isLoading: false }) },
      accountingRules: { useQuery: () => ({ data: [] }) },
    },
  },
}));

afterEach(() => cleanup());

describe("protótipo do motor contabilístico", () => {
  it("apresenta a natureza e o comportamento do saldo da conta seleccionada", () => {
    render(<AccountingWorkbenchPanel company={{ id: 10, organizationId: 1 }} periodId={3} />);

    expect(screen.getByText("Natureza contabilística")).toBeTruthy();
    expect(screen.getAllByText("Devedora").length).toBeGreaterThan(0);
    expect(screen.getByText("Saldo devedor")).toBeTruthy();
    expect(screen.getByText("Balanço")).toBeTruthy();
  });

  it("mantém uma conta pendente fora do posting automático quando seleccionada", () => {
    render(<AccountingWorkbenchPanel company={{ id: 10, organizationId: 1 }} periodId={3} />);

    fireEvent.click(screen.getByText("6131"));
    expect(screen.getAllByText("Credora").length).toBeGreaterThan(0);
    expect(screen.getByText("Saldo credor")).toBeTruthy();
    expect(screen.getByText(/Não utilizar em posting automático/)).toBeTruthy();
  });
});
