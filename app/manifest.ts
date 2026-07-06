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
    // Filenames are versioned (-v3) so a new icon lands at a fresh URL and
    // isn't served from Chrome's or the CDN's cache of the previous icon. The
    // bump also forces Android Chrome to re-mint the installed WebAPK, so a
    // home-screen icon that was baked before these full-bleed icons existed
    // (and therefore drawn inset on a white circle) gets replaced.
    //
    // The "maskable" icon is served under its OWN filename, distinct from the
    // "any" icon, rather than listing the same src twice under two purposes:
    // Chrome de-dupes icons by src, and with two entries sharing one src it can
    // register only the first ("any") and drop the maskable purpose — which is
    // what makes the launcher fall back to the white-padded, inset icon. Giving
    // each purpose its own URL removes that ambiguity. (Next's manifest type
    // only allows a single purpose per entry, so the spec's space-separated
    // "any maskable" isn't an option here.) The files are byte-identical: the
    // icon is full-bleed with its mark inside the maskable safe zone, so it
    // fills the adaptive shape edge-to-edge with no padding.
    icons: [
      { src: "/icon-192-v3.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512-v3.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-192-maskable-v3.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512-maskable-v3.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
