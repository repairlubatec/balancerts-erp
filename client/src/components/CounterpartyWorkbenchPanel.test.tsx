// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  updateInput: undefined as unknown,
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ counterparties: { list: { invalidate: vi.fn() } } }),
    counterparties: {
      list: { useQuery: () => ({ data: [{ counterparty: { id: 7, kind: "CUSTOMER", name: "Cliente Angola", taxId: "500000007", email: "cliente@exemplo.ao", phone: "+244 900 000 007", address: "Rua da Maianga", municipality: "Luanda", province: "Luanda", paymentTermsDays: 30, creditLimit: "250000.00", preferredCurrency: "AOA", active: 1 } }], isLoading: false }) },
      update: { useMutation: (options?: { onSuccess?: () => unknown }) => ({ mutate: vi.fn((input: unknown) => { state.updateInput = input; void options?.onSuccess?.(); }), isPending: false, error: null }) },
    },
    documents: { list: { useQuery: () => ({ data: [{ document: { id: 12, counterpartyId: 7, documentNumber: "FT 2026/0007", status: "ISSUED", totalAmount: "125000.00" } }], isLoading: false }) } },
    audit: { list: { useQuery: () => ({ data: [{ event: { id: 21, entityType: "counterparty", entityId: "7", action: "COUNTERPARTY_CREATED", createdAt: "2026-08-25T08:00:00.000Z" } }], isLoading: false }) } },
    reports: {
      customerAging: { useQuery: () => ({ data: { rows: [{ partyName: "Cliente Angola", amount: 125000, settledAmount: 25000 }], totals: { outstanding: 100000 } }, isLoading: false }) },
      supplierAging: { useQuery: () => ({ data: { rows: [], totals: { outstanding: 0 } }, isLoading: false }) },
    },
  },
}));

import { CounterpartyWorkbenchPanel } from "./CounterpartyWorkbenchPanel";

describe("CounterpartyWorkbenchPanel", () => {
  it("pesquisa e apresenta ficha, saldo, documentos e histórico da contraparte", async () => {
    render(<CounterpartyWorkbenchPanel companyId={1} kind="CUSTOMER" />);
    expect(screen.getByText("Cliente Angola")).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText("Pesquisar clientes por nome, NIF ou contacto"), { target: { value: "500000007" } });
    expect(screen.getByText("Cliente Angola")).toBeTruthy();
    const counterpartyRow = screen.getByRole("row", { name: /Cliente Angola/ });
    fireEvent.click(counterpartyRow);
    await waitFor(() => expect(screen.getByPlaceholderText("Morada").getAttribute("value")).toBe("Rua da Maianga"));
    await waitFor(() => expect(screen.getByText(/FT 2026\/0007/)).toBeTruthy());
    expect(screen.getByText(/Documentos associados/)).toBeTruthy();
    expect(screen.getByText(/Em aberto/)).toBeTruthy();
    expect(screen.getByText(/Eventos auditados/)).toBeTruthy();
    const addressInput = screen.getByPlaceholderText("Morada");
    fireEvent.input(addressInput, { target: { value: "Rua actualizada" } });
    await waitFor(() => expect(addressInput.getAttribute("value")).toBe("Rua actualizada"));
    fireEvent.click(screen.getByRole("button", { name: "Guardar ficha" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Ficha actualizada e auditada."));
    expect(state.updateInput).toMatchObject({ companyId: 1, counterpartyId: 7, address: "Rua actualizada", preferredCurrency: "AOA" });
  });
});
