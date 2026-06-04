"use client";

import { useEffect, useState } from "react";
import type { CompanyProfile } from "@/lib/schema";
import {
  MODEL_OPTIONS,
  DEFAULT_MODEL_TIER,
  type ModelTier,
} from "@/lib/config";
import CompanyView from "@/components/CompanyView";

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function Profiler() {
  const [company, setCompany] = useState("");
  const [detail, setDetail] = useState("");
  const [model, setModel] = useState<ModelTier>(DEFAULT_MODEL_TIER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompanyProfile | null>(null);
  // Date the current result was queried, used for the PDF/print file name.
  const [queryDate, setQueryDate] = useState<string | null>(null);
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
    // Stamp the query with today's date (local), e.g. "2026-06-03".
    setQueryDate(new Date().toLocaleDateString("en-CA"));

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, detail, model }),
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  // Browsers seed the "Save as PDF" file name from document.title. Swap in
  // "<company> - <query date>" for the duration of the print dialog, then
  // restore the original title afterward.
  function handlePrint() {
    const previousTitle = document.title;
    if (result) {
      const date = queryDate ?? new Date().toLocaleDateString("en-CA");
      // Strip characters that are illegal in file names on common OSes.
      const safeName =
        result.name.replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim() ||
        "Company Profile";
      document.title = `${safeName} - ${date}`;
    }
    const restore = () => {
      document.title = previousTitle;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      {/* Header + form (hidden when printing) */}
      <div className="no-print">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-strong)]">
          Company Profiler
        </h1>
        <p className="mt-2 text-[var(--text-muted)]">
          Enter a company and we&apos;ll research it on the live web — products,
          milestones, controversies, SEC and regulatory filings, major customers —
          and return a clean, sourced profile. Every profile closes with three{" "}
          <em>Fit &amp; Angle</em> reads: as a full-time (W2) role, as a Second Line
          Labs advisory client, and as a network relationship.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm"
        >
          <div>
            <label
              htmlFor="company"
              className="block text-sm font-medium text-[var(--text)]"
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
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text-strong)] placeholder:text-[var(--text-muted)] shadow-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-60"
            />
          </div>

          <div className="mt-4">
            <label
              htmlFor="detail"
              className="block text-sm font-medium text-[var(--text)]"
            >
              Website or ticker{" "}
              <span className="font-normal text-[var(--text-muted)]">(optional)</span>
            </label>
            <input
              id="detail"
              type="text"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="e.g. acme.com or NASDAQ: ACME"
              disabled={loading}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[var(--text-strong)] placeholder:text-[var(--text-muted)] shadow-sm focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-60"
            />
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Helps pin the exact company when the name is generic (a website is
              the most precise).
            </p>
          </div>

          {/* Model selector — controls how "expensive" the analysis is. */}
          <fieldset className="mt-4" disabled={loading}>
            <legend className="block text-sm font-medium text-[var(--text)]">
              Analysis depth{" "}
              <span className="font-normal text-[var(--text-muted)]">(controls cost)</span>
            </legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {MODEL_OPTIONS.map((opt) => {
                const selected = model === opt.tier;
                return (
                  <label
                    key={opt.tier}
                    className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 shadow-sm transition ${
                      selected
                        ? "border-[var(--accent)] bg-[var(--surface-2)] ring-1 ring-[var(--accent)]"
                        : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]"
                    } ${loading ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    <input
                      type="radio"
                      name="model"
                      value={opt.tier}
                      checked={selected}
                      onChange={() => setModel(opt.tier)}
                      disabled={loading}
                      className="mt-0.5 h-4 w-4 accent-[var(--accent)] focus:ring-[var(--accent)]"
                    />
                    <span>
                      <span className="block text-sm font-medium text-[var(--text-strong)]">
                        {opt.label}
                      </span>
                      <span className="block text-xs text-[var(--text-muted)]">
                        {opt.blurb}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 inline-flex items-center rounded-lg bg-[var(--accent)] px-4 py-2 font-medium text-white shadow-sm transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Researching…" : "Research company"}
          </button>
        </form>

        {error && (
          <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading && (
          <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
              <p className="text-[var(--text)]">
                Searching the live web and building the company profile… this
                usually takes a few minutes, so hang tight — you can leave this
                tab open.{" "}
                <span className="whitespace-nowrap text-[var(--text-muted)]">
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
              onClick={handlePrint}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text)] shadow-sm hover:bg-[var(--surface-2)]"
            >
              Print / Save as PDF
            </button>
          </div>
          <CompanyView profile={result} />
        </div>
      )}
    </main>
  );
}
