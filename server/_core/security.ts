import type { RequestHandler } from "express";

type Bucket = { startedAt: number; count: number };

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 180;
const runtimeMetrics = { startedAt: Date.now(), requests: 0, responses2xx: 0, responses4xx: 0, responses5xx: 0, rateLimited: 0, totalDurationMs: 0 };

export const securityHeaders: RequestHandler = (req, res, next) => {
  const incomingRequestId = req.headers["x-request-id"];
  const requestId = (Array.isArray(incomingRequestId) ? incomingRequestId[0] : incomingRequestId)?.replace(/[^a-zA-Z0-9._:-]/g, "").slice(0, 80) || `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  res.setHeader("X-Request-Id", requestId);
  const startedAt = Date.now();
  runtimeMetrics.requests += 1;
  res.once?.("finish", () => {
    const duration = Date.now() - startedAt;
    runtimeMetrics.totalDurationMs += duration;
    if (res.statusCode >= 500) runtimeMetrics.responses5xx += 1;
    else if (res.statusCode >= 400) runtimeMetrics.responses4xx += 1;
    else runtimeMetrics.responses2xx += 1;
  });
  res.removeHeader("X-Powered-By");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  if (process.env.NODE_ENV !== "development") res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
};

export const apiRateLimit: RequestHandler = (req, res, next) => {
  const forwarded = req.headers["x-forwarded-for"];
  const forwardedAddress = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0]?.trim();
  const key = `${forwardedAddress || req.socket.remoteAddress || "unknown"}:${req.path}`;
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now - bucket.startedAt >= WINDOW_MS) {
    buckets.set(key, { startedAt: now, count: 1 });
    next();
    return;
  }
  bucket.count += 1;
  if (bucket.count > MAX_REQUESTS) {
    const retryAfter = Math.max(1, Math.ceil((WINDOW_MS - (now - bucket.startedAt)) / 1000));
    res.setHeader("Retry-After", String(retryAfter));
    runtimeMetrics.rateLimited += 1;
    res.status(429).json({ error: "TOO_MANY_REQUESTS", message: "Demasiados pedidos. Tente novamente dentro de instantes." });
    return;
  }
  next();
};

export function getRuntimeMetrics() {
  const uptimeMs = Math.max(1, Date.now() - runtimeMetrics.startedAt);
  return { ...runtimeMetrics, uptimeMs, averageDurationMs: Number((runtimeMetrics.totalDurationMs / Math.max(1, runtimeMetrics.requests)).toFixed(2)) };
}

export function resetSecurityBucketsForTests() {
  buckets.clear();
  runtimeMetrics.startedAt = Date.now();
  runtimeMetrics.requests = 0;
  runtimeMetrics.responses2xx = 0;
  runtimeMetrics.responses4xx = 0;
  runtimeMetrics.responses5xx = 0;
  runtimeMetrics.rateLimited = 0;
  runtimeMetrics.totalDurationMs = 0;
}
