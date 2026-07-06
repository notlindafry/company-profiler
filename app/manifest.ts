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
    // Filenames are versioned (-v3) so a new icon lands at a fresh URL and
    // isn't served from Chrome's or the CDN's cache of the previous icon. The
    // bump also forces Android Chrome to re-mint the installed WebAPK, so a
    // home-screen icon that was baked before these full-bleed icons existed
    // (and therefore drawn inset on a white circle) gets replaced.
    //
    // Each full-bleed icon carries the combined purpose "any maskable" in a
    // single entry, rather than the same file listed twice under separate
    // "any" and "maskable" purposes: Chrome de-dupes icons by src, and with
    // two entries sharing one src it can register only the first ("any") and
    // drop the maskable purpose — which is what makes the launcher fall back
    // to the white-padded, inset icon. The mark sits inside the maskable safe
    // zone, so the icon fills the adaptive shape edge-to-edge with no padding.
    icons: [
      { src: "/icon-192-v3.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
      { src: "/icon-512-v3.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
    ],
  };
}
