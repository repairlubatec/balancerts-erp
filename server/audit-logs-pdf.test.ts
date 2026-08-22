import { describe, expect, it } from "vitest";
import { buildAuditLogsPdf } from "./audit-logs-pdf";

describe("relatório PDF dos logs de auditoria", () => {
  it("gera PDF válido com cabeçalho e evento", async () => {
    const result = await buildAuditLogsPdf({ organizationName: "Repair Lubatec", companyName: "Repair Lubatec", filters: "todas as acções", items: [{ id: 1, createdAt: new Date("2026-08-22T10:00:00Z"), action: "PGC_ACCOUNT_REVIEWED", entityType: "pgcAccount", entityId: "27", actorUserId: 8, correlationId: "corr-27", beforeState: "PENDENTE", afterState: "CONFIRMADA", actor: { id: 8, name: "Repair Lubatec", email: "repairlubatec@gmail.com" }, companyName: "Repair Lubatec" }] });
    expect(result.mimeType).toBe("application/pdf");
    expect(result.buffer.subarray(0, 4).toString()).toBe("%PDF");
    expect(result.buffer.length).toBeGreaterThan(500);
  });
});
