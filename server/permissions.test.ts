import { describe, expect, it } from "vitest";
import { can, normalizePermissionOverrides } from "./permissions";

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

  it("grants an explicit company-scoped override without changing the base role", () => {
    expect(can("user", "treasury", "read")).toBe(false);
    expect(can("user", "treasury", "read", ["treasury:read"])).toBe(true);
    expect(can("user", "treasury", "create", ["treasury:read"])).toBe(false);
  });

  it("segregates human resources management from read-only roles", () => {
    expect(can("contabilista", "human_resources", "create")).toBe(true);
    expect(can("contabilista", "human_resources", "validate")).toBe(true);
    expect(can("financeiro", "human_resources", "create")).toBe(false);
    expect(can("auditor", "human_resources", "read")).toBe(true);
    expect(can("auditor", "human_resources", "update")).toBe(false);
  });

  it("normalises permission overrides for deterministic storage", () => {
    expect(normalizePermissionOverrides([" Treasury:READ ", "treasury:read", "", "accounting:post"])).toEqual(["treasury:read", "accounting:post"]);
  });
});
