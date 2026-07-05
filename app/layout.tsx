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
