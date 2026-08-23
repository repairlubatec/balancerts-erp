export type AuditReviewStatus = "OPEN" | "REVIEWED" | "RESOLVED";
export type AuditReviewTarget = Exclude<AuditReviewStatus, "OPEN">;

export function evaluateAuditReviewTransition(current: AuditReviewStatus, target: AuditReviewTarget) {
  if (current === target) return { allowed: true, idempotent: true } as const;
  if (current === "RESOLVED") return { allowed: false, idempotent: false } as const;
  if (current === "OPEN" && (target === "REVIEWED" || target === "RESOLVED")) return { allowed: true, idempotent: false } as const;
  if (current === "REVIEWED" && target === "RESOLVED") return { allowed: true, idempotent: false } as const;
  return { allowed: false, idempotent: false } as const;
}
