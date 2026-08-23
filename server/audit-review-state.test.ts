import { describe, expect, it } from "vitest";
import { evaluateAuditReviewTransition } from "./audit-review-state";

describe("máquina de estados dos alertas de alto risco", () => {
  it("permite rever um alerta em aberto", () => {
    expect(evaluateAuditReviewTransition("OPEN", "REVIEWED")).toEqual({ allowed: true, idempotent: false });
  });

  it("permite resolver directamente um alerta em aberto", () => {
    expect(evaluateAuditReviewTransition("OPEN", "RESOLVED")).toEqual({ allowed: true, idempotent: false });
  });

  it("permite resolver um alerta já revisto", () => {
    expect(evaluateAuditReviewTransition("REVIEWED", "RESOLVED")).toEqual({ allowed: true, idempotent: false });
  });

  it("trata a mesma transição como idempotente", () => {
    expect(evaluateAuditReviewTransition("REVIEWED", "REVIEWED")).toEqual({ allowed: true, idempotent: true });
    expect(evaluateAuditReviewTransition("RESOLVED", "RESOLVED")).toEqual({ allowed: true, idempotent: true });
  });

  it("impede reabrir um alerta resolvido", () => {
    expect(evaluateAuditReviewTransition("RESOLVED", "REVIEWED")).toEqual({ allowed: false, idempotent: false });
  });
});
