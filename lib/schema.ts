import { z } from "zod";
import { ADVISORY_LENS_ENABLED, ADVISORY_NAME } from "./config";

// ---------------------------------------------------------------------------
// THE single source of truth for the shape of a researched company profile.
//
// This Zod schema does three jobs at once:
//   1. It is converted to a JSON schema and sent to the API as the structured-
//      output format (see lib/research.ts), so the model is constrained to
//      return exactly this shape — no hand-parsing JSON out of prose.
//   2. The TypeScript types the UI renders against are inferred from it
//      (z.infer, at the bottom), so types can never drift from the schema.
//   3. It re-validates the parsed response at runtime before the UI sees it.
//
// The .describe() texts are sent to the model as part of the schema — they
// carry the per-field research guidance that used to be duplicated as prose in
// lib/prompt.ts. Behavioral instructions (search strategy, recency rules, lens
// framing, "About me") still live in lib/prompt.ts.
//
// To add or change a field: edit it here, then render it in
// components/CompanyView.tsx. Nothing else needs touching.
// ---------------------------------------------------------------------------

const SnapshotSchema = z.object({
  legalName: z.string(),
  headquarters: z.string(),
  founded: z.string().describe("Founding date or year"),
  sector: z.string().describe("Industry / what space they operate in"),
  employees: z.string().describe("Approximate headcount"),
  status: z
    .string()
    .describe(
      'Whether public (with ticker, e.g. "Public (NASDAQ: XYZ)"), private, or a subsidiary of another company'
    ),
  website: z.string().describe("Official website URL"),
});

const ProductSchema = z.object({
  name: z.string(),
  description: z.string(),
  source: z.string().optional().describe("Source URL"),
});

const MilestoneSchema = z.object({
  date: z.string(),
  summary: z
    .string()
    .describe('e.g. "Series C — $200M led by ...", "IPO on NASDAQ", "Acquired X"'),
  source: z.string().optional().describe("Source URL"),
});

const ExecChangeSchema = z.object({
  summary: z
    .string()
    .describe(
      "Who, the role, and what changed (stepped down / appointed / promoted)"
    ),
  date: z.string(),
  source: z.string().optional().describe("Source URL"),
});

const LayoffSchema = z.object({
  summary: z
    .string()
    .describe("Scale (headcount or %) and the stated reason if given"),
  date: z.string(),
  source: z.string().optional().describe("Source URL"),
});

const CONTROVERSY_TYPES = ["breach", "lawsuit", "regulatory", "other"] as const;

const ControversySchema = z.object({
  type: z.enum(CONTROVERSY_TYPES),
  summary: z.string(),
  date: z.string(),
  source: z.string().optional().describe("Source URL"),
});

const SecFilingHighlightSchema = z.object({
  filingType: z.string().describe('e.g. "10-K", "10-Q", "8-K", "S-1"'),
  date: z.string(),
  highlight: z.string(),
  url: z.string().describe("Link to the filing on SEC EDGAR (sec.gov)"),
});

const RiskFactorSchema = z.object({
  category: z
    .string()
    .describe('e.g. "Regulatory", "Legal", "Market", "Operational", "Cybersecurity"'),
  summary: z.string().describe("The disclosed risk, summarized in plain language"),
  source: z.string().describe("Link to the 10-K / 10-Q it came from"),
});

const RegulatoryFilingSchema = z.object({
  agency: z
    .string()
    .describe('e.g. "OCC", "SEC", "FINRA", "FDA", or a state regulator'),
  summary: z.string().describe('e.g. "Applied for national bank charter"'),
  date: z.string(),
  url: z.string().describe("Source URL"),
});

const MajorCustomerSchema = z.object({
  name: z.string(),
  note: z.string(),
  source: z.string().optional().describe("Source URL"),
});

