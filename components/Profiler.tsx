"use client";

import { useState } from "react";
import type { ExecutiveProfile, CompanyProfile } from "@/lib/schema";
import ProfileView from "@/components/ProfileView";
import CompanyView from "@/components/CompanyView";

type Result =
  | { kind: "executive"; profile: ExecutiveProfile }
  | { kind: "company"; profile: CompanyProfile };

export default function Profiler() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [detail, setDetail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const mode = name.trim() ? "executive" : "company";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!company.trim()) {
      setError("Please enter a company.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, company, detail }),
      });
      // Session expired or not logged in — reload to show the password screen.
      if (res.status === 401) {
        window.location.reload();
        return;
      }

      // Read the body as text first: a hosting timeout returns a non-JSON error
      // page, and calling res.json() on that throws a confusing parse error.
      const rawText = await res.text();
      let parsed: unknown = null;
      try {
        parsed = rawText ? JSON.parse(rawText) : null;
      } catch {
        parsed = null;
      }

      if (parsed === null) {
        throw new Error(
          res.status === 504 || res.status === 500
            ? "The research ran longer than the time limit and was cut off before it finished — this can happen with very thorough lookups. Try again, or research just the person or just the company on its own."
            : "The server returned an unexpected response. Please try again in a moment."
        );
      }

      if (!res.ok) {
        const errVal = (parsed as { error?: unknown }).error;
        const msg =
          typeof errVal === "string"
            ? errVal
            : errVal
              ? JSON.stringify(errVal)
              : "Research failed. Please try again.";
        throw new Error(msg);
      }

      setResult(parsed as Result);
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
          Tech Risk Profiler
        </h1>
        <p className="mt-2 text-slate-600">
          Enter an executive and their company for a person profile — or leave
          the name blank and enter just a company for a company profile. Either
          way we research the live web and return a clean, sourced result.
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
                Executive name{" "}
                <span className="font-normal text-slate-400">(optional)</span>
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
              <p className="mt-1 text-xs text-slate-400">
                Leave blank to research the company itself.
              </p>
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

          {name.trim() && (
            <div className="mt-4">
              <label
                htmlFor="detail"
                className="block text-sm font-medium text-slate-700"
              >
                Role or identifying detail{" "}
                <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                id="detail"
                type="text"
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="e.g. Chief Risk Officer, or a LinkedIn profile URL"
                disabled={loading}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
              />
              <p className="mt-1 text-xs text-slate-400">
                Helps pick the right person when several share the name (a
                LinkedIn URL is the most precise).
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-4 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {loading
              ? "Researching…"
              : mode === "company"
                ? "Research company"
                : "Research executive"}
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
                Searching the web and building the{" "}
                {mode === "company" ? "company" : "executive"} profile… this
                usually takes 30–90 seconds, sometimes longer for big companies.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Result */}
      {result && !loading && (
        <div className="mt-8">
          <div className="no-print mb-4 flex justify-end">
            <button
              onClick={() => window.print()}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Print / Save as PDF
            </button>
          </div>
          {result.kind === "executive" ? (
            <ProfileView profile={result.profile} />
          ) : (
            <CompanyView profile={result.profile} />
          )}
        </div>
      )}
    </main>
  );
}
