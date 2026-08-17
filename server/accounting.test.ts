import { describe, expect, it } from "vitest";
import { validateBalancedEntry, validateDocumentTransition } from "./accounting";

const validLine = { accountId: 1, postable: true, validFrom: new Date("2020-01-01") };

describe("accounting invariants", () => {
  it("accepts a balanced double-entry", () => {
    expect(validateBalancedEntry([
      { ...validLine, debit: 100, credit: 0 },
      { ...validLine, accountId: 2, debit: 0, credit: 100 },
    ]).ok).toBe(true);
  });

  it("rejects unbalanced entries and non-postable accounts", () => {
    expect(validateBalancedEntry([
      { ...validLine, debit: 100, credit: 0 },
      { ...validLine, accountId: 2, debit: 0, credit: 99 },
    ]).reason).toBe("DEBIT_MUST_EQUAL_CREDIT");
    expect(validateBalancedEntry([
      { ...validLine, debit: 100, credit: 0 },
      { ...validLine, accountId: 2, postable: false, debit: 0, credit: 100 },
    ]).reason).toBe("ACCOUNT_NOT_POSTABLE");
  });

  it("enforces the document lifecycle and immutability after issue", () => {
    expect(validateDocumentTransition("DRAFT", "VALIDATED")).toBe(true);
    expect(validateDocumentTransition("VALIDATED", "ISSUED")).toBe(true);
    expect(validateDocumentTransition("ISSUED", "DRAFT")).toBe(false);
    expect(validateDocumentTransition("ACCOUNTED", "DRAFT")).toBe(false);
  });
});
