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
  },
  {
    tier: "opus",
    id: "claude-opus-4-8",
    label: "Opus 4.8",
    blurb: "Most capable, most expensive — deeper reasoning and more searches",
    effort: "high",
    maxWebSearches: 9,
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
// profile. Edit this to match your own background. Every profile produces all
// three Fit & Angle lenses (W2 / advisory / network); this background feeds all
// three, so keep both the practice and the W2 criteria here.
// ---------------------------------------------------------------------------
export const ABOUT_ME = `
- Level / domain: Director / Sr. Director / VP — GRC & Technology Risk. 12+ years.
- Career arc: life-sciences compliance (McKesson, Exelixis, 2014-2019) -> Box
  (2019-2024; built Risk & Resilience from scratch, ended as Director) -> Netflix
  (2024-2025; Head of Tech Risk & Enterprise Resilience) -> Coinbase (2025-2026;
  Director, Tech Risk).
- Known for: building GRC functions that drive business decisions rather than
  produce paperwork; quantitative risk (FAIR-grounded, built in-house tooling
  instead of buying); AI-native operating models; embedding risk into engineering
  planning rhythms; board reporting that drives engagement; people leadership.
  Player-coach who writes runbooks, builds agents, and drafts decks alongside the team.
- Now running Second Line Labs, a solo advisory practice: fractional / advisory
  GRC & Technology Risk for tech-forward companies in regulated spaces — standing
  up or maturing a second-line function, quantitative (FAIR) risk programs, board-
  and regulator-ready reporting, and AI-native risk operating models. Engagements
  are fractional, project, or advisory-seat — NOT a full-time W2 hire.
- W2 criteria (only relevant if I were taking a full-time seat, which is not the
  default lens): Director / Sr. Director / VP GRC or Tech Risk at $5B+ tech-forward
  companies in regulated spaces — mature enough to need a real second-line mandate
  and a team to lead (not a solo IC seat with a fancy title). Remote preferred;
  hybrid OK in the Seattle area.
`.trim();
