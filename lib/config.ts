// ---------------------------------------------------------------------------
// Easy-to-change settings live here.
// ---------------------------------------------------------------------------

// The Claude model used for research. This is the latest Claude Sonnet model.
// To change models later, edit this one line (e.g. "claude-opus-4-7").
export const MODEL = "claude-sonnet-4-6";

// How many web searches Claude may run per search pass. The search phase is
// bounded to 2 passes (see lib/research.ts), so total searches are capped around
// 2x this — keeping heavy subjects within the time limit. Raise/lower to taste.
export const MAX_WEB_SEARCHES = 8;

// Limit research to materials from roughly the last N years. Foundational/
// historical facts (company founding & IPO date, education, career history) are
// exempt from this limit — see lib/prompt.ts.
export const RECENCY_YEARS = 5;

// ---------------------------------------------------------------------------
// "About me" — used ONLY to tailor the final "Fit & Angle" section of each
// profile. Edit this to match your own background.
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
- Targeting: Director / Sr. Director / VP GRC or Tech Risk at $5B+ tech-forward
  companies in regulated spaces — mature enough to need a real second-line mandate
  and a team to lead (not a solo IC seat with a fancy title). Remote preferred;
  hybrid OK in the Seattle area.
`.trim();
