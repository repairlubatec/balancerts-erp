export type ClosingCheck = { code: string; label: string; passed: boolean; blocking: boolean };

export function evaluatePeriodClose(checks: ClosingCheck[]) {
  const blockers = checks.filter((check) => check.blocking && !check.passed);
  return { canClose: blockers.length === 0, blockers, completed: checks.filter((check) => check.passed).length, total: checks.length };
}

export function validateReopenReason(reason: string | undefined) {
  if (!reason || reason.trim().length < 10) throw new Error("REOPEN_REASON_REQUIRED");
  return reason.trim();
}

export function buildReopenAudit(input: { organizationId: number; companyId: number; periodId: number; actorUserId: number; reason: string; correlationId: string }) {
  return { organizationId: input.organizationId, companyId: input.companyId, actorUserId: input.actorUserId, action: "PERIOD_REOPEN", entityType: "FISCAL_PERIOD", entityId: String(input.periodId), beforeState: JSON.stringify({ state: "CLOSED", periodId: input.periodId }), afterState: JSON.stringify({ state: "REOPEN_REQUESTED", periodId: input.periodId, reason: input.reason }), correlationId: input.correlationId };
}
