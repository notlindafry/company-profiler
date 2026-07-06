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
    start_url: "/",
    display: "standalone",
    background_color: "#0f120d",
    theme_color: "#0f120d",
    orientation: "portrait",
    // Filenames are versioned (-v2) so a new icon lands at a fresh URL and
    // isn't served from Chrome's or the CDN's cache of the previous icon.
    // Each full-bleed icon is listed as both "any" and "maskable" (same file,
    // its mark sits inside the maskable safe zone) so Chrome uses it as an
    // adaptive, edge-to-edge home-screen icon.
    icons: [
      { src: "/icon-192-v2.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-192-v2.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512-v2.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512-v2.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
