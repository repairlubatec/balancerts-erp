// @vitest-environment jsdom

import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/trpc", () => ({
  trpc: {
    documents: { list: { useQuery: () => ({ data: [{ document: { id: 1, documentNumber: "FT 2026/0001", documentType: "INVOICE", status: "DRAFT" } }], isLoading: false }) } },
    ia: {
      suggestions: { useQuery: () => ({ data: [], isLoading: false }) },
      suggestDocumentClassification: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      suggestDraftCompletion: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      reviewSuggestion: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      logs: { useQuery: () => ({ data: [] }) },
    },
    useUtils: () => ({ ia: { suggestions: { invalidate: vi.fn() }, logs: { invalidate: vi.fn() } } }),
  },
}));

import { BalancertsIaReviewPanel } from "./BalancertsIaReviewPanel";

describe("BalancertsIaReviewPanel", () => {
  afterEach(() => cleanup());

  it("apresenta o tipo e o estado do documento em português", () => {
    render(<BalancertsIaReviewPanel companyId={1} />);
    const select = screen.getAllByRole("combobox")[0];
    expect(select.textContent).toContain("Factura");
    expect(select.textContent).toContain("Rascunho");
    expect(select.textContent).not.toContain("INVOICE");
    expect(select.textContent).not.toContain("DRAFT");
  });
});
