import { cookies } from "next/headers";
import {
  COOKIE_NAME,
  SESSION_TTL_SECONDS,
  issueToken,
  passwordMatches,
  isGateEnabled,
  sessionCookieOptions,
} from "@/lib/auth";
import {
  LOGIN_RATE_LIMIT,
  LOGIN_RATE_WINDOW_MS,
  LOGIN_LOCKOUT,
  LOGIN_GLOBAL_FAILURE_LIMIT,
  LOGIN_GLOBAL_FAILURE_WINDOW_MS,
} from "@/lib/config";
import {
  rateLimit,
  peekRateLimit,
  clientIp,
  lockoutStatus,
  recordFailure,
  clearFailures,
} from "@/lib/ratelimit";
import { readJsonBody, MAX_PASSWORD_LEN } from "@/lib/validation";

export const runtime = "nodejs";

const GLOBAL_FAIL_KEY = "login-fail:__global__";

// SECURITY TODO: no CAPTCHA on the login form. The per-IP rate limit, the
// exponential-backoff lockout and the global failure cap below bound online
// guessing; add a challenge (e.g. Cloudflare Turnstile) if this app ever has
// more than a handful of users or sees sustained attack traffic.

function tooMany(retryAfterSeconds: number) {
  return Response.json(
    { error: "Too many attempts. Please wait and try again." },
    { status: 429, headers: { "Retry-After": String(Math.max(1, retryAfterSeconds)) } }
  );
}

export async function POST(req: Request) {
  // No password configured — nothing to log into.
  if (!isGateEnabled()) {
    return Response.json({ ok: true });
  }

  const ip = clientIp(req);
  const lockKey = `login-lock:${ip}`;

  // Locked out after repeated failures (exponential backoff)?
  const locked = lockoutStatus(lockKey, LOGIN_LOCKOUT);
  if (!locked.ok) return tooMany(locked.retryAfterSeconds);

  // Process-wide failed-login backstop (independent of the spoofable IP).
  const globalFails = peekRateLimit(GLOBAL_FAIL_KEY, LOGIN_GLOBAL_FAILURE_LIMIT);
  if (!globalFails.ok) return tooMany(globalFails.retryAfterSeconds);

  // Throttle password attempts per IP (max LOGIN_RATE_LIMIT per window).
  const limited = rateLimit(`login:${ip}`, LOGIN_RATE_LIMIT, LOGIN_RATE_WINDOW_MS);
  if (!limited.ok) return tooMany(limited.retryAfterSeconds);

  const body = await readJsonBody(req);
  if (!body.ok) {
    return Response.json({ error: body.error }, { status: body.status });
  }

  const { password } = (body.data ?? {}) as { password?: unknown };

  if (
    typeof password !== "string" ||
    !password ||
    password.length > MAX_PASSWORD_LEN ||
    !passwordMatches(password)
  ) {
    recordFailure(lockKey, LOGIN_LOCKOUT);
    rateLimit(GLOBAL_FAIL_KEY, LOGIN_GLOBAL_FAILURE_LIMIT, LOGIN_GLOBAL_FAILURE_WINDOW_MS);
    return Response.json({ error: "Incorrect password." }, { status: 401 });
  }

  clearFailures(lockKey);

  // A fresh, random, expiring token per login (see lib/auth.ts).
  const store = await cookies();
  store.set(COOKIE_NAME, issueToken(), sessionCookieOptions(SESSION_TTL_SECONDS));

  return Response.json({ ok: true });
}
