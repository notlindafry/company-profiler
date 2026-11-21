import crypto from "crypto";

// Name of the cookie that marks a visitor as "logged in".
export const COOKIE_NAME = "trp_auth";

// How long a session lasts. Enforced server-side by the expiry signed into the
// token (not just by the cookie's maxAge, which a client can ignore).
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

// Token format: "v2.<expUnixSeconds>.<randomId>.<hmac>". The HMAC covers the
// version, expiry and id, so none of them can be altered without the key.
const TOKEN_VERSION = "v2";

// The gate is ON only when APP_PASSWORD is set. If it's unset, the app stays
// open (handy for local dev) — set APP_PASSWORD in Vercel to require a password.
export function isGateEnabled(): boolean {
  return !!process.env.APP_PASSWORD;
}

// ---------------------------------------------------------------------------
// Signing key.
//
// Preferred: SESSION_SECRET (a long random value, e.g. `openssl rand -hex 32`).
// Fallback: a key derived from APP_PASSWORD with scrypt (deliberately slow), so
// a leaked cookie can't be used to cheaply brute-force the password offline the
// way the old bare-SHA-256 cookie could.
//
// Either way, the key also mixes in APP_PASSWORD, so CHANGING THE PASSWORD
// INVALIDATES EVERY EXISTING SESSION. That is the "log out everywhere" lever.
// ---------------------------------------------------------------------------
const KDF_SALT = "company-profiler:session-key:v2";
let cachedKey: { material: string; key: Buffer } | null = null;

function signingKey(): Buffer {
  const password = process.env.APP_PASSWORD ?? "";
  const secret = process.env.SESSION_SECRET ?? "";
  const material = `${secret}\u0000${password}`;
  if (cachedKey && cachedKey.material === material) return cachedKey.key;

  const key =
    secret.length >= 32
      ? crypto.createHmac("sha256", secret).update(`${KDF_SALT}:${password}`).digest()
      : // scrypt defaults (N=16384, r=8, p=1) — runs once per process, then cached.
        crypto.scryptSync(password, KDF_SALT, 32);
  cachedKey = { material, key };
  return key;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", signingKey()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  // Hash both sides to fixed-length digests before comparing. This keeps the
  // comparison constant-time (timingSafeEqual needs equal-length buffers) while
  // avoiding a length-based early return that would leak the secret's length.
  const ab = crypto.createHash("sha256").update(a).digest();
  const bb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ab, bb);
}

export function passwordMatches(input: string): boolean {
  const password = process.env.APP_PASSWORD ?? "";
  if (!password) return false;
  return safeEqual(input, password);
}

// Mint a fresh, unique, expiring session token for a successful login.
export function issueToken(): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const id = crypto.randomBytes(16).toString("base64url");
  const payload = `${TOKEN_VERSION}.${exp}.${id}`;
  return `${payload}.${sign(payload)}`;
}

type ParsedToken = { id: string; exp: number };

// Verify signature and expiry. Returns the parsed token, or null if invalid.
function verifyToken(token: string | undefined): ParsedToken | null {
  if (!token || token.length > 256) return null;
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== TOKEN_VERSION) return null;
  const [version, expRaw, id, mac] = parts;
  if (!safeEqual(mac, sign(`${version}.${expRaw}.${id}`))) return null;
  const exp = Number(expRaw);
  if (!Number.isInteger(exp) || exp <= Math.floor(Date.now() / 1000)) return null;
  if (isRevoked(id)) return null;
  return { id, exp };
}

// ---------------------------------------------------------------------------
// Revocation on logout.
//
// SECURITY TODO: this deny-list lives in process memory. On serverless each
// instance has its own copy, so a logged-out token is rejected by the instance
// that handled the logout (and the browser drops the cookie), but another warm
// instance could still accept a COPIED token until it expires. For strict
// server-side revocation, back this with a shared store (e.g. Vercel KV /
// Upstash Redis) keyed by token id with a TTL of the token's remaining life.
// Until then, rotating APP_PASSWORD (or SESSION_SECRET) revokes all sessions.
// ---------------------------------------------------------------------------
const revoked = new Map<string, number>(); // id -> exp (unix seconds)

function isRevoked(id: string): boolean {
  const exp = revoked.get(id);
  if (exp === undefined) return false;
  if (exp <= Math.floor(Date.now() / 1000)) {
    revoked.delete(id);
    return false;
  }
  return true;
}

export function revokeToken(token: string | undefined): void {
  const parsed = verifyToken(token);
  if (!parsed) return;
  if (revoked.size >= 10_000) {
    const now = Math.floor(Date.now() / 1000);
    for (const [k, exp] of revoked) if (exp <= now) revoked.delete(k);
  }
  revoked.set(parsed.id, parsed.exp);
}

export function tokenIsValid(token: string | undefined): boolean {
  return verifyToken(token) !== null;
}

// A request may run research when the gate is off, or a valid cookie is present.
export function isAuthorized(token: string | undefined): boolean {
  if (!isGateEnabled()) return true;
  return tokenIsValid(token);
}

// Cookie attributes shared by login (set) and logout (clear), so they match.
export function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

// Fail-closed guard: in production we refuse to serve an OPEN (no-password) app,
// since that silently exposes the owner's billable API key to the public. Local
// development stays open for convenience. When true, the API blocks research and
// the page shows a setup notice instead of running unprotected.
export function isUnprotectedInProd(): boolean {
  return process.env.NODE_ENV === "production" && !isGateEnabled();
}
