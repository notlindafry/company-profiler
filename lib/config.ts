// ---------------------------------------------------------------------------
// Easy-to-change settings live here.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Selectable research models. Each run lets the user pick how "expensive" the
// analysis is: Opus is the most capable (and priciest); Sonnet is faster and
// cheaper. The client sends only the short `tier` keyword — never a raw model
// ID — and the server resolves it through `resolveModel` so an untrusted value
// can never become an arbitrary model string.
// ---------------------------------------------------------------------------
export type ModelTier = "opus" | "sonnet";

// Reasoning/output effort passed to each model call.
export type EffortLevel = "low" | "medium" | "high";

export interface ModelOption {
  tier: ModelTier;
  id: string; // exact Anthropic model ID sent to the API
  label: string; // shown in the selector
  blurb: string; // short cost / capability hint
  // Per-tier cost/depth knobs, so the selector dials more than just the model:
  effort: EffortLevel; // reasoning effort per call
  maxWebSearches: number; // web_search max_uses per search pass (~2 passes total)
  thorough: boolean; // true = deep-research prompt (fill every section, dig for facts);
  // false = fast prompt (handful of searches, partial profile is fine)
}

// Order = display order in the UI.
export const MODEL_OPTIONS: ModelOption[] = [
  {
    tier: "sonnet",
    id: "claude-sonnet-4-6",
    label: "Sonnet 4.6",
    blurb: "Faster and cheaper — lighter research, solid for most lookups",
    effort: "medium",
    maxWebSearches: 5,
    thorough: false,
  },
  {
    tier: "opus",
    id: "claude-opus-4-8",
    label: "Opus 4.8",
    blurb: "Most capable, most expensive — deeper reasoning and more searches",
    effort: "high",
    maxWebSearches: 9,
    thorough: true,
  },
];

// Used when the client omits a model or sends an unrecognized one.
export const DEFAULT_MODEL_TIER: ModelTier = "sonnet";

// Map an untrusted tier value to a known ModelOption, falling back to the
// default. Always returns a valid option, so callers never see a bad model ID.
export function resolveModel(tier: unknown): ModelOption {
  return (
    MODEL_OPTIONS.find((m) => m.tier === tier) ??
    MODEL_OPTIONS.find((m) => m.tier === DEFAULT_MODEL_TIER)!
  );
}

// How many web searches Claude may run per search pass is set per model tier
// (see MODEL_OPTIONS.maxWebSearches above). The search phase is bounded to 2
// passes (see lib/research.ts), so total searches are capped around 2x that —
// keeping heavy subjects within the time limit.

// Limit research to materials from roughly the last N years. Foundational/
// historical facts (company founding & IPO date, education, career history) are
// exempt from this limit — see lib/prompt.ts.
export const RECENCY_YEARS = 5;

// ---------------------------------------------------------------------------
// Abuse / cost guards. Each profile run is expensive (Claude + web searches +
// minutes of compute), so the API is rate-limited per client IP. Tune to taste.
// These are enforced in lib/ratelimit.ts; see the note there about in-memory
// (per-instance) limits on serverless.
// ---------------------------------------------------------------------------

// Research endpoint: at most PROFILE_RATE_LIMIT runs per window, and no more
// than PROFILE_MAX_CONCURRENT in flight at once, per IP.
export const PROFILE_RATE_LIMIT = 10;
export const PROFILE_RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
export const PROFILE_MAX_CONCURRENT = 2;

// Process-wide backstop, independent of client IP. The per-IP guards above key
// off X-Forwarded-For, which a client can spoof to rotate "IPs" and slip the
// per-IP caps — so these bound total spend per running instance regardless of
// the claimed IP (and regardless of whether the password gate is enabled).
// Generous enough for a handful of real users; tune down to cap cost harder.
export const PROFILE_GLOBAL_RATE_LIMIT = 40; // runs per PROFILE_RATE_WINDOW_MS
export const PROFILE_GLOBAL_MAX_CONCURRENT = 4; // simultaneous runs per instance

// Login endpoint: throttle password attempts per IP to blunt brute forcing.
export const LOGIN_RATE_LIMIT = 8;
export const LOGIN_RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// How long to reuse a previously researched profile for an identical request
// (same company + detail) before re-running the pipeline.
export const RESULT_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

// ---------------------------------------------------------------------------
// Make it your own — personalization read from environment variables.
//
// None of your identity is baked into the code. Each deployment supplies its
// own name, background, and (optional) advisory angle through environment
// variables, so anyone can stand up their own copy WITHOUT editing any files —
// see the README ("Make it your own") for the one-click setup. The values below
// are only safe, generic fallbacks used when a variable is left unset.
// ---------------------------------------------------------------------------

// Your display name. Shown as "<name>'s Company Profiler" in the page header and
// the browser tab. NEXT_PUBLIC_ so the browser UI can read it; falls back to a
// generic title when unset.
export const OWNER_NAME = (process.env.NEXT_PUBLIC_OWNER_NAME ?? "").trim();

// The title shown in the header and the browser tab.
export const APP_TITLE = OWNER_NAME
  ? `${OWNER_NAME}'s Company Profiler`
  : "Company Profiler";

// Optional second lens. By default every profile evaluates a company through ONE
// lens — a potential full-time role — which is what most job searches want. Set
// NEXT_PUBLIC_ENABLE_ADVISORY_LENS to "true" to ALSO get a second "advisory /
// consulting client" read on each company (useful if you also do fractional or
// consulting work).
export const ADVISORY_LENS_ENABLED =
  (process.env.NEXT_PUBLIC_ENABLE_ADVISORY_LENS ?? "").trim().toLowerCase() ===
  "true";

// Optional name to show for the advisory lens (e.g. your practice's name, like
// "Acme Advisory"). Only used when the advisory lens is enabled; falls back to
// a generic "advisory / consulting" label when unset.
export const ADVISORY_NAME = (process.env.NEXT_PUBLIC_ADVISORY_NAME ?? "").trim();

// ---------------------------------------------------------------------------
// "About me" — used ONLY to tailor the closing "Fit & Angle" section of each
// profile to your background. It is read from the ABOUT_ME environment variable
// (server-only — never sent to the browser), so your personal details stay out
// of the code. Paste a short summary of yourself: your level / seniority, the
// kind of role you want, your field or function, what makes a company a good
// fit, and your location or remote preference.
// ---------------------------------------------------------------------------
const ABOUT_ME_FALLBACK = `
- Set the ABOUT_ME environment variable to your own background to personalize
  the "Fit & Angle" section.
- Include: your level / seniority, the kind of role you're looking for, your
  field or function, what makes a company a good fit for you, and your location
  or remote preference.
`.trim();

export const ABOUT_ME = (process.env.ABOUT_ME ?? "").trim() || ABOUT_ME_FALLBACK;
