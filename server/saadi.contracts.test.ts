import { describe, expect, it } from "vitest";
import { saadiAssumptionSchema, saadiProjectionSchema, saadiSnapshotRequestSchema, saadiVersionSchema } from "../shared/saadi-contracts";

const request = {
  organizationId: 1,
  companyId: 30001,
  fiscalExerciseId: 1,
  periodIds: [1, 2],
  currency: "AOA",
  purpose: "Estudo de viabilidade",
  contractVersion: "v1.0",
  correlationId: "saadi-contract-test",
};

describe("contratos partilhados SAADI", () => {
  it("aceita um pedido de snapshot tenant-aware", () => {
    expect(saadiSnapshotRequestSchema.parse(request)).toMatchObject({ organizationId: 1, companyId: 30001, currency: "AOA", includeHrDetails: false });
  });

  it("rejeita IDs inválidos, períodos vazios e versões fora do formato", () => {
    expect(() => saadiSnapshotRequestSchema.parse({ ...request, companyId: 0 })).toThrow();
    expect(() => saadiSnapshotRequestSchema.parse({ ...request, periodIds: [] })).toThrow();
    expect(() => saadiSnapshotRequestSchema.parse({ ...request, contractVersion: "1.0" })).toThrow();
  });

  it("valida premissas com origem e confiança explícitas", () => {
    const parsed = saadiAssumptionSchema.parse({ key: "crescimento.receita", label: "Crescimento da receita", value: 0.1, unit: "%", origin: "ESTIMADO", source: "Premissa aprovada", confidence: 0.7, validFrom: "2026-01-01" });
    expect(parsed.origin).toBe("ESTIMADO");
    expect(parsed.confidence).toBe(0.7);
  });

  it("exige proveniência completa nas projecções", () => {
    const projection = {
      metric: "Receita",
      period: "2026-01",
      value: 100000,
      currency: "AOA",
      origin: "PROJECTADO",
      method: "Cenário base",
      provenance: {
        sourceSystem: "BALANCERTS.ERP",
        sourceContract: "reports.financialDashboard",
        sourceEntity: "monthlySeries",
        organizationId: 1,
        companyId: 30001,
        periodIds: [1],
        extractedAt: "2026-08-20T12:00:00+01:00",
        contractVersion: "v1.0",
        contentHash: "a".repeat(64),
      },
    };
    expect(saadiProjectionSchema.parse(projection).provenance.sourceSystem).toBe("BALANCERTS.ERP");
    expect(() => saadiProjectionSchema.parse({ ...projection, provenance: { ...projection.provenance, contentHash: "sem-hash" } })).toThrow();
  });

  it("mantém versões aprovadas estruturalmente reproduzíveis", () => {
    const version = saadiVersionSchema.parse({
      studyId: 10,
      versionNumber: 1,
      status: "APROVADA",
      authorUserId: 1,
      createdAt: "2026-08-20T12:00:00+01:00",
      contentHash: "b".repeat(64),
      assumptions: [],
      projections: [],
      sourceSnapshotIds: [20],
    });
    expect(version.status).toBe("APROVADA");
    expect(version.sourceSnapshotIds).toEqual([20]);
  });
});
