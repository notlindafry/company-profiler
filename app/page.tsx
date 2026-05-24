"use client";

import { useState } from "react";
import type { ExecutiveProfile } from "@/lib/schema";
import ProfileView from "@/components/ProfileView";

export default function Home() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ExecutiveProfile | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !company.trim()) {
      setError("Please enter both a name and a company.");
      return;
    }
    setLoading(true);
    setError(null);
    setProfile(null);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, company }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Research failed. Please try again.");
      }
      setProfile(data.profile as ExecutiveProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      {/* Header + form (hidden when printing) */}
      <div className="no-print">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Hiring Manager Profiler
        </h1>
        <p className="mt-2 text-slate-600">
          Enter an executive&apos;s name and company. We&apos;ll research them on
          the live web and return a clean, sourced profile for your prep.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-slate-700"
              >
                Executive name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jane Smith"
                disabled={loading}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
              />
            </div>
            <div>
              <label
                htmlFor="company"
                className="block text-sm font-medium text-slate-700"
              >
                Company
              </label>
              <input
                id="company"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Acme Corp"
                disabled={loading}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {loading ? "Researching…" : "Research"}
          </button>
        </form>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
              <p className="text-slate-700">
                Searching the web and building the profile… this usually takes
                20–60 seconds.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Result */}
      {profile && !loading && (
        <div className="mt-8">
          <div className="no-print mb-4 flex justify-end">
            <button
              onClick={() => window.print()}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Print / Save as PDF
            </button>
          </div>
          <ProfileView profile={profile} />
        </div>
      )}
    </main>
  );
}
