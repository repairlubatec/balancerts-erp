// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const locationState = vi.hoisted(() => ({ current: "/relatorios", navigate: vi.fn(), auditEvents: [] as Array<{ event: { id: number; action: string; entityType: string; entityId: string; createdAt: string } }> }));

vi.mock("wouter", () => ({
  useLocation: () => [locationState.current, (next: string) => { locationState.current = next; window.history.pushState({}, "", next); locationState.navigate(next); }],
}));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { role: "admin" } }) }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ companies: { list: { invalidate: vi.fn() }, periods: { invalidate: vi.fn() } }, counterparties: { list: { invalidate: vi.fn() } }, catalog: { list: { invalidate: vi.fn() } }, documents: { list: { invalidate: vi.fn() } }, reports: { journal: { invalidate: vi.fn() } }, treasury: { accounts: { invalidate: vi.fn() }, transactions: { invalidate: vi.fn() }, payments: { invalidate: vi.fn() } }, fixedAssets: { list: { invalidate: vi.fn() } } }),
    companies: { list: { useQuery: () => ({ data: [{ company: { id: 1, name: "Repair Lubatec", nif: "5001121871", configurationStatus: "READY", ivaRegime: "EXCLUSAO", functionalCurrency: "AOA", organizationId: 1 } }], isLoading: false }) }, create: { useMutation: (options?: { onSuccess?: (result: { company: { name: string } }) => unknown; onError?: (error: Error) => unknown }) => ({ mutate: vi.fn((input: unknown) => options?.onSuccess?.({ company: { name: (input as { name: string }).name } })), isPending: false, error: null }) }, periods: { useQuery: () => ({ data: [{ period: { id: 1, year: 2026, month: 1, status: "OPEN" } }], isLoading: false }) } },
    audit: { list: { useQuery: () => ({ data: locationState.auditEvents, isLoading: false }) } },
    normative: { list: { useQuery: () => ({ data: [], isLoading: false }) } },
    counterparties: { list: { useQuery: () => ({ data: [{ counterparty: { id: 12, name: "Cliente Teste", taxId: "500000001" } }], isLoading: false }) }, create: { useMutation: (options?: { onSuccess?: () => unknown }) => ({ mutate: vi.fn(() => options?.onSuccess?.()), isPending: false, error: null }) }, update: { useMutation: (options?: { onSuccess?: () => unknown }) => ({ mutate: vi.fn(() => options?.onSuccess?.()), isPending: false, error: null }) } },
    catalog: { list: { useQuery: () => ({ data: [{ product: { id: 21, code: "SVC-001", name: "Serviço de manutenção", kind: "SERVICE", unitCode: "UN" } }], isLoading: false }) }, create: { useMutation: (options?: { onSuccess?: () => unknown }) => ({ mutate: vi.fn(() => options?.onSuccess?.()), isPending: false, error: null }) }, update: { useMutation: (options?: { onSuccess?: () => unknown }) => ({ mutate: vi.fn(() => options?.onSuccess?.()), isPending: false, error: null }) } },
    treasury: {
      accounts: { useQuery: () => ({ data: [{ account: { id: 1, name: "Banco de teste", kind: "BANK", currency: "AOA", accountNumber: "001" } }], isLoading: false }) },
      transactions: { useQuery: () => ({ data: [], isLoading: false }) },
      payments: { useQuery: () => ({ data: [], isLoading: false }) },
      createPayment: { useMutation: (options?: { onSuccess?: (result: { payment: { id: number } }) => unknown }) => ({ mutate: vi.fn(() => options?.onSuccess?.({ payment: { id: 1 } })), isPending: false, error: null }) },
      createAccount: { useMutation: (options?: { onSuccess?: () => unknown }) => ({ mutate: vi.fn(() => options?.onSuccess?.()), isPending: false, error: null }) },
      updateAccount: { useMutation: (options?: { onSuccess?: () => unknown }) => ({ mutate: vi.fn(() => options?.onSuccess?.()), isPending: false, error: null }) },
    },
    inventory: { record: { useMutation: (options?: { onSuccess?: () => unknown }) => ({ mutate: vi.fn(() => options?.onSuccess?.()), isPending: false, error: null }) } },
    documents: { list: { useQuery: () => ({ data: [], isLoading: false }) }, createDraft: { useMutation: (options?: { onSuccess?: (result: { documentNumber: string }) => unknown }) => ({ mutate: vi.fn(() => options?.onSuccess?.({ documentNumber: "FT 2026/TEST" })), isPending: false, error: null }) }, transition: { useMutation: (options?: { onSuccess?: (result: { from: "DRAFT"; to: "VALIDATED" }) => unknown }) => ({ mutate: vi.fn(() => options?.onSuccess?.({ from: "DRAFT", to: "VALIDATED" })), isPending: false, error: null }) } },
    accounting: { validateEntry: { useMutation: (options?: { onSuccess?: (result: { ok: true; debit: number; credit: number }) => unknown }) => ({ mutate: vi.fn(() => options?.onSuccess?.({ ok: true, debit: 100, credit: 100 })), isPending: false, error: null }) }, post: { useMutation: (options?: { onSuccess?: (result: { entryId: number }) => unknown }) => ({ mutate: vi.fn(() => options?.onSuccess?.({ entryId: 1 })), isPending: false, error: null }) } },
    closing: {
      evaluate: { useMutation: () => ({ mutate: vi.fn((_input: unknown, options?: { onSuccess?: (result: { canClose: boolean; blockers: unknown[] }) => unknown }) => { options?.onSuccess?.({ canClose: false, blockers: [{ code: "DOCUMENTS_VALIDATED" }] }); }), isPending: false, error: null }) },
      close: { useMutation: (options?: { onSuccess?: () => unknown }) => ({ mutate: vi.fn(() => options?.onSuccess?.()), isPending: false, error: null }) },
      reopen: { useMutation: (options?: { onSuccess?: () => unknown }) => ({ mutate: vi.fn(() => options?.onSuccess?.()), isPending: false, error: null }) },
    },
    fixedAssets: {
      list: { useQuery: () => ({ data: [], isLoading: false }) },
      create: { useMutation: (options?: { onSuccess?: () => unknown }) => ({ mutate: vi.fn(() => options?.onSuccess?.()), isPending: false, error: null }) },
      update: { useMutation: (options?: { onSuccess?: () => unknown }) => ({ mutate: vi.fn(() => options?.onSuccess?.()), isPending: false, error: null }) },
      depreciation: { useMutation: () => ({ mutate: vi.fn(), isPending: false, error: null, data: null }) },
    },
    reports: {
      fiscalRegister: { useQuery: () => ({ data: { totals: { totalAmount: 0 } }, isLoading: false }) },
      customerAging: { useQuery: () => ({ data: { rows: [], totals: { outstanding: 0, byBucket: { CURRENT: 0, DAYS_1_30: 0, DAYS_31_60: 0, DAYS_61_90: 0, OVER_90: 0 } } }, isLoading: false }) },
      supplierAging: { useQuery: () => ({ data: { rows: [], totals: { outstanding: 0, byBucket: { CURRENT: 0, DAYS_1_30: 0, DAYS_31_60: 0, DAYS_61_90: 0, OVER_90: 0 } } }, isLoading: false }) },
      reconciliation: { useQuery: () => ({ data: { companyId: 1, reconciled: true, checks: { trialBalance: true, journal: true, balanceSheet: true, vat: true, fiscalRegister: true } }, isLoading: false }) },
      journal: { useQuery: () => ({ data: { entries: [{ entryId: 1, sourceDocumentId: 1, description: "FT 2026/00482", createdAt: new Date("2026-08-18T08:00:00.000Z"), accountCode: "21.1.1", accountName: "Cliente nacional", debit: 1250000, credit: 0 }], totals: { debit: 1250000, credit: 1250000 } }, isLoading: false }) },
    },
  },
}));

