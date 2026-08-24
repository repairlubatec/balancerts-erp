import { describe, expect, it } from "vitest";
import { sortPgcAccounts } from "./pgcaAccountSorting";

const accounts = [
  { code: "18.10", name: "Zeta", validationStatus: "PENDING" },
  { code: "2", name: "Alfa", validationStatus: "CONFIRMED" },
  { code: "18.2", name: "Beta", validationStatus: "CONFIRMED" },
];

describe("sortPgcAccounts", () => {
  it("ordena códigos numericamente nos dois sentidos", () => {
    expect(sortPgcAccounts(accounts, "CODE_ASC").map(account => account.code)).toEqual(["2", "18.2", "18.10"]);
    expect(sortPgcAccounts(accounts, "CODE_DESC").map(account => account.code)).toEqual(["18.10", "18.2", "2"]);
  });

  it("ordena por designação e desempata estado por código", () => {
    expect(sortPgcAccounts(accounts, "NAME_ASC").map(account => account.name)).toEqual(["Alfa", "Beta", "Zeta"]);
    expect(sortPgcAccounts(accounts, "STATUS").map(account => account.validationStatus)).toEqual(["CONFIRMED", "CONFIRMED", "PENDING"]);
  });
});
