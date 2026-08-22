export type AuditRiskLevel = "CRITICAL" | "HIGH" | "NORMAL";
export type AuditRisk = { level: AuditRiskLevel; label: string; reason: string; isCritical: boolean };

type RiskEvent = { action: string; entityType: string; beforeState?: string | null; afterState?: string | null };

const criticalActions = new Set(["PGC_VERSION_ACTIVATED", "ACCOUNTING_RULE_CREATED", "JOURNAL_ENTRY_POSTED", "PAYMENT_POSTED", "FISCAL_PERIOD_CLOSED", "FISCAL_PERIOD_REOPENED", "OPENING_BALANCES_PUBLISHED"]);
const highActions = new Set(["PGC_ACCOUNT_REVIEWED", "PGC_SOURCE_REVIEWED", "PGC_EVIDENCE_REVIEW_DECIDED", "PGC_EVIDENCE_REVIEW_STARTED", "PGC_VERSION_VALIDATED", "DOCUMENT_ISSUED", "DOCUMENT_ARCHIVED", "PAYMENT_APPROVED", "PAYMENT_REVERSED", "JOURNAL_ENTRY_REVERSED"]);

export function classifyAuditRisk(event: RiskEvent): AuditRisk {
  if (criticalActions.has(event.action)) return { level: "CRITICAL", label: "Crítico", reason: "A acção pode alterar a disponibilidade normativa ou o estado financeiro operacional.", isCritical: true };
  if (highActions.has(event.action)) return { level: "HIGH", label: "Alto risco", reason: "A acção altera ou confirma dados relevantes para controlo contabilístico.", isCritical: true };
  const changed = Boolean(event.beforeState && event.afterState && event.beforeState !== event.afterState);
  if (changed) return { level: "HIGH", label: "Alto risco", reason: `Alteração detectada em ${event.entityType}. Rever os estados antes e depois.`, isCritical: true };
  return { level: "NORMAL", label: "Normal", reason: "Evento informativo sem alteração crítica identificada.", isCritical: false };
}

export function auditRiskBadgeClass(level: AuditRiskLevel) {
  if (level === "CRITICAL") return "border-red-300 bg-red-50 text-red-800";
  if (level === "HIGH") return "border-amber-300 bg-amber-50 text-amber-800";
  return "border-slate-300 bg-slate-50 text-slate-700";
}
