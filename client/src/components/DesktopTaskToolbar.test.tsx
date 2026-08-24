// @vitest-environment jsdom

import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DesktopTaskToolbar } from "./DesktopTaskToolbar";

describe("DesktopTaskToolbar", () => {
  afterEach(() => cleanup());

  it("expõe comandos PMR de tarefa e dispara callbacks", () => {
    const onFilter = vi.fn();
    const onSearch = vi.fn();
    const onShortcuts = vi.fn();
    const onNewRecord = vi.fn();
    const onImport = vi.fn();

    render(<DesktopTaskToolbar eyebrow="Documentos comerciais" title="Facturação" description="Emissão e validação." supportsRecordControls onFilter={onFilter} onSearch={onSearch} onShortcuts={onShortcuts} onNewRecord={onNewRecord} newRecordLabel="Novo lançamento" onImport={onImport} />);

    expect(screen.getByText("Facturação")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Filtrar/ }));
    fireEvent.click(screen.getByRole("button", { name: /Procurar/ }));
    fireEvent.click(screen.getByRole("button", { name: /Atalhos/ }));
    fireEvent.click(screen.getByRole("button", { name: /Importar/ }));
    fireEvent.click(screen.getByRole("button", { name: /Novo lançamento/ }));

    expect(onFilter).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onShortcuts).toHaveBeenCalledTimes(1);
    expect(onNewRecord).toHaveBeenCalledTimes(1);
    expect(onImport).toHaveBeenCalledTimes(1);
  });
});
