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
// "About me" — used ONLY to tailor the final "Fit & Angle" sections of each
// profile. Every profile produces both Fit & Angle lenses (W2 / advisory); this
// background feeds both, so it carries both the practice and the W2 criteria.
//
// The block below is a GENERIC EXAMPLE ONLY, safe to commit. Your REAL
// background must be supplied at runtime via the ABOUT_ME environment variable
// (server-side only) and must NEVER be committed to this repo — see
// resolveAboutMe() below and .env.example. Editing this constant only changes
// the fallback example shown when ABOUT_ME is unset.
// ---------------------------------------------------------------------------
export const EXAMPLE_ABOUT_ME = `
- Level / domain: Director / Sr. Director / VP — Governance, Risk & Compliance
  (GRC) & Technology Risk. 12+ years.
- Primary lens: a full-time W2 seat. Director / Sr. Director / VP GRC or
  Technology Risk at large, technology-forward companies in regulated spaces —
  mature enough to need a real second-line mandate and a team to lead, not a solo
  IC seat with a fancy title. Remote preferred; open to hybrid.
- Career arc: enterprise IT audit and SOX compliance early on, then a decade
  building and leading second-line risk functions across fintech and SaaS —
  internal controls, third-party risk, and security governance.
- Known for: GRC functions that drive business decisions rather than produce
  paperwork; quantitative risk (FAIR-grounded, built in-house tooling instead of
  buying); AI-native operating models; embedding risk into engineering planning
  rhythms; board reporting that drives engagement; player-coach people leadership.
- Secondary lens: an independent advisory practice — fractional / advisory GRC &
  Technology Risk (standing up or maturing a second line, FAIR-based quantitative
  programs, board- and regulator-ready reporting, AI-native risk operating
  models). Engagements are fractional, project, or advisory-seat.
`.trim();

// Server-only. Reads the real background from the ABOUT_ME env var; falls
// back to the committed generic example. NEVER log or return this value to
// the client — it feeds the system prompt only.
export function resolveAboutMe(): { text: string; isExample: boolean } {
  const fromEnv = process.env.ABOUT_ME?.trim();
  if (fromEnv) return { text: fromEnv, isExample: false };
  return { text: EXAMPLE_ABOUT_ME, isExample: true };
}