const CultureSchema = z.object({
  rtoPolicy: z
    .string()
    .describe(
      "Current return-to-office stance — fully remote, hybrid (note days in office if stated), or office-first. Check the careers page and recent news."
    ),
  benefits: z
    .string()
    .describe(
      "Notable benefits and perks — health coverage, 401(k)/retirement match, parental/family leave, PTO, equity, wellness, learning budget, etc. One string, not a list."
    ),
  sentiment: z
    .string()
    .describe(
      'Overall employee sentiment — e.g. a Glassdoor/Comparably rating, "best place to work" recognition, and recurring themes in recent reviews'
    ),
  workLifeBalance: z
    .string()
    .describe(
      "Hours, flexibility, and any burnout/crunch signals from reviews or reporting"
    ),
  generalNotes: z
    .string()
    .describe(
      "Other cultural signals — stated values, DEI initiatives, team vibe, turnover, or notable culture-related controversies"
    ),
  source: z.string().optional().describe("Source URL"),
});

const FIT_TEMPERATURES = ["green", "orange", "red"] as const;

const JobPostingSchema = z.object({
  title: z.string().describe("Exact posting title"),
  location: z.string().describe('City/region or "Remote"'),
  postedDate: z
    .string()
    .describe("When the role was posted — must be within the last 30 days"),
  url: z
    .string()
    .describe(
      "VERIFIED direct link to this specific posting — omit the posting entirely if the link cannot be verified"
    ),
  note: z.string().optional().describe("One line on why it could fit"),
});

const FitAndAngleSchema = z.object({
  temperature: z
    .enum(FIT_TEMPERATURES)
    .describe(
      "Traffic-light verdict on this lens: green = good fit, orange = mixed/unclear, red = poor fit"
    ),
  temperatureNote: z
    .string()
    .describe("One short sentence (roughly 10-20 words) on why this color"),
  whyItCouldFitYou: z.array(z.string()),
  watchOuts: z.array(z.string()),
  talkingPoints: z.array(z.string()),
  questionsToAsk: z.array(z.string()),
  jobPostings: z
    .array(JobPostingSchema)
    .optional()
    .describe(
      "W2 lens only: currently open roles posted in the last 30 days (omit for the advisory lens)"
    ),
  careersUrl: z
    .string()
    .optional()
    .describe("W2 lens only: the company's main careers / open-roles page"),
});

export const CompanyProfileSchema = z.object({
  name: z.string(),
  snapshot: SnapshotSchema,
  overview: z
    .string()
    .describe("2-4 plain-language sentences on what the company actually does"),
  products: z.array(ProductSchema).describe("Main products or service lines"),
  milestones: z
    .array(MilestoneSchema)
    .describe(
      "Major events from roughly the LAST 3 YEARS, most recent first — funding rounds (Series A/B/C...), IPO, large acquisitions, major launches. (Founding and IPO dates may be older.)"
    ),
  execChanges: z
    .array(ExecChangeSchema)
    .describe(
      "Leadership changes, most recent first — C-suite (CEO/CFO/CISO/etc.) and board appointments, departures, and promotions, including changes announced via press release. ACTIVELY search recent news; source each."
    ),
  layoffs: z
    .array(LayoffSchema)
    .describe(
      "Reductions in force / layoffs over roughly the last few years, most recent first. ACTIVELY search recent news, especially the current year."
    ),
  controversies: z
    .array(ControversySchema)
    .describe(
      "Data breaches, lawsuits, enforcement actions, and major public criticism — ACTIVELY search recent news, especially the current year. Layoffs and leadership changes have their own sections above — don't duplicate them here. Be factual and cite a source for each; do not editorialize."
    ),
  secFilingsHighlights: z
    .array(SecFilingHighlightSchema)
    .describe(
      "Notable items from 10-K (annual), 10-Q (quarterly), and 8-K (material events) filings. Use SEC EDGAR (sec.gov) and link to the filing. If the company is private and does not file with the SEC, return []."
    ),
  riskFactors: z
    .array(RiskFactorSchema)
    .describe(
      'Key risks the company itself discloses in the "Risk Factors" section (Item 1A) of its most recent 10-K, plus any material updates in the latest 10-Q — the most significant ones across categories, each in plain language with the filing as the source. If the company is private / does not file with the SEC, return [].'
    ),
  regulatoryFilings: z
    .array(RegulatoryFilingSchema)
    .describe(
      "Filings or actions with regulators relevant to the company's industry, including new license or charter applications. Include recent ones from the current year. Link to the source."
    ),
  majorCustomers: z
    .array(MajorCustomerSchema)
    .describe("Notable named customers or partners, with a source each"),
  culture: CultureSchema.describe(
    'A concise read on the company as an employer, drawn from public sources (careers page, Glassdoor, Comparably, LinkedIn, news, "best place to work" lists). Use "Not found" for any field you cannot source.'
  ),
  fitAndAngle: z
    .object({
      w2: FitAndAngleSchema,
      // The advisory lens is optional: it is only requested (and rendered) when
      // the advisory lens is enabled. See ADVISORY_LENS_ENABLED in lib/config.ts.
      advisory: FitAndAngleSchema.optional(),
    })
    .describe(
      "One assessment per enabled lens, following the per-lens instructions in the user message"
    ),
  unknowns: z
    .array(z.string())
    .describe("Anything you are unsure about or could not confirm"),
});

