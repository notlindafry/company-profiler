// Defensive normalization of the model's JSON into a guaranteed-safe
// CompanyProfile. The model is an LLM: even with a strict schema it can return a
// missing field, the wrong type (e.g. an array where we expect a string), or a
// junk entry. We coerce everything into the expected shape here so the UI never
// renders against an unexpected structure.

import type {
  CompanyProfile,
  CompanySnapshot,
  CompanyCulture,
  CompanyFitAndAngle,
  FitAndAngleByIntent,
  FitTemperature,
  ControversyType,
} from "./schema";

const NF = "Not found";

const FIT_TEMPERATURES: FitTemperature[] = ["green", "orange", "red"];

// Only accept one of the three known colors; anything else (missing, typo, an
// unexpected type) becomes undefined so the UI simply omits the badge.
function temperature(value: unknown): FitTemperature | undefined {
  return FIT_TEMPERATURES.includes(value as FitTemperature)
    ? (value as FitTemperature)
    : undefined;
}

function rec(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function str(value: unknown, fallback: string = NF): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function optStr(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

// URLs from model output are rendered straight into <a href>. Accept ONLY
// http(s) links so a crafted "javascript:"/"data:" URL can't execute on click.
// Returns undefined for anything that isn't a well-formed http(s) URL.
function safeUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const t = value.trim();
  if (!t) return undefined;
  try {
    const u = new URL(t);
    if (u.protocol === "http:" || u.protocol === "https:") return t;
  } catch {
    // not a parseable absolute URL
  }
  return undefined;
}

// For required URL string fields that fall back to "Not found" (the UI hides a
// SourceLink whose url is "Not found").
function urlOrNF(value: unknown): string {
  return safeUrl(value) ?? NF;
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function strList(value: unknown): string[] {
  return list(value)
    .map((x) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean);
}

const CONTROVERSY_TYPES: ControversyType[] = [
  "breach",
  "lawsuit",
  "regulatory",
  "other",
];

function controversyType(value: unknown): ControversyType {
  return CONTROVERSY_TYPES.includes(value as ControversyType)
    ? (value as ControversyType)
    : "other";
}

function snapshot(value: unknown): CompanySnapshot {
  const o = rec(value);
  return {
    legalName: str(o.legalName),
    headquarters: str(o.headquarters),
    founded: str(o.founded),
    sector: str(o.sector),
    employees: str(o.employees),
    status: str(o.status),
    website: urlOrNF(o.website),
  };
}

function culture(value: unknown): CompanyCulture {
  const o = rec(value);
  // benefits is meant to be a string, but the model often returns a list.
  const benefits = Array.isArray(o.benefits)
    ? strList(o.benefits).join("; ")
    : str(o.benefits);
  return {
    rtoPolicy: str(o.rtoPolicy),
    benefits: benefits || NF,
    sentiment: str(o.sentiment),
    workLifeBalance: str(o.workLifeBalance),
    generalNotes: str(o.generalNotes),
    source: safeUrl(o.source),
  };
}

function fitAndAngle(value: unknown): CompanyFitAndAngle {
  const o = rec(value);
  return {
    temperature: temperature(o.temperature),
    temperatureNote: optStr(o.temperatureNote),
    whyItCouldFitYou: strList(o.whyItCouldFitYou),
    watchOuts: strList(o.watchOuts),
    talkingPoints: strList(o.talkingPoints),
    questionsToAsk: strList(o.questionsToAsk),
    // Drop any posting missing a title or a verified source URL — the link is
    // the whole point, so an unsourced posting is not useful.
    jobPostings: list(o.jobPostings)
      .map((p) => {
        const x = rec(p);
        return {
          title: str(x.title),
          location: str(x.location),
          postedDate: str(x.postedDate),
          url: urlOrNF(x.url),
          note: optStr(x.note),
        };
      })
      .filter((j) => j.title !== NF && j.url !== NF),
    careersUrl: safeUrl(o.careersUrl),
  };
}

// One assessment per lens. Each key is normalized independently so a missing or
// malformed lens still yields a safe (empty) section rather than crashing the UI.
function fitAndAngles(value: unknown): FitAndAngleByIntent {
  const o = rec(value);
  return {
    w2: fitAndAngle(o.w2),
    advisory: fitAndAngle(o.advisory),
  };
}

export function normalizeProfile(raw: unknown): CompanyProfile {
  const o = rec(raw);
  return {
    name: str(o.name),
    snapshot: snapshot(o.snapshot),
    overview: str(o.overview),
    products: list(o.products)
      .map((p) => {
        const x = rec(p);
        return {
          name: str(x.name),
          description: str(x.description),
          source: safeUrl(x.source),
        };
      })
      .filter((p) => p.name !== NF),
    milestones: list(o.milestones)
      .map((p) => {
        const x = rec(p);
        return { date: str(x.date), summary: str(x.summary), source: safeUrl(x.source) };
      })
      .filter((m) => m.summary !== NF),
    execChanges: list(o.execChanges)
      .map((p) => {
        const x = rec(p);
        return { summary: str(x.summary), date: str(x.date), source: safeUrl(x.source) };
      })
      .filter((c) => c.summary !== NF),
    layoffs: list(o.layoffs)
      .map((p) => {
        const x = rec(p);
        return { summary: str(x.summary), date: str(x.date), source: safeUrl(x.source) };
      })
      .filter((l) => l.summary !== NF),
    controversies: list(o.controversies)
      .map((p) => {
        const x = rec(p);
        return {
          type: controversyType(x.type),
          summary: str(x.summary),
          date: str(x.date),
          source: safeUrl(x.source),
        };
      })
      .filter((c) => c.summary !== NF),
    secFilingsHighlights: list(o.secFilingsHighlights)
      .map((p) => {
        const x = rec(p);
        return {
          filingType: str(x.filingType),
          date: str(x.date),
          highlight: str(x.highlight),
          url: urlOrNF(x.url),
        };
      })
      .filter((f) => f.highlight !== NF),
    riskFactors: list(o.riskFactors)
      .map((p) => {
        const x = rec(p);
        return { category: str(x.category), summary: str(x.summary), source: urlOrNF(x.source) };
      })
      .filter((r) => r.summary !== NF),
    regulatoryFilings: list(o.regulatoryFilings)
      .map((p) => {
        const x = rec(p);
        return {
          agency: str(x.agency),
          summary: str(x.summary),
          date: str(x.date),
          url: urlOrNF(x.url),
        };
      })
      .filter((r) => r.summary !== NF),
    majorCustomers: list(o.majorCustomers)
      .map((p) => {
        const x = rec(p);
        return { name: str(x.name), note: str(x.note), source: safeUrl(x.source) };
      })
      .filter((c) => c.name !== NF),
    culture: culture(o.culture),
    fitAndAngle: fitAndAngles(o.fitAndAngle),
    unknowns: strList(o.unknowns),
  };
}
