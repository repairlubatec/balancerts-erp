// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const locationState = vi.hoisted(() => ({ current: "/relatorios", navigate: vi.fn() }));

vi.mock("wouter", () => ({
  useLocation: () => [locationState.current, (next: string) => { locationState.current = next; window.history.pushState({}, "", next); locationState.navigate(next); }],
}));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { role: "admin" } }) }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    companies: { list: { useQuery: () => ({ data: [{ company: { id: 1, name: "Repair Lubatec", nif: "5001121871", configurationStatus: "READY", ivaRegime: "EXCLUSAO", functionalCurrency: "AOA" } }], isLoading: false }) } },
    audit: { list: { useQuery: () => ({ data: [], isLoading: false }) } },
    reports: {
      customerAging: { useQuery: () => ({ data: { rows: [], totals: { outstanding: 0, byBucket: { CURRENT: 0, DAYS_1_30: 0, DAYS_31_60: 0, DAYS_61_90: 0, OVER_90: 0 } } }, isLoading: false }) },
      supplierAging: { useQuery: () => ({ data: { rows: [], totals: { outstanding: 0, byBucket: { CURRENT: 0, DAYS_1_30: 0, DAYS_31_60: 0, DAYS_61_90: 0, OVER_90: 0 } } }, isLoading: false }) },
    },
  },
}));

import Home from "./Home";

describe("Home traceability integration", () => {
  afterEach(() => cleanup());
  it("navigates from a selected report and opens the corresponding journal entry", async () => {
    locationState.current = "/relatorios";
    window.history.pushState({}, "", "/relatorios");
    locationState.navigate.mockClear();
    render(<Home />);
    fireEvent.click(screen.getByText("Balancete analítico"));
    fireEvent.click(screen.getByRole("button", { name: "Lançamento" }));
    expect(locationState.navigate).toHaveBeenCalledWith("/contabilidade?entry=FT%202026%2F00482");
    cleanup();
    render(<Home />);
    const row = screen.getAllByText("FT 2026/00482")[0]?.closest("tr");
    await waitFor(() => expect(row?.className).toContain("bg-[#f0f6ff]"));
  });

  it("navigates back from an account context and opens the corresponding report", async () => {
    locationState.current = "/contabilidade?entry=FT%202026%2F00482";
    window.history.pushState({}, "", "/contabilidade?entry=FT%202026%2F00482");
    locationState.navigate.mockClear();
    render(<Home />);
    fireEvent.click(screen.getAllByText("FT 2026/00482")[0]!);
    fireEvent.click(screen.getByRole("button", { name: "Relatório" }));
    expect(locationState.navigate).toHaveBeenCalledWith("/relatorios?focus=Balancete%20anal%C3%ADtico");
    cleanup();
    render(<Home />);
    const reportRow = screen.getAllByText("Balancete analítico")[0]?.closest("tr");
    await waitFor(() => expect(reportRow?.className).toContain("bg-[#f0f6ff]"));
  });
});