// ---------------------------------------------------------------------------
// TypeScript types — inferred from the schema above, so they can never drift.
// ---------------------------------------------------------------------------

export type CompanyProfile = z.infer<typeof CompanyProfileSchema>;
export type CompanySnapshot = z.infer<typeof SnapshotSchema>;
export type CompanyCulture = z.infer<typeof CultureSchema>;
export type CompanyFitAndAngle = z.infer<typeof FitAndAngleSchema>;
export type JobPosting = z.infer<typeof JobPostingSchema>;
export type FitAndAngleByIntent = CompanyProfile["fitAndAngle"];
export type FitTemperature = (typeof FIT_TEMPERATURES)[number];
export type ControversyType = (typeof CONTROVERSY_TYPES)[number];

// ---------------------------------------------------------------------------
// UI metadata for the evaluation lenses. These reshape only the closing
// "Fit & Angle" sections — the factual sections stay objective. By default a
// profile includes ONE lens (full-time role). Enabling the advisory lens (see
// ADVISORY_LENS_ENABLED in lib/config.ts) adds a second one:
//   w2       — a potential full-time role for you
//   advisory — a potential advisory / consulting client (optional)
// ---------------------------------------------------------------------------

export type ProfileIntent = "w2" | "advisory";

export interface IntentMeta {
  value: ProfileIntent;
  sectionTitle: string; // heading for this lens's Fit & Angle section in the view
  fieldLabels: {
    whyItCouldFitYou: string;
    watchOuts: string;
    talkingPoints: string;
    questionsToAsk: string;
  };
}

const W2_INTENT: IntentMeta = {
  value: "w2",
  sectionTitle: "Fit & Angle — as a full-time role",
  fieldLabels: {
    whyItCouldFitYou: "Why this role could fit you",
    watchOuts: "Watch-outs",
    talkingPoints: "Talking points",
    questionsToAsk: "Smart questions to ask",
  },
};

const ADVISORY_INTENT: IntentMeta = {
  value: "advisory",
  sectionTitle: ADVISORY_NAME
    ? `Fit & Angle — as an advisory client for ${ADVISORY_NAME}`
    : "Fit & Angle — as an advisory / consulting client",
  fieldLabels: {
    whyItCouldFitYou: ADVISORY_NAME
      ? `Why they could be a fit for ${ADVISORY_NAME}`
      : "Why they could be an advisory fit",
    watchOuts: "Watch-outs (as an advisory engagement)",
    talkingPoints: "Pitch angles",
    questionsToAsk: "Scoping questions",
  },
};

// Rendered top-to-bottom in this order. The advisory lens is only included when
// it is enabled, so by default a profile shows just the full-time read.
export const INTENTS: IntentMeta[] = ADVISORY_LENS_ENABLED
  ? [W2_INTENT, ADVISORY_INTENT]
  : [W2_INTENT];
