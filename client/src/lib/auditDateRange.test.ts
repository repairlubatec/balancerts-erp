import { describe, expect, it } from "vitest";
import { buildAuditDateRange } from "./auditDateRange";

describe("intervalo de datas da auditoria", () => {
  it("usa início do dia e fim do dia em UTC", () => {
    const range = buildAuditDateRange("2026-08-01", "2026-08-23");
    expect(range.invalid).toBe(false);
    expect(range.from?.toISOString()).toBe("2026-08-01T00:00:00.000Z");
    expect(range.to?.toISOString()).toBe("2026-08-23T23:59:59.999Z");
    expect(range.label).toBe("2026-08-01 a 2026-08-23");
  });

  it("aceita limites parciais", () => {
    expect(buildAuditDateRange("2026-08-01", "").label).toBe("desde 2026-08-01");
    expect(buildAuditDateRange("", "2026-08-23").label).toBe("até 2026-08-23");
    expect(buildAuditDateRange("", "").label).toBe("todo o período");
  });

  it("rejeita intervalo invertido e não produz datas de consulta", () => {
    const range = buildAuditDateRange("2026-08-24", "2026-08-23");
    expect(range.invalid).toBe(true);
    expect(range.from).toBeUndefined();
    expect(range.to).toBeUndefined();
  });
});
