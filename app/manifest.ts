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
    // PNGs: a green corporate skyline where the GREEN field reaches every corner
    // (no white, no transparency) and the towers sit inside the maskable safe
    // zone (central ~205px-radius circle). This is the whole fix: Android crops
    // the installed tile to a circle, and a full-bleed icon fills that circle
    // with green edge-to-edge. A white/transparent background would fill the
    // circle with white — that was the earlier bug. Each size is listed as both
    // "any" and "maskable" with the same src; Chrome's manifest parser keeps
    // each entry's purpose, so the maskable icon is selected for the adaptive
    // tile while "any" covers non-maskable contexts. Filenames are versioned
    // (-v7) so the new icon lands at a fresh URL, past any cache.
    icons: [
      { src: "/icon-192-v7.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-192-v7.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512-v7.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512-v7.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
