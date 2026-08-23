import { describe, expect, it } from "vitest";
import { findFirstRiskEvent } from "./auditQuickAction";

describe("acção rápida dos alertas de auditoria", () => {
  const items = [
    { item: { id: 11 }, risk: { level: "NORMAL" as const } },
    { item: { id: 12 }, risk: { level: "HIGH" as const } },
    { item: { id: 13 }, risk: { level: "CRITICAL" as const } },
  ];

  it("selecciona o primeiro evento do nível solicitado", () => {
    expect(findFirstRiskEvent(items, "HIGH")).toEqual({ id: 12 });
    expect(findFirstRiskEvent(items, "CRITICAL")).toEqual({ id: 13 });
  });

  it("não cria um alvo quando não existe alerta do nível", () => {
    expect(findFirstRiskEvent([{ item: { id: 1 }, risk: { level: "NORMAL" as const } }], "HIGH")).toBeNull();
  });
});
