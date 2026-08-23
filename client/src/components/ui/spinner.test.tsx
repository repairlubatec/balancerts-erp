// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Spinner } from "./spinner";

describe("Spinner", () => {
  it("expõe um rótulo de carregamento em português", () => {
    render(<Spinner />);
    expect(screen.getByRole("status", { name: "A carregar" })).toBeTruthy();
  });
});
