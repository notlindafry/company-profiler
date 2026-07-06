/** @type {import('next').NextConfig} */
const nextConfig = {
  // Belt-and-suspenders noindex: send the header on every response EXCEPT the
  // PWA manifest and icon files. Chrome fetches those when it mints the
  // installed WebAPK, so we keep them free of extra headers. Page-level noindex
  // is unaffected — it still comes from this header on all HTML routes plus the
  // <meta robots> tag; the icons carry nothing sensitive.
  async headers() {
    return [
      {
        source: "/((?!manifest\\.webmanifest|icon-|apple-touch-icon).*)",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;
