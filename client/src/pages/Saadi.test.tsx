// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { name: "Repair Lubatec" } }) }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    companies: { list: { useQuery: () => ({ data: [{ company: { id: 20, organizationId: 10, name: "Repair Lubatec", nif: "5001121871", functionalCurrency: "AOA" } }], isLoading: false }) } },
    saadi: { studies: { useQuery: () => ({ data: [], isLoading: false, isFetching: false, error: null, refetch: vi.fn() }) }, snapshots: { useQuery: () => ({ data: [], isLoading: false, isFetching: false, error: null, refetch: vi.fn() }) }, versions: { useQuery: () => ({ data: [], isLoading: false, isFetching: false, error: null, refetch: vi.fn() }) }, createStudy: { useMutation: () => ({ mutate: vi.fn(), isPending: false, isSuccess: false, error: null }) } },
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
  });
});
