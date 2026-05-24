import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hiring Manager Profiler",
  description:
    "Research an executive on the live web and get a clean, sourced profile for interview prep.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
