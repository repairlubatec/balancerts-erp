import { describe, expect, it } from "vitest";
import { can } from "./permissions";

describe("role segregation", () => {
  it("allows accounting posting only to authorised roles", () => {
    expect(can("contabilista", "accounting", "post")).toBe(true);
    expect(can("financeiro", "accounting", "post")).toBe(false);
    expect(can("auditor", "accounting", "post")).toBe(false);
  });

  it("keeps audit read-only for auditors and gives admin full access", () => {
    expect(can("auditor", "audit", "read")).toBe(true);
    expect(can("auditor", "audit", "issue")).toBe(false);
    expect(can("admin", "any-module", "reopen")).toBe(true);
  });
});
