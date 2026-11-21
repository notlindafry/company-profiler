import { cookies } from "next/headers";
import { COOKIE_NAME, revokeToken, sessionCookieOptions } from "@/lib/auth";
import { LOGOUT_RATE_LIMIT, LOGOUT_RATE_WINDOW_MS } from "@/lib/config";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const runtime = "nodejs";

// Ends the session: revokes the token server-side (see the SECURITY TODO in
// lib/auth.ts about the per-instance deny-list) and expires the httpOnly cookie
// with the same attributes used when it was set, so the browser drops it. Safe
// to call even when no gate is configured — it just clears any stray cookie.
export async function POST(req: Request) {
  const limited = rateLimit(`logout:${clientIp(req)}`, LOGOUT_RATE_LIMIT, LOGOUT_RATE_WINDOW_MS);
  if (!limited.ok) {
    return Response.json(
      { error: "Too many requests. Please wait and try again." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
  }

  const store = await cookies();
  revokeToken(store.get(COOKIE_NAME)?.value);
  store.set(COOKIE_NAME, "", sessionCookieOptions(0));

  return Response.json({ ok: true });
}
