import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { validateSaadiVersionInput } from "./saadi";

const baseVersion = {
  studyId: 1,
  versionNumber: 1,
  status: "RASCUNHO" as const,
  authorUserId: 52,
  createdAt: "2026-08-20T10:00:00+01:00",
  assumptions: [],
  projections: [],
  sourceSnapshotIds: [7],
};

describe("versões SAADI", () => {
  it("aceita uma versão com hash de conteúdo válido", () => {
    const contentHash = createHash("sha256").update(JSON.stringify({ ...baseVersion, contentHash: undefined })).digest("hex");
    expect(validateSaadiVersionInput({ organizationId: 10, companyId: 20, version: { ...baseVersion, contentHash } }).versionNumber).toBe(1);
  });

  it("rejeita uma versão sem hash válido", () => {
    expect(() => validateSaadiVersionInput({ organizationId: 10, companyId: 20, version: { ...baseVersion, contentHash: "a".repeat(64) } })).toThrow("SAADI_VERSION_HASH_INVALID");
  });

  it("rejeita uma versão aprovada sem snapshot de origem", () => {
    const version = { ...baseVersion, status: "APROVADA" as const, sourceSnapshotIds: [], contentHash: "a".repeat(64) };
    expect(() => validateSaadiVersionInput({ organizationId: 10, companyId: 20, version })).toThrow("SAADI_APPROVED_VERSION_REQUIRES_SOURCE");
  });

  it("rejeita escopo inválido antes de qualquer acesso persistente", () => {
    expect(() => validateSaadiVersionInput({ organizationId: 0, companyId: 20, version: { ...baseVersion, contentHash: "a".repeat(64) } })).toThrow("SAADI_SCOPE_REQUIRED");
  });
});
