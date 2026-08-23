// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { name: "Repair Lubatec" } }) }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    companies: { list: { useQuery: () => ({ data: [{ company: { id: 20, organizationId: 10, name: "Repair Lubatec", nif: "5001121871", functionalCurrency: "AOA" } }], isLoading: false }) } },
    saadi: { erpPgcNormativeContext: { useQuery: () => ({ data: { data: { available: false, confirmedOnly: true, accounts: [], sources: [] } }, isLoading: false, isFetching: false, error: null, refetch: vi.fn() }) }, studies: { useQuery: () => ({ data: [], isLoading: false, isFetching: false, error: null, refetch: vi.fn() }) }, snapshots: { useQuery: () => ({ data: [], isLoading: false, isFetching: false, error: null, refetch: vi.fn() }) }, versions: { useQuery: () => ({ data: [], isLoading: false, isFetching: false, error: null, refetch: vi.fn() }) }, provenance: { useQuery: () => ({ data: [], isLoading: false, isFetching: false, error: null, refetch: vi.fn() }) }, assumptions: { useQuery: () => ({ data: [], isLoading: false, isFetching: false, error: null, refetch: vi.fn() }) }, alerts: { useQuery: () => ({ data: [], isLoading: false, isFetching: false, error: null, refetch: vi.fn() }) }, projections: { useQuery: () => ({ data: [], isLoading: false, isFetching: false, error: null, refetch: vi.fn() }) }, validations: { useQuery: () => ({ data: [], isLoading: false, isFetching: false, error: null, refetch: vi.fn() }) }, documents: { useQuery: () => ({ data: [], isLoading: false, isFetching: false, error: null, refetch: vi.fn() }) },       transitionVersion: { useMutation: () => ({ mutate: vi.fn(), isPending: false, isSuccess: false, error: null }) }, createStudy: { useMutation: () => ({ mutate: vi.fn(), isPending: false, isSuccess: false, error: null }) }, createExternalStudy: { useMutation: () => ({ mutate: vi.fn(), isPending: false, isSuccess: false, error: null }) }, createAssumption: { useMutation: () => ({ mutate: vi.fn(), isPending: false, isSuccess: false, error: null }) }, addDocument: { useMutation: () => ({ mutate: vi.fn(), isPending: false, isSuccess: false, error: null }) }, reviewDocument: { useMutation: () => ({ mutate: vi.fn(), isPending: false, isSuccess: false, error: null }) }, feasibility: { useQuery: () => ({ data: { input: null, result: null }, isLoading: false, isFetching: false, error: null, refetch: vi.fn() }) }, scenarios: { useQuery: () => ({ data: [], isLoading: false, isFetching: false, error: null, refetch: vi.fn() }) }, captureErpAccountingSnapshot: { useMutation: () => ({ mutate: vi.fn(), isPending: false, isSuccess: false, error: null }) }, variances: { useQuery: () => ({ data: [], isLoading: false, isFetching: false, error: null, refetch: vi.fn() }) }, compareProjectionToRealized: { useMutation: () => ({ mutate: vi.fn(), isPending: false, isSuccess: false, error: null }) }, risks: { useQuery: () => ({ data: [], isLoading: false, isFetching: false, error: null, refetch: vi.fn() }) }, createRisk: { useMutation: () => ({ mutate: vi.fn(), isPending: false, isSuccess: false, error: null }) }, decisions: { useQuery: () => ({ data: [], isLoading: false, isFetching: false, error: null, refetch: vi.fn() }) }, submitDecision: { useMutation: () => ({ mutate: vi.fn(), isPending: false, isSuccess: false, error: null }) }, generateReport: { useMutation: () => ({ mutate: vi.fn(), isPending: false, isSuccess: false, error: null, data: null }) }, sensitivity: { useQuery: () => ({ data: [], isLoading: false, isFetching: false, error: null, refetch: vi.fn() }) }, valuation: { useQuery: () => ({ data: null, isLoading: false, isFetching: false, error: null, refetch: vi.fn() }) }, financing: { useQuery: () => ({ data: null, isLoading: false, isFetching: false, error: null, refetch: vi.fn() }) }, indicators: { useQuery: () => ({ data: null, isLoading: false, isFetching: false, error: null, refetch: vi.fn() }) }, saveFeasibilityInput: { useMutation: () => ({ mutate: vi.fn(), isPending: false, isSuccess: false, error: null }) }, calculateFeasibility: { useMutation: () => ({ mutate: vi.fn(), isPending: false, isSuccess: false, error: null }) }, saveScenario: { useMutation: () => ({ mutate: vi.fn(), isPending: false, isSuccess: false, error: null }) }, transitionWorkflow: { useMutation: () => ({ mutate: vi.fn(), isPending: false, isSuccess: false, error: null }) } },
    useUtils: () => ({ saadi: { studies: { invalidate: vi.fn() } } }),
  },
}));

import Saadi from "./Saadi";

describe("página SAADI", () => {
  it("mostra o contexto empresarial e o estado vazio em português", () => {
    render(<Saadi />);
    expect(screen.getByRole("heading", { name: "SAADI" })).toBeTruthy();
    expect(screen.getByLabelText("Empresa de trabalho SAADI")).toBeTruthy();
    expect(screen.getByText("Ainda não existem estudos nesta empresa.")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Criar estudo/i })).toBeTruthy();
    expect(screen.getByLabelText("Horizonte de projecção")).toBeTruthy();
    expect(screen.queryByText("Premissas financeiras")).toBeNull();
    expect(screen.queryByText("Documentos do estudo")).toBeNull();
  });
});
