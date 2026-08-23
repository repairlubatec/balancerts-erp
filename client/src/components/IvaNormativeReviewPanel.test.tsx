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
  downloadIvaExport: vi.fn(),
  openIvaExport: vi.fn(() => true),
}));

vi.mock("sonner", () => ({ toast: mocks.toast }));
vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: { role: "admin" } }),
}));
vi.mock("@/lib/ivaReadinessExport", () => ({
  buildIvaReadinessCsv: vi.fn(() => "csv"),
  downloadBlob: mocks.downloadBlob,
  downloadBase64File: mocks.downloadBase64File,
  downloadIvaExport: mocks.downloadIvaExport,
  openIvaExport: mocks.openIvaExport,
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
import { ThemeProvider } from "@/contexts/ThemeContext";

function renderReviewPanel() {
  return render(
    <ThemeProvider switchable>
      <IvaNormativeReviewPanel organizationId={3} />
    </ThemeProvider>
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mocks.mutations.clear();
});

describe("exportação IVA na revisão normativa", () => {
  it("confirma por toast a preparação do CSV e do PDF", () => {
    renderReviewPanel();

    fireEvent.click(screen.getByRole("button", { name: "CSV" }));
    expect(mocks.downloadIvaExport).toHaveBeenCalledTimes(1);
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

    expect(mocks.downloadIvaExport).toHaveBeenCalledTimes(2);
    expect(mocks.downloadIvaExport).toHaveBeenLastCalledWith(
      expect.objectContaining({
        content: "JVBERi0xLjQ=",
        filename: "prontidao-iva-3.pdf",
        encoding: "base64",
      })
    );
    const pdfToast = mocks.toast.success.mock.calls.find(
      ([message]) => message === "Relatório PDF de prontidão IVA descarregado."
    );
    expect(pdfToast).toBeTruthy();
    expect(pdfToast?.[1]).toEqual(
      expect.objectContaining({
        description: "prontidao-iva-3.pdf",
        action: expect.objectContaining({ label: "Abrir ficheiro" }),
      })
    );
    pdfToast?.[1]?.action?.onClick();
    expect(mocks.openIvaExport).toHaveBeenCalledWith(
      expect.objectContaining({ filename: "prontidao-iva-3.pdf" })
    );
  });
});
