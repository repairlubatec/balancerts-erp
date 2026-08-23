// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  mutations: new Map<string, { onSuccess?: (value: unknown) => void }>(),
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  downloadBlob: vi.fn(),
  downloadBase64File: vi.fn(),
}));

vi.mock("sonner", () => ({ toast: mocks.toast }));
vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: { role: "admin" } }),
}));
vi.mock("@/lib/ivaReadinessExport", () => ({
  buildIvaReadinessCsv: vi.fn(() => "csv"),
  downloadBlob: mocks.downloadBlob,
  downloadBase64File: mocks.downloadBase64File,
}));
vi.mock("@/lib/normativeErrors", () => ({
  normativeErrorLabel: (value: string) => value,
}));
vi.mock("@/lib/trpc", () => {
  const query = (data: unknown) => ({
    data,
    isLoading: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn().mockResolvedValue(undefined),
  });
  const mutation = (key: string) => ({
    useMutation: (options: { onSuccess?: (value: unknown) => void }) => {
      mocks.mutations.set(key, options);
      return {
        isPending: false,
        mutate: vi.fn(),
      };
    },
  });
  return {
    trpc: {
      normative: {
        ivaReadiness: {
          useQuery: () =>
            query({
              ready: false,
              activeRules: 1,
              activeMappings: 0,
              confirmedSources: 3,
              missingChainSources: ["IVA-DP-180-19", "IVA-LAW-14-23"],
              activeByRegime: { GERAL: 1, SIMPLIFICADO: 0, EXCLUSAO: 0 },
              blockers: ["IVA_CADEIA_NORMATIVA_INCOMPLETA"],
            }),
        },
        ivaRules: { useQuery: () => query([]) },
        ivaAccounts: { useQuery: () => query([]) },
        exportIvaReadinessPdf: mutation("exportIvaReadinessPdf"),
        reviewIvaRule: mutation("reviewIvaRule"),
        reviewIvaAccount: mutation("reviewIvaAccount"),
        activateIvaRule: mutation("activateIvaRule"),
        activateIvaAccount: mutation("activateIvaAccount"),
      },
      useUtils: () => ({}),
    },
  };
});

import { IvaNormativeReviewPanel } from "./IvaNormativeReviewPanel";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mocks.mutations.clear();
});

describe("exportação IVA na revisão normativa", () => {
  it("confirma por toast a preparação do CSV e do PDF", () => {
    render(<IvaNormativeReviewPanel organizationId={3} />);

    fireEvent.click(screen.getByRole("button", { name: "CSV" }));
    expect(mocks.downloadBlob).toHaveBeenCalledTimes(1);
    expect(mocks.toast.success).toHaveBeenCalledWith(
      "Relatório CSV de prontidão IVA descarregado.",
      expect.objectContaining({ description: expect.stringContaining(".csv") })
    );

    fireEvent.click(screen.getByRole("button", { name: "PDF" }));
    const pdfMutation = mocks.mutations.get("exportIvaReadinessPdf");
    expect(pdfMutation).toBeTruthy();
    pdfMutation?.onSuccess?.({
      dataBase64: "JVBERi0xLjQ=",
      filename: "prontidao-iva-3.pdf",
      mimeType: "application/pdf",
    });

    expect(mocks.downloadBase64File).toHaveBeenCalledWith(
      "JVBERi0xLjQ=",
      "prontidao-iva-3.pdf",
      "application/pdf"
    );
    expect(mocks.toast.success).toHaveBeenCalledWith(
      "Relatório PDF de prontidão IVA descarregado.",
      { description: "prontidao-iva-3.pdf" }
    );
  });
});
