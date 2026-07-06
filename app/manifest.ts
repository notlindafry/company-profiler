import type { MetadataRoute } from "next";

// Web app manifest — makes the site installable as a standalone PWA. On Android
// Chrome, "Add to Home screen" then launches it fullscreen (no browser chrome)
// with the icon and colors below. Next serves this at /manifest.webmanifest.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Linda's Company Profiler",
    short_name: "Profiler",
    description:
      "Research a company on the live web and get a clean, sourced profile for interview prep.",
    // Fresh app identity. Google mints WebAPKs server-side and caches them by
    // (origin, id/start_url). Bumped to "/?v=9" so an earlier "/?v=7" identity
    // (which may already hold a cached mint from today's attempts) is bypassed
    // and Google mints a brand-new WebAPK from the current manifest + icon. The
    // app ignores the query, so launch behaviour at "/?v=9" is unchanged.
    id: "/?v=9",
    start_url: "/?v=9",
    display: "standalone",
    background_color: "#0f120d",
    theme_color: "#0f120d",
    // Icons are rendered from public/icon.svg as full-bleed, fully opaque RGBA
    // PNGs: a sage (#7D9B83) corporate skyline on a dark #1D231C field that
    // reaches every corner (matching the sibling PWA whose tile renders
    // edge-to-edge on the same device). The skyline stays inside the maskable
    // safe zone (a central circle of radius 40% of the width), so a circular
    // crop reveals only the dark field. A full-bleed DARK icon is also
    // diagnostic: if the tile shows a white ring the launcher fell back to the
    // legacy path; a solid dark circle means the adaptive/maskable path worked.
    // Each size is listed as both "any" and "maskable" with the same src.
    icons: [
      { src: "/icon-192-v9.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-192-v9.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512-v9.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512-v9.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
