// The shape of a researched profile. The API route validates that Claude's
// output matches this before sending it to the page.

export interface Tenure {
  startDate: string; // e.g. "2024-03" or "Not found"
  durationText: string; // e.g. "1 year 2 months" or "Not found"
}

export interface CareerHistoryItem {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  note: string;
  source?: string;
}

export interface EducationItem {
  institution: string;
  degree: string;
  field: string;
  year: string;
  source?: string;
}

export interface CareerNote {
  note: string;
  source?: string;
}

export type MediaType = "interview" | "article" | "talk" | "podcast" | "other";

export interface MediaItem {
  title: string;
  type: MediaType;
  date: string;
  url: string;
}

export interface Announcement {
  summary: string;
  date: string;
  url: string;
}

export interface LinkedIn {
  profileUrl: string;
  publicActivitySummary: string;
  themes: string[];
}

export interface FitAndAngle {
  execLikelyPriorities: string[];
  whyYouConnect: string[];
  talkingPoints: string[];
  questionsToAsk: string[];
}

export interface ExecutiveProfile {
  name: string;
  currentTitle: string;
  currentCompany: string;
  tenure: Tenure;
  careerHistory: CareerHistoryItem[];
  education: EducationItem[];
  careerNotes: CareerNote[];
  mediaAndPublications: MediaItem[];
  announcementsSinceJoining: Announcement[];
  linkedin: LinkedIn;
  fitAndAngle: FitAndAngle;
  unknowns: string[];
}

// ---------------------------------------------------------------------------
// Company profile (used when the Executive Name field is left blank).
// ---------------------------------------------------------------------------

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

export interface CompanyFitAndAngle {
  whyItCouldFitYou: string[];
  watchOuts: string[];
  talkingPoints: string[];
  questionsToAsk: string[];
}

export interface CompanyProfile {
  name: string;
  snapshot: CompanySnapshot;
  overview: string; // plain-language description of what they do
  products: CompanyProduct[];
  milestones: CompanyMilestone[];
  controversies: CompanyControversy[];
  secFilingsHighlights: SecFilingHighlight[];
  regulatoryFilings: RegulatoryFiling[];
  majorCustomers: MajorCustomer[];
  fitAndAngle: CompanyFitAndAngle;
  unknowns: string[];
}
