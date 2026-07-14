"use client";

import { useState } from "react";

export default function PasswordGate() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Incorrect password.");
      }
      // Reload so the server re-renders the app now that we're logged in.
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h1 className="text-xl font-bold text-[var(--text-strong)]">
          company<span className="text-[var(--accent)]">-</span>profiler
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          This tool is password-protected. Enter the password to continue.
        </p>

        <form onSubmit={handleSubmit} className="mt-4">
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            disabled={loading}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-3 py-2 text-[var(--text-strong)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:shadow-[0_0_0_3px_var(--accent-dim)] disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={loading}
            className="mt-3 w-full rounded-lg bg-[var(--accent)] px-4 py-2 font-medium text-[var(--accent-ink)] transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Checking…" : "Enter"}
          </button>
        </form>

        {error && (
          <div className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}
      </div>
    </main>
  );
}
