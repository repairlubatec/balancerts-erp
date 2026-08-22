import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("inventário patrimonial PGCA", () => {
  it("mantém as 465 contas das classes 1 a 5 e regras de movimentação pendentes", () => {
    const inventory = JSON.parse(readFileSync("docs/pgca-balance-sheet-review-inventory.json", "utf8")) as {
      classes: Record<string, { total: number; confirmed: number }>;
      movementRules: { status: string; entries: unknown[] };
    };
    expect(Object.keys(inventory.classes).sort()).toEqual(["1", "2", "3", "4", "5"]);
    expect(Object.values(inventory.classes).reduce((sum, value) => sum + value.total, 0)).toBe(465);
    expect(inventory.classes["4"].confirmed).toBe(7);
    expect(inventory.movementRules.status).toBe("PENDING_HUMAN_CONFIRMATION");
    expect(inventory.movementRules.entries).toHaveLength(0);
  });
});
