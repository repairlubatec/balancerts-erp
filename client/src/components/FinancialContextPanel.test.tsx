// @vitest-environment jsdom

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { focusNextField } from "@/lib/financialContext";

function EnterForm() {
  return <form onKeyDown={focusNextField}><input aria-label="Descrição" /><select aria-label="Conta débito"><option value="1">1</option></select><input aria-label="Valor" /><button type="submit">Guardar</button></form>;
}

describe("Contexto financeiro", () => {
  it("avança para o campo seguinte ao pressionar Enter", () => {
    render(<EnterForm />);
    const description = screen.getByLabelText("Descrição");
    const debit = screen.getByLabelText("Conta débito");
    const amount = screen.getByLabelText("Valor");
    description.focus();
    fireEvent.keyDown(description, { key: "Enter" });
    expect(document.activeElement).toBe(debit);
    fireEvent.keyDown(debit, { key: "Enter" });
    expect(document.activeElement).toBe(amount);
  });
});
