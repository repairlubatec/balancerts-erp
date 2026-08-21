import { describe, expect, it } from "vitest";
import { validatePgcAccountDraft, type PgcAccountDraft } from "./pgc";

const base: PgcAccountDraft = {
  code: "4511",
  name: "Caixa Kwanza",
  classCode: "4",
  parentCode: "451",
  level: 4,
  accountType: "MOVEMENT",
  nature: "DEBIT",
  balanceType: "DEBIT",
  acceptsEntries: true,
  acceptsChildren: false,
  validFrom: new Date("2026-01-01T00:00:00.000Z"),
};

describe("PGCA — validação estrutural de contas", () => {
  it("aceita uma conta de movimento postável com hierarquia coerente", () => {
    expect(validatePgcAccountDraft(base)).toBe(true);
  });

  it("aceita também a correspondência oficial 6131 como conta de movimento", () => {
    expect(validatePgcAccountDraft({ ...base, code: "6131", name: "Mercadorias — mercado nacional", classCode: "6", parentCode: "613", nature: "CREDIT" })).toBe(true);
  });

  it("rejeita código com classe incompatível", () => {
    expect(() => validatePgcAccountDraft({ ...base, classCode: "6" })).toThrow("PGC_ACCOUNT_CODE_INVALID");
  });

  it("rejeita nível diferente da profundidade do código", () => {
    expect(() => validatePgcAccountDraft({ ...base, level: 3 })).toThrow("PGC_ACCOUNT_LEVEL_INVALID");
  });

  it("rejeita grupo marcado como lançável", () => {
    expect(() => validatePgcAccountDraft({ ...base, accountType: "GROUP", acceptsEntries: true })).toThrow("PGC_GROUP_CANNOT_ACCEPT_ENTRIES");
  });

  it("rejeita movimento não lançável", () => {
    expect(() => validatePgcAccountDraft({ ...base, acceptsEntries: false })).toThrow("PGC_MOVEMENT_MUST_ACCEPT_ENTRIES");
  });
});
