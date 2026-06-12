import type { Metadata } from "next";
import "./globals.css";
import { APP_TITLE } from "@/lib/config";

export const metadata: Metadata = {
  title: APP_TITLE,
  description:
    "Research a company on the live web and get a clean, sourced profile for interview prep.",
  // Ask search engines not to index or list this site.
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
