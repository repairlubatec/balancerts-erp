import { describe, expect, it } from "vitest";
import { validateSaftAoSemantics, type SaftSemanticInput } from "./saftSemantic";

const validInput: SaftSemanticInput = {
  functionalCurrency: "AOA",
  periodStart: new Date("2026-01-01T00:00:00Z"),
  periodEnd: new Date("2026-12-31T23:59:59Z"),
  accounts: [
    { code: "11", postable: true },
    { code: "71", postable: true },
  ],
  journalEntries: [
    {
      id: 1,
      transactionDate: new Date("2026-08-27T00:00:00Z"),
      lines: [
        { accountCode: "11", debit: 100, credit: 0 },
        { accountCode: "71", debit: 0, credit: 100 },
      ],
    },
  ],
  sourceDocuments: [
    {
      documentNumber: "FT S001/1",
      documentType: "FT",
      issueDate: new Date("2026-08-27T00:00:00Z"),
      netAmount: 100,
      taxAmount: 14,
      totalAmount: 114,
      ivaRegime: "GERAL",
    },
  ],
};

describe("SAF-T AO semantic validation", () => {
  it("accepts internally coherent accounts, entries and documents", () => {
    expect(validateSaftAoSemantics(validInput)).toEqual({ valid: true, issues: [] });
  });

  it("rejects unknown/non-postable accounts and unbalanced entries", () => {
    const result = validateSaftAoSemantics({
      ...validInput,
      accounts: [
        { code: "11", postable: false },
      ],
      journalEntries: [{
        id: 2,
        transactionDate: validInput.periodStart,
        lines: [
          { accountCode: "11", debit: 100, credit: 0 },
          { accountCode: "99", debit: 0, credit: 90 },
        ],
      }],
    });
    expect(result.valid).toBe(false);
    expect(result.issues.map(issue => issue.code)).toEqual(
      expect.arrayContaining(["NON_POSTABLE_ACCOUNT", "UNKNOWN_ACCOUNT", "UNBALANCED_ENTRY"]),
    );
  });

  it("rejects inconsistent documents, dates, currency and exclusion with tax", () => {
    const result = validateSaftAoSemantics({
      ...validInput,
      functionalCurrency: "USD",
      sourceDocuments: [{
        ...validInput.sourceDocuments[0],
        documentNumber: "",
        issueDate: new Date("2025-12-31T00:00:00Z"),
        netAmount: 100,
        taxAmount: 14,
        totalAmount: 100,
        ivaRegime: "EXCLUSAO",
      }],
    });
    expect(result.valid).toBe(false);
    expect(result.issues.map(issue => issue.code)).toEqual(
      expect.arrayContaining(["INVALID_CURRENCY", "EMPTY_DOCUMENT_NUMBER", "DOCUMENT_OUTSIDE_PERIOD", "DOCUMENT_TOTAL_MISMATCH", "EXCLUSAO_WITH_TAX"]),
    );
  });
});
