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

// Check a fixed window WITHOUT consuming a hit. Pair with rateLimit() to count
// only some outcomes (e.g. only failed logins).
export function peekRateLimit(key: string, limit: number): RateLimitResult {
  const now = Date.now();
  const win = windows.get(key);
  if (!win || now >= win.resetAt || win.count < limit) {
    return { ok: true, retryAfterSeconds: 0 };
  }
  return { ok: false, retryAfterSeconds: Math.ceil((win.resetAt - now) / 1000) };
}

// ---------------------------------------------------------------------------
// Failure lockout with exponential backoff (used for login). After `threshold`
// consecutive failures for a key, the key is locked for baseMs, doubling with
// each further failure up to maxMs. A success clears the record. Records are
// forgotten after `forgetMs` with no new failures.
// ---------------------------------------------------------------------------
type FailureRecord = { failures: number; lockedUntil: number; lastFailureAt: number };
const failureRecords = new Map<string, FailureRecord>();

export interface LockoutPolicy {
  threshold: number;
  baseMs: number;
  maxMs: number;
  forgetMs: number;
}

function liveRecord(key: string, policy: LockoutPolicy, now: number): FailureRecord | undefined {
  const rec = failureRecords.get(key);
  if (rec && now - rec.lastFailureAt > policy.forgetMs && now >= rec.lockedUntil) {
    failureRecords.delete(key);
    return undefined;
  }
  return rec;
}

// Returns whether the key is currently locked out, and for how long.
export function lockoutStatus(key: string, policy: LockoutPolicy): RateLimitResult {
  const now = Date.now();
  const rec = liveRecord(key, policy, now);
  if (rec && now < rec.lockedUntil) {
    return { ok: false, retryAfterSeconds: Math.ceil((rec.lockedUntil - now) / 1000) };
  }
  return { ok: true, retryAfterSeconds: 0 };
}

export function recordFailure(key: string, policy: LockoutPolicy): void {
  const now = Date.now();
  if (failureRecords.size >= 5000) {
    for (const [k, r] of failureRecords) {
      if (now - r.lastFailureAt > policy.forgetMs && now >= r.lockedUntil) failureRecords.delete(k);
    }
  }
  const rec = liveRecord(key, policy, now) ?? { failures: 0, lockedUntil: 0, lastFailureAt: now };
  rec.failures += 1;
  rec.lastFailureAt = now;
  if (rec.failures >= policy.threshold) {
    const exponent = rec.failures - policy.threshold;
    const lockMs = Math.min(policy.maxMs, policy.baseMs * 2 ** Math.min(exponent, 20));
    rec.lockedUntil = now + lockMs;
  }
  failureRecords.set(key, rec);
}

export function clearFailures(key: string): void {
  failureRecords.delete(key);
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
