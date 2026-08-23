import { describe, expect, it } from "vitest";
import { can, normalizePermissionOverrides } from "./permissions";

describe("role segregation", () => {
  it("allows accounting posting only to authorised roles", () => {
    expect(can("contabilista", "accounting", "post")).toBe(true);
    expect(can("financeiro", "accounting", "post")).toBe(false);
    expect(can("auditor", "accounting", "post")).toBe(false);
  });

  it("segrega notas de investigação por papel", () => {
    expect(can("contabilista", "audit", "read")).toBe(true);
    expect(can("contabilista", "audit", "create")).toBe(true);
    expect(can("contabilista", "audit", "update")).toBe(true);
    expect(can("auditor", "audit", "read")).toBe(true);
    expect(can("auditor", "audit", "create")).toBe(false);
    expect(can("operador", "audit", "read")).toBe(false);
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

  it("applies company-scoped RH overrides without granting validation", () => {
    expect(can("user", "human_resources", "read", ["human_resources:read"])).toBe(true);
    expect(can("user", "human_resources", "create", ["human_resources:read"])).toBe(false);
    expect(can("user", "human_resources", "validate", ["human_resources:read", "human_resources:create"])).toBe(false);
  });

  it("normalises permission overrides for deterministic storage", () => {
    expect(normalizePermissionOverrides([" Treasury:READ ", "treasury:read", "", "accounting:post"])).toEqual(["treasury:read", "accounting:post"]);
  });
});
