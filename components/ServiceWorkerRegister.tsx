"use client";

import { useEffect } from "react";

// Registers the service worker in public/sw.js. This is what makes the app
// installable as a real app on Android (so "Add to Home screen" produces a
// WebAPK with the proper edge-to-edge icon, not a white bookmark badge).
// Renders nothing.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registration failures are non-fatal — the app still works, it just
        // won't be installable. Nothing to surface to the user.
      });
    }
  }, []);

  return null;
}
