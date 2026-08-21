import { describe, expect, it } from "vitest";
import { can, normalizePermissionOverrides } from "./permissions";

describe("SAADI — RBAC e segurança de procedimentos", () => {
  it("permite ao contabilista ler, criar e validar estudos", () => {
    expect(can("contabilista", "saadi", "read")).toBe(true);
    expect(can("contabilista", "saadi", "create")).toBe(true);
    expect(can("contabilista", "saadi", "validate")).toBe(true);
  });

  it("mantém financeiro, operador e auditor em leitura no SAADI", () => {
    for (const role of ["financeiro", "operador", "auditor"] as const) {
      expect(can(role, "saadi", "read")).toBe(true);
      expect(can(role, "saadi", "create")).toBe(false);
      expect(can(role, "saadi", "validate")).toBe(false);
    }
  });

  it("não concede acesso SAADI ao utilizador sem permissões", () => {
    expect(can("user", "saadi", "read")).toBe(false);
    expect(can("user", "saadi", "create")).toBe(false);
  });

  it("normaliza e remove duplicados dos overrides", () => {
    expect(normalizePermissionOverrides([" SAADI:READ ", "saadi:read", "", "*"])).toEqual(["saadi:read", "*"]);
  });
});

