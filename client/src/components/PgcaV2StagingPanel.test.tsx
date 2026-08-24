// @vitest-environment jsdom
import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PgcaV2StagingPanel } from "./PgcaV2StagingPanel";

describe("PgcaV2StagingPanel", () => {
  it("apresenta o resumo do preflight e mantém a versão apenas em revisão", () => {
    render(<PgcaV2StagingPanel />);

    expect(screen.getByText("Nova versão PGCA — revisão controlada")).toBeTruthy();
    expect(screen.getByText("714")).toBeTruthy();
    expect(screen.getByText("5")).toBeTruthy();
    expect(screen.getByText("86")).toBeTruthy();
    expect(screen.getByText("Importação normativa e activação bloqueadas")).toBeTruthy();
    expect(screen.getByText(/18\.1, 18\.2, 18\.3, 34\.5, 34\.6/)).toBeTruthy();
    expect(screen.getByText("Estado de incorporação: STAGING_ONLY_NOT_ACTIVATED")).toBeTruthy();
  });
});
