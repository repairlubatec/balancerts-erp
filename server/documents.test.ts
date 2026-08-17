import { describe, expect, it } from "vitest";
import { formatDocumentNumber } from "./documents";
import { documentTransitions, validateDocumentTransition } from "./accounting";

describe("document numbering", () => {
  it("formats a series with six-digit sequential numbering", () => {
    expect(formatDocumentNumber("FT", 1)).toBe("FT/000001");
    expect(formatDocumentNumber("FT", 482)).toBe("FT/000482");
  });

  it("enforces post-issuance immutability in the lifecycle graph", () => {
    expect(validateDocumentTransition("ISSUED", "ACCOUNTED")).toBe(true);
    expect(validateDocumentTransition("ISSUED", "CANCELLED")).toBe(true);
    expect(validateDocumentTransition("ISSUED", "DRAFT")).toBe(false);
    expect(validateDocumentTransition("ISSUED", "VALIDATED")).toBe(false);
    expect(validateDocumentTransition("ACCOUNTED", "CANCELLED")).toBe(true);
    expect(validateDocumentTransition("ACCOUNTED", "DRAFT")).toBe(false);
    expect(documentTransitions.CANCELLED).toEqual([]);
  });

  it("rejects invalid sequence values", () => {
    expect(() => formatDocumentNumber("", 1)).toThrow("INVALID_DOCUMENT_NUMBER");
    expect(() => formatDocumentNumber("FT", 0)).toThrow("INVALID_DOCUMENT_NUMBER");
  });
});
