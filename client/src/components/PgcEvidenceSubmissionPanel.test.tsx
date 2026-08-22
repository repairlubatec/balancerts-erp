// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PgcEvidenceSubmissionPanel } from "./PgcEvidenceSubmissionPanel";

const mutate = vi.fn();

vi.mock("@/lib/trpc", () => ({
  trpc: {
    pgc: {
      evidenceSubmissions: { useQuery: () => ({ data: [], isLoading: false, refetch: vi.fn() }) },
      submitEvidence: { useMutation: () => ({ mutate, isPending: false }) },
    },
  },
}));

afterEach(() => {
  cleanup();
  mutate.mockClear();
});

describe("formulário de evidência primária PGCA", () => {
  it("apresenta o contexto de revisão e mantém a confirmação automática bloqueada", () => {
    render(<PgcEvidenceSubmissionPanel organizationId={1} companyId={2} versionId={3} sources={[{ id: 4, title: "Decreto n.º 82/01", instrument: "Decreto", instrumentNumber: "82/01", verificationStatus: "CONFIRMED" }]} />);

    expect(screen.getByText("Submeter evidência primária")).toBeTruthy();
    expect(screen.getByText(/Revisão humana obrigatória/)).toBeTruthy();
    expect(screen.getByText(/não confirma contas, não publica movimentos e não activa regras contabilísticas/)).toBeTruthy();
    expect(screen.getByText("A associação não confirma a fonte nem as contas.")).toBeTruthy();
  });

  it("só permite submeter depois de indicar códigos e seleccionar um ficheiro", () => {
    render(<PgcEvidenceSubmissionPanel organizationId={1} companyId={2} versionId={3} sources={[]} />);
    const submitButton = screen.getByRole("button", { name: "Submeter para revisão" });
    expect((submitButton as HTMLButtonElement).disabled).toBe(true);

    fireEvent.change(screen.getByPlaceholderText("Ex.: 32, 33, 34 ou 52.1"), { target: { value: "32, 33" } });
    const file = new File(["evidência"], "decreto-82-01.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText("Ficheiro primário"), { target: { files: [file] } });

    expect((submitButton as HTMLButtonElement).disabled).toBe(false);
  });
});
