import type { MetadataRoute } from "next";

// Web app manifest — makes the site installable as a standalone PWA. On Android
// Chrome, "Add to Home screen" then launches it fullscreen (no browser chrome)
// with the icon and colors below. Next serves this at /manifest.webmanifest.
export default function manifest(): MetadataRoute.Manifest {
  return {
    // short_name is the launcher label (what shows under the home-screen icon);
    // name is the fuller in-app title, per the shared design-system rules (§7).
    name: "company-profiler — company research",
    short_name: "corp-profiler",
    description:
      "Research a company on the live web and get a clean, sourced profile for interview prep.",
    // Fresh app identity. Google mints WebAPKs server-side and caches them by
    // (origin, id/start_url), including the icon bitmap. The redrawn line-mark
    // skyline icon therefore needs a NEW identity — otherwise Google reuses the
    // cached WebAPK (and its old, filled-skyline tile). Bumped "/?v=11" →
    // "/?v=12" so a brand-new WebAPK is minted from the current manifest + icon.
    // The app ignores the query, so launch behaviour at "/?v=12" is unchanged.
    id: "/?v=12",
    start_url: "/?v=12",
    display: "standalone",
    background_color: "#0f120d",
    theme_color: "#0f120d",
    // Icons are rendered from public/icon.svg as full-bleed, fully opaque RGBA
    // PNGs: a sage (#7D9B83) line-drawn city skyline on a solid --surface
    // (#1D231C) plate that reaches every corner. Per the shared design rules
    // (§7) the mark is a stroke drawing (fill="none", 28px dominant stroke,
    // rounded caps/joins), not a filled silhouette. The skyline stays inside the
    // maskable safe zone (a central circle of radius ~40% of the width), so a
    // circular crop reveals only the dark plate. Each size is listed as both
    // "any" and "maskable" with the same src.
    icons: [
      { src: "/icon-192-v9.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-192-v9.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512-v9.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512-v9.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
