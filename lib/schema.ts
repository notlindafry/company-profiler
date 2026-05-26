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
  riskFactors: RiskFactor[];
  regulatoryFilings: RegulatoryFiling[];
  majorCustomers: MajorCustomer[];
  fitAndAngle: CompanyFitAndAngle;
  unknowns: string[];
}
