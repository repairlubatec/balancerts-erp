import { describe, expect, it } from "vitest";
import { pgcOperations } from "./PgcMovementSimulatorPanel";

describe("PgcMovementSimulatorPanel", () => {
  it("expõe apenas operações canónicas do PGCA", () => {
    expect([...pgcOperations]).toEqual(["COMPRAS", "VENDAS", "STOCK", "TESOURARIA", "SALARIOS", "IMOBILIZADO"]);
    expect(new Set(pgcOperations).size).toBe(pgcOperations.length);
    expect(pgcOperations).not.toContain("COMPRA");
    expect(pgcOperations).not.toContain("VENDA");
  });
});
