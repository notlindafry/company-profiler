"use client";

import { useEffect, useState } from "react";
import type { CompanyProfile, ProfileIntent } from "@/lib/schema";
import { DEFAULT_INTENT, INTENTS } from "@/lib/schema";
import CompanyView from "@/components/CompanyView";

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function Profiler() {
  const [company, setCompany] = useState("");
  const [detail, setDetail] = useState("");
  const [intent, setIntent] = useState<ProfileIntent>(DEFAULT_INTENT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompanyProfile | null>(null);
  // The intent that produced the displayed result, captured at submit time so the
  // section labels don't shift if the selector is changed after results render.
  const [resultIntent, setResultIntent] = useState<ProfileIntent>(DEFAULT_INTENT);
  const [elapsed, setElapsed] = useState(0);

  // Count up while a lookup runs so the long wait visibly progresses.
  useEffect(() => {
    if (!loading) {
      setElapsed(0);
      return;
    }
    const start = Date.now();
    const id = setInterval(
      () => setElapsed(Math.floor((Date.now() - start) / 1000)),
      1000
    );
    return () => clearInterval(id);
  }, [loading]);

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
        body: JSON.stringify({ company, detail, intent }),
      });

      // Not logged in / session expired — reload to show the password screen.
      if (res.status === 401) {
        window.location.reload();
        return;
      }

      // Errors that happen before streaming starts come back as plain JSON.
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        throw new Error(
          (data && data.error) || "Research failed. Please try again."
        );
      }

      // Read the newline-delimited JSON stream: {"type":"ping"} keep-alives,
      // then a final {"type":"result",...} or {"type":"error",...}.
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalResult: CompanyProfile | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 1);
          if (!line) continue;

          let msg: { type?: string; profile?: CompanyProfile; error?: string };
          try {
            msg = JSON.parse(line);
          } catch {
            continue;
          }

          if (msg.type === "result" && msg.profile) {
            finalResult = msg.profile;
          } else if (msg.type === "error") {
            throw new Error(msg.error || "Research failed. Please try again.");
          }
          // "ping" messages are keep-alives — ignore them.
        }
      }

      if (!finalResult) {
        throw new Error(
          "The research ended without returning a profile. Please try again."
        );
      }
      setResult(finalResult);
      setResultIntent(intent);
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
          Company Profiler
        </h1>
        <p className="mt-2 text-slate-600">
          Enter a company and we&apos;ll research it on the live web — products,
          milestones, controversies, SEC and regulatory filings, major customers —
          and return a clean, sourced profile.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <fieldset>
            <legend className="block text-sm font-medium text-slate-700">
              I&apos;m evaluating this company as…
            </legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {INTENTS.map((opt) => {
                const selected = intent === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer flex-col rounded-lg border p-3 transition ${
                      selected
                        ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                        : "border-slate-300 hover:border-slate-400"
                    } ${loading ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    <input
                      type="radio"
                      name="intent"
                      value={opt.value}
                      checked={selected}
                      disabled={loading}
                      onChange={() => setIntent(opt.value)}
                      className="sr-only"
                    />
                    <span
                      className={`text-sm font-medium ${
                        selected ? "text-blue-700" : "text-slate-800"
                      }`}
                    >
                      {opt.formLabel}
                    </span>
                    <span className="mt-0.5 text-xs text-slate-500">
                      {opt.formHint}
                    </span>
                  </label>
                );
              })}
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Only the closing <em>Fit &amp; Angle</em> section changes — the facts
              stay the same.
            </p>
          </fieldset>

          <div className="mt-4">
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

          <div className="mt-4">
            <label
              htmlFor="detail"
              className="block text-sm font-medium text-slate-700"
            >
              Website or ticker{" "}
              <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="detail"
              type="text"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="e.g. acme.com or NASDAQ: ACME"
              disabled={loading}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
            />
            <p className="mt-1 text-xs text-slate-400">
              Helps pin the exact company when the name is generic (a website is
              the most precise).
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {loading ? "Researching…" : "Research company"}
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
                Searching the live web and building the company profile… this
                usually takes a few minutes, so hang tight — you can leave this
                tab open.{" "}
                <span className="whitespace-nowrap text-slate-400">
                  ({formatElapsed(elapsed)} elapsed)
                </span>
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
          <CompanyView profile={result} intent={resultIntent} />
        </div>
      )}
    </main>
  );
}
