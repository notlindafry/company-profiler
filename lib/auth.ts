import crypto from "crypto";

// Name of the cookie that marks a visitor as "logged in".
export const COOKIE_NAME = "trp_auth";

// Static salt so the stored cookie value isn't a bare hash of the password.
const SALT = "tech-risk-profiler:v1";

// The gate is ON only when APP_PASSWORD is set. If it's unset, the app stays
// open (handy for local dev) — set APP_PASSWORD in Vercel to require a password.
export function isGateEnabled(): boolean {
  return !!process.env.APP_PASSWORD;
}

// The value we store in the cookie when a visitor logs in successfully. It's a
// hash of the password, so the raw password is never written to the cookie.
export function expectedToken(): string {
  const password = process.env.APP_PASSWORD ?? "";
  return crypto.createHash("sha256").update(`${SALT}:${password}`).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export function passwordMatches(input: string): boolean {
  const password = process.env.APP_PASSWORD ?? "";
  if (!password) return false;
  return safeEqual(input, password);
}

export function tokenIsValid(token: string | undefined): boolean {
  if (!token) return false;
  return safeEqual(token, expectedToken());
}

// A request may run research when the gate is off, or a valid cookie is present.
export function isAuthorized(token: string | undefined): boolean {
  if (!isGateEnabled()) return true;
  return tokenIsValid(token);
}
