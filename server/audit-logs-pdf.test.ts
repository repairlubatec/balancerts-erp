import { describe, expect, it } from "vitest";
import { buildAuditLogsPdf } from "./audit-logs-pdf";

describe("relatório PDF dos logs de auditoria", () => {
  it("gera PDF válido com cabeçalho e evento", async () => {
    const result = await buildAuditLogsPdf({ organizationName: "Repair Lubatec", companyName: "Repair Lubatec", filters: "bloqueios PGCA · desde 01/08/2026 · até 25/08/2026", executiveSummary: { total: 4, open: 2, reviewed: 1, resolved: 1, topReason: "PAYMENT_FISCAL_PERIOD_REQUIRED" }, items: [{ id: 1, createdAt: new Date("2026-08-22T10:00:00Z"), action: "PAYMENT_ACCOUNTING_BLOCKED", entityType: "payment", entityId: "27", actorUserId: 8, correlationId: "corr-27", beforeState: "PENDENTE", afterState: "{\"reason\":\"PAYMENT_FISCAL_PERIOD_REQUIRED\"}", actor: { id: 8, name: "Repair Lubatec", email: "repairlubatec@gmail.com" }, companyName: "Repair Lubatec" }] });
    expect(result.mimeType).toBe("application/pdf");
    expect(result.buffer.subarray(0, 4).toString()).toBe("%PDF");
    expect(result.buffer.length).toBeGreaterThan(900);
  });
});

  it("gera identificador documental distinto em cada emissão", async () => {
    const input = { organizationName: "Repair Lubatec", filters: "bloqueios PGCA", items: [] };
    const first = await buildAuditLogsPdf(input);
    const second = await buildAuditLogsPdf(input);
    expect(first.buffer.equals(second.buffer)).toBe(false);
  });
