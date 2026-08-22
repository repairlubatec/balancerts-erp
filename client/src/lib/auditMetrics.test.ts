import { describe, expect, it } from "vitest";
import { aggregateAuditMetrics } from "./auditMetrics";

describe("métricas do dashboard de auditoria", () => {
  it("ordena acções e utilizadores por frequência", () => {
    const metrics = aggregateAuditMetrics([
      { action: "A", actorUserId: 1, actor: { name: "Ana" } },
      { action: "B", actorUserId: 2, actor: { name: "Bruno" } },
      { action: "B", actorUserId: 2, actor: { name: "Bruno" } },
      { action: "B", actorUserId: 1, actor: { name: "Ana" } },
    ], { A: "Acção A", B: "Acção B" });
    expect(metrics.sampleSize).toBe(4);
    expect(metrics.actionRows).toEqual([{ key: "B", label: "Acção B", count: 3 }, { key: "A", label: "Acção A", count: 1 }]);
    expect(metrics.userRows).toEqual([{ key: "1", label: "Ana", count: 2 }, { key: "2", label: "Bruno", count: 2 }]);
  });
  it("limita cada gráfico aos cinco primeiros e preserva amostra", () => {
    const events = Array.from({ length: 8 }, (_, index) => ({ action: `A${index}`, actorUserId: index + 1 }));
    const metrics = aggregateAuditMetrics(events);
    expect(metrics.sampleSize).toBe(8);
    expect(metrics.actionRows).toHaveLength(5);
    expect(metrics.userRows).toHaveLength(5);
  });
});
