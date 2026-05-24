import { cookies } from "next/headers";
import {
  COOKIE_NAME,
  expectedToken,
  passwordMatches,
  isGateEnabled,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  // No password configured — nothing to log into.
  if (!isGateEnabled()) {
    return Response.json({ ok: true });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const { password } = (body ?? {}) as { password?: string };

  if (!password || !passwordMatches(password)) {
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
