import { cookies } from "next/headers";
import { COOKIE_NAME } from "@/lib/auth";

export const runtime = "nodejs";

// Ends the session by expiring the auth cookie. The cookie is httpOnly, so it
// can only be cleared from the server. We overwrite it with an empty value and
// maxAge 0, matching the attributes used when it was set, so the browser drops
// it. Safe to call even when no gate is configured — it just clears any stray
// cookie. After this the page re-renders behind the password gate.
export async function POST() {
  const store = await cookies();
  store.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return Response.json({ ok: true });
}
