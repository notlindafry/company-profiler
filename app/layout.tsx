import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";

// Shared house fonts (self-hosted at build via next/font, so there's no
// external font request and CSP font-src stays 'self'): Space Grotesk for
// headings/display, Inter for body copy. See app/globals.css for how the
// --font-display / --font-body variables are consumed.
const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Linda's Company Profiler",
  description:
    "Research a company on the live web and get a clean, sourced profile for interview prep.",
  // Ask search engines not to index or list this site.
  robots: { index: false, follow: false },
  // App icons: browser tab favicon + the iOS home-screen icon. The PWA install
  // icons live in app/manifest.ts.
  icons: {
    icon: [
      { url: "/favicon-32-v2.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192-v2.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon-v2.png", sizes: "180x180" }],
  },
  // Let iOS launch it fullscreen (standalone) when added to the home screen.
  appleWebApp: {
    capable: true,
    title: "Profiler",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f120d",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
