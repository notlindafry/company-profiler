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
    // Explicit app identity. Without an `id`, Chrome derives one from start_url
    // ("/"), so a phone that already installed the app keeps reviving that same
    // cached WebAPK — including its stale, white-inset icon — every time it's
    // re-added. Giving the app a distinct `id` makes Chrome treat this as a new
    // app and mint a fresh WebAPK (with the full-bleed maskable icon) instead
    // of resurrecting the old one. start_url stays "/" so it still opens the
    // app home; only the identity used for install/update matching changes.
    id: "/?app=profiler",
    start_url: "/",
    display: "standalone",
    background_color: "#0f120d",
    theme_color: "#0f120d",
    orientation: "portrait",
    // Icons are rendered from public/icon.svg as full-bleed RGBA PNGs (a solid
    // green field with the buildings centered inside the maskable safe zone).
    // The alpha channel matters: Android/Chrome recognise an RGBA maskable icon
    // as a proper adaptive icon and paint it edge-to-edge, whereas a flat RGB
    // icon was being treated as a legacy icon and inset on a white circle —
    // that was the source of the white padding. Each size is listed as both
    // "any" and "maskable" (same file) so launchers that crop to a circle use
    // the full-bleed art and other contexts still render it. Filenames are
    // versioned (-v4) so the new icon lands at a fresh URL, past any cache.
    icons: [
      { src: "/icon-192-v4.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-192-v4.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512-v4.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512-v4.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
