// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LayoutDashboard, Receipt } from "lucide-react";
import { DesktopWindowTaskbar } from "./DesktopWindowTaskbar";

describe("DesktopWindowTaskbar", () => {
  it("selecciona janelas abertas e identifica a minimizada", () => {
    const onSelect = vi.fn();
    render(<DesktopWindowTaskbar windows={[{ path: "/", label: "Minhas Empresas", icon: LayoutDashboard }, { path: "/facturacao", label: "Facturação", icon: Receipt, minimized: true }]} activePath="/" onSelect={onSelect} />);

    expect(screen.getByRole("button", { name: "Facturação" }).getAttribute("title")).toBe("Facturação · minimizada");
    fireEvent.click(screen.getByRole("button", { name: "Facturação" }));
    expect(onSelect).toHaveBeenCalledWith("/facturacao");
  });
});
