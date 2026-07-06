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
    // Icons are rendered from public/icon.svg as full-bleed RGBA PNGs: dark
    // buildings on a WHITE field. The white background is deliberate — the
    // launcher on the target device insets web-app icons onto a white circle
    // instead of honouring the maskable icon edge-to-edge, so a white-backed
    // icon blends into that circle seamlessly (no visible ring) rather than
    // showing a coloured square floating in white. Each size is still listed as
    // both "any" and "maskable" (same file) so launchers that DO crop to a
    // circle render it full-bleed too. Filenames are versioned (-v5) so the new
    // icon lands at a fresh URL, past any cache.
    icons: [
      { src: "/icon-192-v5.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-192-v5.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512-v5.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512-v5.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
