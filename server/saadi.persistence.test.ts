import { describe, expect, it } from "vitest";
import { validateSaadiSnapshotInput } from "./saadi";

const request = {
  organizationId: 10,
  companyId: 20,
  periodIds: [30],
  currency: "AOA",
  purpose: "Análise de investimento",
  contractVersion: "v1.0",
  correlationId: "saadi-test-1",
  includeHrDetails: false,
} as const;

const snapshot = {
  request,
  status: "CONCLUIDA" as const,
  provenance: [],
  metrics: { investimento: 100000 },
};

describe("validação do armazenamento SAADI", () => {
  it("aceita um snapshot tenant-aware com chave idempotente", () => {
    const result = validateSaadiSnapshotInput({ request, snapshot, idempotencyKey: " estudo-1:snapshot-1 " });
    expect(result.idempotencyKey).toBe("estudo-1:snapshot-1");
    expect(result.request.companyId).toBe(20);
  });

  it("rejeita uma chave idempotente vazia", () => {
    expect(() => validateSaadiSnapshotInput({ request, snapshot, idempotencyKey: "  " })).toThrow("SAADI_IDEMPOTENCY_KEY_REQUIRED");
  });

  it("rejeita snapshot de outra organização ou empresa", () => {
    expect(() => validateSaadiSnapshotInput({
      request,
      snapshot: { ...snapshot, request: { ...request, companyId: 999 } },
      idempotencyKey: "isolamento-1",
    })).toThrow("SAADI_SNAPSHOT_SCOPE_MISMATCH");
  });
});
