import { describe, expect, it, beforeEach, vi } from "vitest";
import { apiRateLimit, getRuntimeMetrics, resetSecurityBucketsForTests, securityHeaders } from "./_core/security";

describe("hardening de segurança HTTP", () => {
  beforeEach(() => resetSecurityBucketsForTests());

  it("aplica headers de segurança sem depender do ambiente", () => {
    const headers = new Map<string, string>();
    const res = { removeHeader: vi.fn(), setHeader: vi.fn((name: string, value: string) => headers.set(name, value)) } as any;
    const next = vi.fn();
    securityHeaders({ headers: {} } as any, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });

  it("expõe métricas operacionais sem conteúdo de pedidos", () => {
    const metrics = getRuntimeMetrics();
    expect(metrics.requests).toBe(0);
    expect(metrics.responses5xx).toBe(0);
    expect(metrics).not.toHaveProperty("body");
  });

  it("limita pedidos repetidos para a mesma origem e rota", () => {
    const next = vi.fn();
    const status = vi.fn().mockReturnThis();
    const json = vi.fn();
    const res = { setHeader: vi.fn(), status, json } as any;
    const req = { path: "/api/trpc", socket: { remoteAddress: "127.0.0.1" }, headers: {} } as any;
    for (let index = 0; index < 180; index += 1) apiRateLimit(req, res, next);
    apiRateLimit(req, res, next);
    expect(next).toHaveBeenCalledTimes(180);
    expect(status).toHaveBeenCalledWith(429);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ error: "TOO_MANY_REQUESTS" }));
  });
});
