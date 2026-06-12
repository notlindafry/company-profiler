// Final safety pass over a schema-validated profile.
//
// The model's output now arrives already constrained to CompanyProfileSchema
// (structured outputs) and re-validated with Zod, so types, required fields,
// and enums are guaranteed — the old field-by-field coercion is gone. Two
// things the schema can NOT guarantee are enforced here:
//
//   1. Link safety: URLs are rendered straight into <a href>, so accept ONLY
//      http(s) links — a crafted "javascript:"/"data:" URL must never execute
//      on click.
//   2. Usefulness: drop junk entries (e.g. a job posting without a verified
//      link — the link is the whole point).

import type { CompanyProfile, CompanyFitAndAngle } from "./schema";

const NF = "Not found";

// Returns the URL only if it parses as absolute http(s); otherwise undefined.
function safeUrl(value: string | undefined): string | undefined {
  const t = value?.trim();
  if (!t || t === NF) return undefined;
  try {
    const u = new URL(t);
    if (u.protocol === "http:" || u.protocol === "https:") return t;
  } catch {
    // not a parseable absolute URL
  }
  return undefined;
}

// For required URL fields, where the UI hides anything that reads "Not found".
function urlOrNF(value: string | undefined): string {
  return safeUrl(value) ?? NF;
}

function fit(f: CompanyFitAndAngle): CompanyFitAndAngle {
  return {
    ...f,
    jobPostings: (f.jobPostings ?? [])
      .map((j) => ({ ...j, url: urlOrNF(j.url) }))
      .filter((j) => j.title.trim() && j.title !== NF && j.url !== NF),
    careersUrl: safeUrl(f.careersUrl),
  };
}

export function sanitizeProfile(p: CompanyProfile): CompanyProfile {
  return {
    ...p,
    snapshot: { ...p.snapshot, website: urlOrNF(p.snapshot.website) },
    products: p.products
      .map((x) => ({ ...x, source: safeUrl(x.source) }))
      .filter((x) => x.name.trim() && x.name !== NF),
    milestones: p.milestones
      .map((x) => ({ ...x, source: safeUrl(x.source) }))
      .filter((x) => x.summary !== NF),
    execChanges: p.execChanges
      .map((x) => ({ ...x, source: safeUrl(x.source) }))
      .filter((x) => x.summary !== NF),
    layoffs: p.layoffs
      .map((x) => ({ ...x, source: safeUrl(x.source) }))
      .filter((x) => x.summary !== NF),
    controversies: p.controversies
      .map((x) => ({ ...x, source: safeUrl(x.source) }))
      .filter((x) => x.summary !== NF),
    secFilingsHighlights: p.secFilingsHighlights
      .map((x) => ({ ...x, url: urlOrNF(x.url) }))
      .filter((x) => x.highlight !== NF),
    riskFactors: p.riskFactors
      .map((x) => ({ ...x, source: urlOrNF(x.source) }))
      .filter((x) => x.summary !== NF),
    regulatoryFilings: p.regulatoryFilings
      .map((x) => ({ ...x, url: urlOrNF(x.url) }))
      .filter((x) => x.summary !== NF),
    majorCustomers: p.majorCustomers
      .map((x) => ({ ...x, source: safeUrl(x.source) }))
      .filter((x) => x.name.trim() && x.name !== NF),
    culture: { ...p.culture, source: safeUrl(p.culture.source) },
    fitAndAngle: {
      w2: fit(p.fitAndAngle.w2),
      advisory: fit(p.fitAndAngle.advisory),
    },
  };
}
