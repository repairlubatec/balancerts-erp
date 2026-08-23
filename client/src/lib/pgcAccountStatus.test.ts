import { describe, expect, it } from "vitest";
import { filterPgcAccountsByStatus, pgcAccountStatusLabel } from "./pgcAccountStatus";

const accounts = [
  { id: 1, validationStatus: "CONFIRMED" },
  { id: 2, validationStatus: "NEEDS_NORMATIVE_VALIDATION" },
  { id: 3, validationStatus: "INVALID" },
  { id: 4, validationStatus: "DUPLICATE" },
];

describe("filtros de estado das contas PGCA", () => {
  it("separa confirmadas, pendentes e outros estados", () => {
    expect(filterPgcAccountsByStatus(accounts, "ALL").map((account) => account.id)).toEqual([1, 2, 3, 4]);
    expect(filterPgcAccountsByStatus(accounts, "CONFIRMED").map((account) => account.id)).toEqual([1]);
    expect(filterPgcAccountsByStatus(accounts, "PENDING").map((account) => account.id)).toEqual([2]);
    expect(filterPgcAccountsByStatus(accounts, "OTHER").map((account) => account.id)).toEqual([3, 4]);
  });

  it("devolve uma lista vazia quando não existem contas no estado escolhido", () => {
    expect(filterPgcAccountsByStatus([{ id: 1, validationStatus: "CONFIRMED" }], "PENDING")).toEqual([]);
  });

  it("usa etiquetas portuguesas e não depende apenas da cor", () => {
    expect(pgcAccountStatusLabel.CONFIRMED).toBe("Confirmada");
    expect(pgcAccountStatusLabel.NEEDS_NORMATIVE_VALIDATION).toBe("Pendente");
    expect(pgcAccountStatusLabel.INVALID).toBe("Inválida");
  });
});
