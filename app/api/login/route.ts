import { cookies } from "next/headers";
import {
  COOKIE_NAME,
  expectedToken,
  passwordMatches,
  isGateEnabled,
} from "@/lib/auth";
import { LOGIN_RATE_LIMIT, LOGIN_RATE_WINDOW_MS } from "@/lib/config";
import { rateLimit, clientIp } from "@/lib/ratelimit";
import { readJsonBody, MAX_PASSWORD_LEN } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // No password configured — nothing to log into.
  if (!isGateEnabled()) {
    return Response.json({ ok: true });
  }

  // Throttle password attempts per IP to blunt online brute forcing.
  const ip = clientIp(req);
  const limited = rateLimit(`login:${ip}`, LOGIN_RATE_LIMIT, LOGIN_RATE_WINDOW_MS);
  if (!limited.ok) {
    return Response.json(
      { error: "Too many attempts. Please wait and try again." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
  }

  const body = await readJsonBody(req);
  if (!body.ok) {
    return Response.json({ error: body.error }, { status: body.status });
  }

  const { password } = (body.data ?? {}) as { password?: string };

  if (
    !password ||
    typeof password !== "string" ||
    password.length > MAX_PASSWORD_LEN ||
    !passwordMatches(password)
  ) {
    return Response.json({ error: "Incorrect password." }, { status: 401 });
  }

  const store = await cookies();
  store.set(COOKIE_NAME, expectedToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return Response.json({ ok: true });
}
