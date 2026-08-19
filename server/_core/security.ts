import type { RequestHandler } from "express";

type Bucket = { startedAt: number; count: number };

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 180;

export const securityHeaders: RequestHandler = (req, res, next) => {
  const incomingRequestId = req.headers["x-request-id"];
  const requestId = (Array.isArray(incomingRequestId) ? incomingRequestId[0] : incomingRequestId)?.replace(/[^a-zA-Z0-9._:-]/g, "").slice(0, 80) || `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  res.setHeader("X-Request-Id", requestId);
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
    res.status(429).json({ error: "TOO_MANY_REQUESTS", message: "Demasiados pedidos. Tente novamente dentro de instantes." });
    return;
  }
  next();
};

export function resetSecurityBucketsForTests() {
  buckets.clear();
}
