import { describe, expect, it } from "vitest";
import { normativeErrorLabel } from "./normativeErrors";

describe("normativeErrorLabel", () => {
  it("traduz o bloqueio de revisão da fonte", () => {
    expect(normativeErrorLabel("PGC_SOURCE_NOT_FOUND_OR_FORBIDDEN")).toContain("fonte normativa");
  });

  it("não expõe códigos técnicos desconhecidos", () => {
    expect(normativeErrorLabel("401")).toBe("Não foi possível concluir a revisão normativa. Verifique a sessão, a organização e o estado da versão.");
  });
});
