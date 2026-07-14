import type { MetadataRoute } from "next";

// Web app manifest — makes the site installable as a standalone PWA. On Android
// Chrome, "Add to Home screen" then launches it fullscreen (no browser chrome)
// with the icon and colors below. Next serves this at /manifest.webmanifest.
export default function manifest(): MetadataRoute.Manifest {
  return {
    // short_name is the launcher label (what shows under the home-screen icon);
    // name is the fuller in-app title, per the shared design-system rules (§7).
    name: "company-profiler — company profiling",
    short_name: "corp-profiler",
    description:
      "Research a company on the live web and get a clean, sourced profile for interview prep.",
    // Canonical, unversioned identity (§7). Google mints WebAPKs server-side and
    // caches them by (origin, id/start_url); id defaults to start_url. Moving
    // from the old "/?v=12" query to a plain "/" is itself a new identity, so
    // installed apps re-mint once and pick up the new connected-nodes icon and
    // name — after which no more version bumping is needed.
    start_url: "/",
    display: "standalone",
    background_color: "#0f120d", // --bg (one step darker than the icon plate --surface #1d231c)
    theme_color: "#0f120d",      // --bg
    // Icons are the committed PNGs rendered from public/icon.svg: a sage
    // (#7D9B83) line-mark of three connected nodes (company-profiling motif) on
    // a solid --surface (#1D231C) plate that reaches every corner. Per §7 the
    // mark is a stroke drawing (fill="none", 28px dominant node stroke, lighter
    // connectors, rounded caps/joins), with a single small --text highlight. The
    // mark stays inside the maskable safe zone, so a circular crop reveals only
    // the dark plate. Each size is listed as both "any" and "maskable".
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
