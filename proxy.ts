import { NextResponse, type NextRequest } from "next/server";

// Runs before every matched request (Next.js 16 "proxy", formerly middleware).
//
// 1. Pages: a strict, per-request nonce Content-Security-Policy. Next.js reads
//    the nonce from the request's CSP header and applies it to its own scripts
//    (see node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md).
//    The home page reads cookies, so it is already dynamically rendered, which
//    nonces require.
// 2. API writes: reject cross-origin browser requests (CSRF defense in depth on
//    top of the SameSite=Lax session cookie).

function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";
  return [
    "default-src 'self'",
    // 'unsafe-eval' only in dev: React uses eval for debug stack reconstruction.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "connect-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  // Non-browser clients often send no Origin; they still need a valid session
  // cookie, so absence alone is not a reason to block.
  if (!origin) return true;
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  const hosts = [request.headers.get("x-forwarded-host"), request.headers.get("host")];
  return hosts.some((h) => h && h.split(",")[0].trim() === originHost);
}

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const method = request.method.toUpperCase();
    if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS" && !isSameOrigin(request)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
    return NextResponse.next();
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      // Skip static assets and the PWA manifest/icons (kept header-free so
      // Chrome's WebAPK minting is unaffected; see next.config.mjs).
      source:
        "/((?!_next/static|_next/image|favicon.ico|manifest\\.webmanifest|icon-|icon\\.svg|apple-touch-icon).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
