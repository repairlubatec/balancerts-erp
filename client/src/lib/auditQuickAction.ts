import type { AuditRiskLevel } from "./auditRisk";

export function findFirstRiskEvent<T extends { risk: { level: AuditRiskLevel }; item: { id: number } }>(items: T[], level: Exclude<AuditRiskLevel, "NORMAL">) {
  return items.find(({ risk }) => risk.level === level)?.item ?? null;
}
