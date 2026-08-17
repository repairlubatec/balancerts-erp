import { describe, expect, it } from "vitest";
import { formatDocumentNumber } from "./documents";

describe("document numbering", () => {
  it("formats a series with six-digit sequential numbering", () => {
    expect(formatDocumentNumber("FT", 1)).toBe("FT/000001");
    expect(formatDocumentNumber("FT", 482)).toBe("FT/000482");
  });

  it("rejects invalid sequence values", () => {
    expect(() => formatDocumentNumber("", 1)).toThrow("INVALID_DOCUMENT_NUMBER");
    expect(() => formatDocumentNumber("FT", 0)).toThrow("INVALID_DOCUMENT_NUMBER");
  });
});
