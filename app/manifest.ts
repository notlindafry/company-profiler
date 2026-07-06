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
    // (origin, id/start_url). This app's identity was "/" throughout earlier
    // attempts, so Google cached it as a legacy/white-inset build; uninstall +
    // reinstall just re-pulls that cached build (swapping the icon bitmap but
    // keeping the legacy wrapper). Giving it a distinct id/start_url forces a
    // brand-new server mint that evaluates the current full-bleed maskable icon
    // and produces an adaptive (edge-to-edge) tile. The app ignores the query,
    // so launch behaviour at "/?v=7" is unchanged.
    id: "/?v=7",
    start_url: "/?v=7",
    display: "standalone",
    background_color: "#0f120d",
    theme_color: "#0f120d",
    // Icons are rendered from public/icon.svg as full-bleed, fully opaque RGBA
    // PNGs: a dark-green corporate skyline on a WHITE field. The white field is
    // intentional and pragmatic: this device's launcher would not honour the
    // maskable icon edge-to-edge no matter what (verified: even a byte-for-byte
    // match to a working sibling PWA still rendered inset-on-white), so a white
    // background blends into the white circle the launcher draws — leaving a
    // clean tile with no visible ring whether or not the adaptive path is used.
    // Still listed as both "any" and "maskable" so launchers that DO honour it
    // render the same clean white-circle tile. Versioned (-v8) for a fresh URL.
    icons: [
      { src: "/icon-192-v8.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-192-v8.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512-v8.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512-v8.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