import Home from "./Home";

describe("Home traceability integration", () => {
  afterEach(() => { cleanup(); locationState.auditEvents = []; });
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

  it("opens dashboard actions instead of silently doing nothing", () => {
    cleanup();
    locationState.current = "/";
    locationState.navigate.mockClear();
    window.history.pushState({}, "", "/");
    render(<Home />);
    fireEvent.click(screen.getByRole("button", { name: "Filtros" }));
    expect(document.activeElement?.getAttribute("placeholder")).toBe("Pesquisar empresa ou NIF");
    fireEvent.click(screen.getByRole("button", { name: "Nova empresa" }));
    expect(locationState.navigate).toHaveBeenCalledWith("/empresas?new=company");
    fireEvent.click(screen.getByRole("button", { name: "Ver todas" }));
    expect(locationState.navigate).toHaveBeenCalledWith("/empresas");
    fireEvent.click(screen.getAllByRole("button", { name: "Abrir auditoria" })[0]!);
    expect(locationState.navigate).toHaveBeenCalledWith("/auditoria");
  });

  it("opens and submits the company creation form", async () => {
    cleanup();
    locationState.current = "/empresas?new=company";
    window.history.pushState({}, "", "/empresas?new=company");
    render(<Home />);
    expect(screen.getAllByText("Criar empresa").length).toBeGreaterThanOrEqual(2);
    fireEvent.submit(screen.getByRole("button", { name: "Criar empresa" }).closest("form")!);
    expect(screen.getByText("Preencha todos os campos obrigatórios antes de criar a empresa.")).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText("Ex.: Nova Empresa, Lda."), { target: { value: "Empresa Teste" } });
    fireEvent.change(screen.getByPlaceholderText("Número fiscal"), { target: { value: "999999999" } });
    fireEvent.change(screen.getByPlaceholderText("Morada completa"), { target: { value: "Morada Teste" } });
    fireEvent.change(screen.getByPlaceholderText("Município"), { target: { value: "Lubango" } });
    fireEvent.change(screen.getByPlaceholderText("Província"), { target: { value: "Huíla" } });
    fireEvent.change(screen.getByPlaceholderText("+244 …"), { target: { value: "+244900000000" } });
    fireEvent.change(screen.getByPlaceholderText("email@empresa.ao"), { target: { value: "teste@example.invalid" } });
    fireEvent.change(screen.getByPlaceholderText("Actividade principal"), { target: { value: "Serviços" } });
    fireEvent.change(screen.getByPlaceholderText("Nome(s) e separação por ;"), { target: { value: "Representante Teste" } });
    fireEvent.submit(screen.getByRole("button", { name: "Criar empresa" }).closest("form")!);
    await waitFor(() => expect(screen.getByText(/Empresa Empresa Teste criada em estado pendente/)).toBeTruthy());
  });

  it("opens the command palette from a module action", () => {
    cleanup();
    locationState.current = "/clientes";
    locationState.navigate.mockClear();
    window.history.pushState({}, "", "/clientes");
    render(<Home />);
    fireEvent.click(screen.getByRole("button", { name: "Atalhos" }));
    expect(locationState.navigate).toHaveBeenCalledWith("/?shortcuts=1");
  });

  it("opens the command palette when navigation includes shortcuts query", () => {
    cleanup();
    locationState.current = "/?shortcuts=1";
    window.history.pushState({}, "", "/?shortcuts=1");
    render(<Home />);
    expect(screen.getByPlaceholderText("Ir para módulo, empresa ou acção…")).toBeTruthy();
  });

  it("creates a billing draft through the real document mutation contract", async () => {
    cleanup();
    locationState.current = "/facturacao";
    window.history.pushState({}, "", "/facturacao");
    render(<Home />);
    fireEvent.submit(screen.getByRole("button", { name: "Criar rascunho" }).closest("form")!);
    expect(screen.getByText("Seleccione um cliente válido.")).toBeTruthy();
    fireEvent.change(screen.getByRole("combobox", { name: "Cliente" }), { target: { value: "12" } });
    fireEvent.change(screen.getByPlaceholderText("Descrição da linha"), { target: { value: "Serviço de manutenção" } });
    fireEvent.change(screen.getByPlaceholderText("Preço"), { target: { value: "1500" } });
    fireEvent.submit(screen.getByRole("button", { name: "Criar rascunho" }).closest("form")!);
    await waitFor(() => expect(screen.getByText("Rascunho FT 2026/TEST criado e auditado.")).toBeTruthy());
  });

  it("publishes a balanced accounting entry from the operational post", async () => {
    cleanup();
    locationState.current = "/contabilidade";
    window.history.pushState({}, "", "/contabilidade");
    render(<Home />);
    fireEvent.change(screen.getByPlaceholderText("Descrição"), { target: { value: "Ajuste operacional" } });
    fireEvent.change(screen.getByPlaceholderText("Conta débito ID"), { target: { value: "11" } });
    fireEvent.change(screen.getByPlaceholderText("Conta crédito ID"), { target: { value: "21" } });
    fireEvent.change(screen.getByPlaceholderText("Valor AOA"), { target: { value: "2500" } });
    fireEvent.click(screen.getByRole("button", { name: "Validar e publicar" }));
    await waitFor(() => expect(screen.getByText("Lançamento #1 publicado e auditado.")).toBeTruthy());
  });

  it("registers a treasury receipt with an active cash account", async () => {
    cleanup();
    locationState.current = "/tesouraria";
    window.history.pushState({}, "", "/tesouraria");
    render(<Home />);
    fireEvent.change(screen.getByRole("combobox", { name: "Conta de tesouraria" }), { target: { value: "1" } });
    fireEvent.change(screen.getByPlaceholderText("Valor AOA"), { target: { value: "3000" } });
    fireEvent.click(screen.getByRole("button", { name: "Registar movimento" }));
    await waitFor(() => expect(screen.getByText("Movimento #1 registado e auditado.")).toBeTruthy());
  });

  it("renders operational empty states and real create affordance for each module", () => {
    for (const path of ["/clientes", "/fornecedores", "/stock", "/tesouraria"]) {
      cleanup();
      locationState.current = path;
      window.history.pushState({}, "", path);
      render(<Home />);
      expect(screen.getByText("Novo registo operacional")).toBeTruthy();
      expect(screen.getByRole("button", { name: "Guardar" })).toBeTruthy();
      fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
      expect(screen.getByText("Indique um nome válido.")).toBeTruthy();
      fireEvent.click(screen.getByRole("button", { name: "Actualizar" }));
      expect(screen.getByText("Indique o ID e o novo nome do registo.")).toBeTruthy();
      expect(screen.getByText("Registos recentes")).toBeTruthy();
    }
  });

  it("shows success feedback after a stock movement mutation", async () => {
    cleanup();
    locationState.current = "/stock";
    window.history.pushState({}, "", "/stock");
    render(<Home />);
    fireEvent.change(screen.getByPlaceholderText("Código do artigo"), { target: { value: "SVC-001" } });
    fireEvent.submit(screen.getByRole("button", { name: "Registar movimento" }).closest("form")!);
    await waitFor(() => expect(document.body.textContent).toContain("Movimento persistido e auditado."));
  });

  it("shows success feedback after create and update mutations", async () => {
    cleanup();
    locationState.current = "/clientes";
    window.history.pushState({}, "", "/clientes");
    render(<Home />);
    fireEvent.change(screen.getByPlaceholderText("Nome"), { target: { value: "Cliente UI" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(screen.getByText("Contraparte criada e auditada.")).toBeTruthy());
    fireEvent.change(screen.getByPlaceholderText("ID"), { target: { value: "1" } });
    fireEvent.change(screen.getByPlaceholderText("Novo nome"), { target: { value: "Cliente UI actualizado" } });
    fireEvent.click(screen.getByRole("button", { name: "Actualizar" }));
    await waitFor(() => expect(screen.getByText("Contraparte actualizada e auditada.")).toBeTruthy());
  });

  it("shows success feedback across supplier, stock and treasury creation", async () => {
    for (const [path, message] of [["/fornecedores", "Contraparte criada e auditada."], ["/stock", "Produto/serviço criado e auditado."], ["/tesouraria", "Conta de caixa/banco criada e auditada."]] as const) {
      cleanup();
      locationState.current = path;
      window.history.pushState({}, "", path);
      render(<Home />);
      fireEvent.change(screen.getByPlaceholderText("Nome"), { target: { value: `Registo ${path}` } });
      if (path === "/stock") fireEvent.change(screen.getByPlaceholderText("Código"), { target: { value: "SVC-UI" } });
      fireEvent.submit(screen.getByRole("button", { name: "Guardar" }).closest("form")!);
      await waitFor(() => expect(document.body.textContent).toContain(message));
    }
  });

  it("opens real configuration destinations from Definitions", () => {
    cleanup();
    locationState.current = "/definicoes";
    window.history.pushState({}, "", "/definicoes");
    locationState.navigate.mockClear();
    render(<Home />);
    fireEvent.click(screen.getByRole("button", { name: /Normas fiscais/ }));
    expect(locationState.navigate).toHaveBeenCalledWith("/fiscalidade");
  });

  it("validates the close checklist without closing a period", async () => {
    cleanup();
    locationState.current = "/fecho";
    window.history.pushState({}, "", "/fecho");
    render(<Home />);
    expect(screen.getByText(/Fecho operacional/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Validar checklist" }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Fecho bloqueado"));
  });

  it("renders persistent fixed asset management affordances", () => {
    cleanup();
    locationState.current = "/imobilizado";
    window.history.pushState({}, "", "/imobilizado");
    render(<Home />);
    expect(screen.getByText("Novo activo fixo e depreciação")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Registar activo" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Actualizar activo" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Calcular" })).toBeTruthy();
    expect(screen.getByText("Registos recentes")).toBeTruthy();
  });

  it("keeps Documents empty when no persisted documents exist", () => {
    cleanup();
    locationState.current = "/documentos";
    window.history.pushState({}, "", "/documentos");
    render(<Home />);
    expect(screen.queryByText("factura_00482.pdf")).toBeNull();
    expect(within(screen.getByRole("table", { name: "Documentos - registos" })).getAllByRole("row")).toHaveLength(1);
  });

  it("keeps duplicate audit actions as distinct activity rows", () => {
    cleanup();
    locationState.current = "/";
    locationState.auditEvents = [
      { event: { id: 101, action: "DOCUMENT_NUMBER_RESERVED", entityType: "documentSeries", entityId: "FT-TEST:FT", createdAt: "2026-08-18T08:00:00.000Z" } },
      { event: { id: 102, action: "DOCUMENT_NUMBER_RESERVED", entityType: "documentSeries", entityId: "FT-TEST:FT", createdAt: "2026-08-18T08:01:00.000Z" } },
    ];
    window.history.pushState({}, "", "/");
    render(<Home />);
    expect(screen.getAllByText("Documento Número Reservado")).toHaveLength(2);
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
