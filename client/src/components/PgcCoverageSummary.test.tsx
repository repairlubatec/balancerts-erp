// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PgcCoverageSummary } from "./PgcCoverageSummary";

describe("Resumo de cobertura operacional PGCA", () => {
  it("mostra todas as operações e diferencia as que estão em falta", () => {
    render(<PgcCoverageSummary coverage={{ required: ["COMPRAS", "VENDAS", "STOCK"], active: ["COMPRAS"], missing: ["VENDAS", "STOCK"], complete: false }} />);
    const summary = screen.getByLabelText("Cobertura operacional PGCA");
    expect(summary.textContent).toContain("COMPRAS");
    expect(summary.textContent).toContain("VENDAS");
    expect(summary.textContent).toContain("STOCK");
    expect(summary.querySelectorAll("[class*=emerald]").length).toBeGreaterThan(0);
    expect(summary.querySelectorAll("[class*=amber]").length).toBeGreaterThan(0);
  });
});
