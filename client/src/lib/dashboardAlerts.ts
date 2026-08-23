import { classifyAuditRisk, type AuditRiskLevel } from "./auditRisk";

export type DashboardAlertStatus = "OPEN" | "REVIEWED" | "RESOLVED";
export type DashboardAlertFilter = "ALL" | DashboardAlertStatus;

type DashboardAlertEvent = {
  reviewStatus?: string | null;
  action: string;
  entityType: string;
  beforeState?: string | null;
  afterState?: string | null;
};

export function isHighRiskDashboardAlert(event: DashboardAlertEvent) {
  const level: AuditRiskLevel = classifyAuditRisk(event).level;
  return level === "HIGH" || level === "CRITICAL";
}

export function filterDashboardAlerts<T extends DashboardAlertEvent>(events: T[], filter: DashboardAlertFilter) {
  return events.filter((event) => isHighRiskDashboardAlert(event) && (filter === "ALL" || (event.reviewStatus ?? "OPEN") === filter));
}
