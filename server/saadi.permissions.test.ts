import { describe, expect, it } from "vitest";
import { isForbiddenOperationalPermission, isSaadiPermission, saadiForbiddenOperationalPermissions } from "../shared/saadi-permissions";

describe("catálogo de permissões SAADI", () => {
  it("reconhece apenas permissões SAADI declaradas", () => {
    expect(isSaadiPermission("saadi.study.read")).toBe(true);
    expect(isSaadiPermission("accounting.post")).toBe(false);
    expect(isSaadiPermission("saadi.unknown")).toBe(false);
  });

  it("mantém operações críticas fora do catálogo SAADI", () => {
    for (const permission of saadiForbiddenOperationalPermissions) {
      expect(isForbiddenOperationalPermission(permission)).toBe(true);
      expect(isSaadiPermission(permission)).toBe(false);
    }
  });

  it("inclui leitura de detalhe RH como permissão excepcional separada", () => {
    expect(isSaadiPermission("saadi.hr.detail.read")).toBe(true);
    expect(isForbiddenOperationalPermission("saadi.hr.detail.read")).toBe(false);
  });
});
