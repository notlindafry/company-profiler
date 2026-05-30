// The shape of a researched company profile. The API route validates that
// Claude's output parses as JSON before sending it to the page.

export interface CompanySnapshot {
  legalName: string;
  headquarters: string;
  founded: string;
  sector: string; // industry / what space they operate in
  employees: string; // approximate headcount
  status: string; // e.g. "Public (NASDAQ: XYZ)", "Private", "Subsidiary of ..."
  website: string;
}

export interface CompanyProduct {
  name: string;
  description: string;
  source?: string;
}

export interface CompanyMilestone {
  date: string;
  summary: string; // e.g. "Series C — $200M led by ...", "IPO on NASDAQ", "Acquired X"
  source?: string;
}

export interface ExecChange {
  summary: string; // e.g. "CEO Jane Doe stepped down; COO promoted to CEO", "Named new CISO ..."
  date: string;
  source?: string;
}

export interface Layoff {
  summary: string; // e.g. "Cut ~20% of staff (~1,000 roles), citing ..."
  date: string;
  source?: string;
}

export type ControversyType = "breach" | "lawsuit" | "regulatory" | "other";

export interface CompanyControversy {
  type: ControversyType;
  summary: string;
  date: string;
  source?: string;
}

export interface SecFilingHighlight {
  filingType: string; // e.g. "10-K", "8-K", "10-Q", "S-1"
  date: string;
  highlight: string;
  url: string;
}

export interface RiskFactor {
  category: string; // e.g. "Regulatory", "Legal", "Market", "Operational", "Cybersecurity"
  summary: string; // the disclosed risk, summarized in plain language
  source: string; // link to the 10-K / 10-Q it came from
}

export interface RegulatoryFiling {
  agency: string; // e.g. "OCC", "SEC", "FINRA", "state regulator"
  summary: string; // e.g. "Applied for national bank charter"
  date: string;
  url: string;
}

export interface MajorCustomer {
  name: string;
  note: string;
  source?: string;
}

export interface CompanyCulture {
  rtoPolicy: string; // return-to-office stance, e.g. "Fully remote", "Hybrid — 3 days/week in office", "Office-first"
  benefits: string; // notable benefits & perks, e.g. health, 401(k) match, parental leave, equity, PTO
  sentiment: string; // overall employee sentiment, e.g. Glassdoor rating, "best place to work" awards, review themes
  workLifeBalance: string; // assessment of hours, flexibility, burnout/crunch signals
  generalNotes: string; // values, DEI, team vibe, turnover, or other cultural notes
  source?: string;
}

export interface CompanyFitAndAngle {
  whyItCouldFitYou: string[];
  watchOuts: string[];
  talkingPoints: string[];
  questionsToAsk: string[];
}

// The lens the user is evaluating the company through. This reshapes only the
// closing "Fit & Angle" section — the factual sections stay objective.
//   w2       — a potential full-time role for me
//   advisory — a potential advisory client for Second Line Labs (my practice)
//   network  — a relationship bet (time, advisor-investor seat, warm intros)
export type ProfileIntent = "w2" | "advisory" | "network";

export interface IntentMeta {
  value: ProfileIntent;
  formLabel: string; // short label on the form control
  formHint: string; // one line under the option
  sectionTitle: string; // heading for the Fit & Angle section in the view
  fieldLabels: {
    whyItCouldFitYou: string;
    watchOuts: string;
    talkingPoints: string;
    questionsToAsk: string;
  };
}

// Ordered left-to-right: full-time W2 role, advisory client, network.
export const INTENTS: IntentMeta[] = [
  {
    value: "w2",
    formLabel: "Full-time (W2) role",
    formHint: "A potential full-time seat for me",
    sectionTitle: "Fit & Angle — as a full-time (W2) role",
    fieldLabels: {
      whyItCouldFitYou: "Why this role could fit you",
      watchOuts: "Watch-outs",
      talkingPoints: "Talking points",
      questionsToAsk: "Smart questions to ask",
    },
  },
  {
    value: "advisory",
    formLabel: "Advisory client",
    formHint: "A potential Second Line Labs engagement",
    sectionTitle: "Fit & Angle — as a Second Line Labs advisory client",
    fieldLabels: {
      whyItCouldFitYou: "Why they could be a fit for Second Line Labs",
      watchOuts: "Watch-outs (as an advisory engagement)",
      talkingPoints: "Pitch angles",
      questionsToAsk: "Scoping questions",
    },
  },
  {
    value: "network",
    formLabel: "Network",
    formHint: "A relationship worth building (intros, advisor seat, time)",
    sectionTitle: "Fit & Angle — as a network relationship",
    fieldLabels: {
      whyItCouldFitYou: "Why this relationship could be worth building",
      watchOuts: "Watch-outs",
      talkingPoints: "Angles to build the relationship",
      questionsToAsk: "Questions to ask",
    },
  },
];

export const INTENT_META: Record<ProfileIntent, IntentMeta> = Object.fromEntries(
  INTENTS.map((i) => [i.value, i])
) as Record<ProfileIntent, IntentMeta>;

// Default to the advisory lens. The user has ruled out a full-time seat, so the
// app should not silently default to candidate framing.
export const DEFAULT_INTENT: ProfileIntent = "advisory";

export function isProfileIntent(value: unknown): value is ProfileIntent {
  return value === "w2" || value === "advisory" || value === "network";
}

export interface CompanyProfile {
  name: string;
  snapshot: CompanySnapshot;
  overview: string; // plain-language description of what they do
  products: CompanyProduct[];
  milestones: CompanyMilestone[];
  execChanges: ExecChange[];
  layoffs: Layoff[];
  controversies: CompanyControversy[];
  secFilingsHighlights: SecFilingHighlight[];
  riskFactors: RiskFactor[];
  regulatoryFilings: RegulatoryFiling[];
  majorCustomers: MajorCustomer[];
  culture: CompanyCulture;
  fitAndAngle: CompanyFitAndAngle;
  unknowns: string[];
}
