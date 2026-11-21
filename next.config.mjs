/** @type {import('next').NextConfig} */
const nextConfig = {
  // Don't advertise the framework in every response.
  poweredByHeader: false,

  // Headers are sent on every response EXCEPT the PWA manifest and icon files.
  // Chrome fetches those when it mints the installed WebAPK, so we keep them
  // free of extra headers; the icons carry nothing sensitive. Page-level noindex
  // still also comes from the <meta robots> tag. The per-request nonce
  // Content-Security-Policy is set in proxy.ts (it can't be static).
  async headers() {
    return [
      {
        source: "/((?!manifest\\.webmanifest|icon-|apple-touch-icon).*)",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          // Browsers ignore HSTS over plain http, so this is harmless locally.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
