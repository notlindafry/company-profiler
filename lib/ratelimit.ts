// Lightweight, dependency-free rate limiting and concurrency gating.
//
// NOTE: state lives in process memory. On serverless (e.g. Vercel) each warm
// instance keeps its own counters, so this blunts rapid-fire abuse from a reused
// instance but is NOT a strict global guarantee. For hard global limits, back
// these with a shared store (Vercel KV / Upstash Ratelimit). Kept in-memory on
// purpose so the app needs no extra infrastructure to get meaningful protection.

type Window = { count: number; resetAt: number };

const windows = new Map<string, Window>();
const inflight = new Map<string, number>();

// Opportunistically drop expired windows so the map can't grow without bound.
function sweep(now: number): void {
  if (windows.size < 5000) return;
  for (const [key, win] of windows) {
    if (now >= win.resetAt) windows.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds: number;
}

// Fixed-window limiter: at most `limit` hits per `windowMs` for a given key.
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const win = windows.get(key);
  if (!win || now >= win.resetAt) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }

  if (win.count >= limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((win.resetAt - now) / 1000) };
  }

  win.count += 1;
  return { ok: true, retryAfterSeconds: 0 };
}

// Concurrency gate: caps simultaneous in-flight operations for a key. Returns
// true and reserves a slot when under the cap; the caller MUST releaseSlot()
// in a finally block.
export function acquireSlot(key: string, max: number): boolean {
  const current = inflight.get(key) ?? 0;
  if (current >= max) return false;
  inflight.set(key, current + 1);
  return true;
}

export function releaseSlot(key: string): void {
  const current = inflight.get(key) ?? 0;
  if (current <= 1) inflight.delete(key);
  else inflight.set(key, current - 1);
}

// Best-effort client IP from common proxy headers (Vercel sets these). Falls
// back to a shared bucket so a missing header can't bypass limiting entirely.
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}
