// Shown when the app is deployed to production with no APP_PASSWORD set. Rather
// than silently serving an open, billable app, we fail closed and explain how to
// finish setup. Server component — no client state needed.
export default function SetupNotice() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Setup required</h1>
        <p className="mt-2 text-sm text-slate-700">
          This app is deployed without a password, so it&apos;s disabled to keep
          your Anthropic API key from being used by the public.
        </p>
        <p className="mt-3 text-sm text-slate-700">
          Set an <code className="rounded bg-amber-100 px-1 py-0.5">APP_PASSWORD</code>{" "}
          environment variable (Vercel → Settings → Environment Variables) for the
          Production environment, then redeploy. Once set, visitors must enter that
          password before they can run any research.
        </p>
      </div>
    </main>
  );
}
