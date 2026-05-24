import { ABOUT_ME, RECENCY_YEARS } from "./config";

// Tells the model to limit searches to recent material, while exempting the
// foundational/historical facts that are inherently older. `exceptions`
// describes which fields are exempt for this profile type.
function recencyGuidance(exceptions: string): string {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const cutoffYear = now.getFullYear() - RECENCY_YEARS;
  return `
Recency requirement:
- Today's date is ${today}. Limit your searches and findings to materials from
  roughly the last ${RECENCY_YEARS} years (published ${cutoffYear} or later). Add
  date qualifiers to your queries and disregard older results.
- EXCEPTION: ${exceptions} Capture these accurately regardless of how far back
  they go.
`.trim();
}

export const SYSTEM_PROMPT = `
You are a research assistant. You produce factual, sourced profiles — of
executives or of companies — for someone preparing for a job interview or outreach.

Hard rules:
- ALWAYS use the web_search tool to find current, authoritative information.
  Prefer recent and reputable sources (company sites, regulatory databases like
  SEC EDGAR, major news outlets, conference pages, the subject's own posts/talks).
- EVERY factual claim must be backed by at least one source URL. Put the URL in
  the relevant "source"/"url" field. If you cannot find a source for a claim, do
  not make the claim.
- Use ONLY publicly available information. Do NOT attempt to log in to, scrape, or
  reconstruct private data (e.g. private LinkedIn data).
- If a fact cannot be found, write the exact string "Not found" for that field —
  NEVER invent, guess, or infer specifics.
- Add anything you are unsure about, or could not confirm, to the "unknowns" list.
- Make sure you have the RIGHT subject. If you are not confident you found the
  correct person or company, say so clearly in "unknowns".

Your final answer must be a single JSON object wrapped in a \`\`\`json code fence,
matching the requested schema exactly, with NO other text after it.
`.trim();

// ---------------------------------------------------------------------------
// Executive profile
// ---------------------------------------------------------------------------

function executiveSchemaDescription(): string {
  return `
Return a JSON object with EXACTLY these fields (use "Not found" for unknown strings,
and empty arrays [] for sections with no findings):

{
  "name": string,
  "currentTitle": string,
  "currentCompany": string,
  "tenure": { "startDate": string, "durationText": string },
  "careerHistory": [
    { "company": string, "title": string, "startDate": string, "endDate": string, "note": string, "source": string }
  ],
  "education": [
    { "institution": string, "degree": string, "field": string, "year": string, "source": string }
  ],
  "careerNotes": [
    { "note": string, "source": string }
  ],
  "mediaAndPublications": [
    { "title": string, "type": "interview" | "article" | "talk" | "podcast" | "other", "date": string, "url": string }
  ],
  "announcementsSinceJoining": [
    { "summary": string, "date": string, "url": string }
  ],
  "linkedin": {
    "profileUrl": string,
    "publicActivitySummary": string,
    "themes": [string]
  },
  "fitAndAngle": {
    "execLikelyPriorities": [string],
    "whyYouConnect": [string],
    "talkingPoints": [string],
    "questionsToAsk": [string]
  },
  "unknowns": [string]
}

Notes on specific fields:
- tenure.durationText: compute the duration from the start date at the current
  company to today, in plain words (e.g. "1 year 4 months").
- careerHistory: previous roles, most recent first — i.e. where they came from.
- careerNotes: notable items — career pivots, advisory/board roles, awards,
  founder/operator history.
- mediaAndPublications: recent first.
- announcementsSinceJoining: initiatives, notable hires, product/strategy
  statements made since they joined the current company. Recent first.
`.trim();
}

export function buildExecutivePrompt(
  name: string,
  company: string,
  detail?: string
): string {
  const trimmed = detail?.trim();
  const disambiguation = trimmed
    ? `

Use this additional detail to identify the correct person (more than one person
may share this name at the company): "${trimmed}". Treat it as the key
disambiguator — if it is a LinkedIn URL, use it as the authoritative identity
anchor (public info only; do not log in or scrape). If you cannot confirm the
subject matches this detail, do NOT profile the wrong person; explain the
mismatch in "unknowns".`
    : "";

  return `
Research this executive and produce a sourced profile.

Executive name: ${name}
Current company: ${company}${disambiguation}

${recencyGuidance(
  "the person's education history and full career history (previous roles — where they came from) are inherently older and must still be captured in full."
)}

${executiveSchemaDescription()}

After the factual sections, fill in "fitAndAngle", tailored to ME using the
background below. Specifically:
- execLikelyPriorities: 3-5 priorities this exec likely has, given their role and company.
- whyYouConnect: 3-5 points connecting MY background to those priorities.
- talkingPoints: 3-5 specific things I could raise in a conversation.
- questionsToAsk: 3-5 smart, specific questions I could ask them.

About me (use ONLY for the fitAndAngle section):
${ABOUT_ME}

Remember: use web_search throughout, source every fact, write "Not found" rather
than guessing, and flag anything low-confidence in "unknowns". End with the single
\`\`\`json object and nothing after it.
`.trim();
}

// ---------------------------------------------------------------------------
// Company profile
// ---------------------------------------------------------------------------

function companySchemaDescription(): string {
  return `
Return a JSON object with EXACTLY these fields (use "Not found" for unknown strings,
and empty arrays [] for sections with no findings):

{
  "name": string,
  "snapshot": {
    "legalName": string,
    "headquarters": string,
    "founded": string,
    "sector": string,
    "employees": string,
    "status": string,
    "website": string
  },
  "overview": string,
  "products": [
    { "name": string, "description": string, "source": string }
  ],
  "milestones": [
    { "date": string, "summary": string, "source": string }
  ],
  "controversies": [
    { "type": "breach" | "lawsuit" | "regulatory" | "other", "summary": string, "date": string, "source": string }
  ],
  "secFilingsHighlights": [
    { "filingType": string, "date": string, "highlight": string, "url": string }
  ],
  "regulatoryFilings": [
    { "agency": string, "summary": string, "date": string, "url": string }
  ],
  "majorCustomers": [
    { "name": string, "note": string, "source": string }
  ],
  "fitAndAngle": {
    "whyItCouldFitYou": [string],
    "watchOuts": [string],
    "talkingPoints": [string],
    "questionsToAsk": [string]
  },
  "unknowns": [string]
}

Notes on specific fields:
- snapshot.status: whether public (with ticker), private, or a subsidiary.
- overview: 2-4 plain-language sentences on what the company actually does.
- products: their main products or service lines.
- milestones: major events, most recent first — funding rounds (Series A/B/C...),
  IPO, large acquisitions, major launches, leadership changes.
- controversies: data breaches, lawsuits, enforcement actions, major public
  criticism. Be factual and cite a source for each; do not editorialize.
- secFilingsHighlights: notable items from 10-K (annual), 10-Q (quarterly), and
  8-K (material events) filings. Use SEC EDGAR (sec.gov) and link to the filing.
  If the company is private and does not file with the SEC, return [].
- regulatoryFilings: filings or actions with regulators relevant to the company's
  industry — e.g. OCC, SEC, FINRA, FDA, state regulators — including new license
  or charter applications. Link to the source.
- majorCustomers: notable named customers or partners, with a source each.
`.trim();
}

export function buildCompanyPrompt(company: string): string {
  return `
Research this company and produce a sourced profile.

Company: ${company}

${recencyGuidance(
  "the company's foundational history — its founding date and IPO date — is inherently older and must still be captured."
)}

${companySchemaDescription()}

After the factual sections, fill in "fitAndAngle", tailored to ME using the
background below. Specifically:
- whyItCouldFitYou: 3-5 points on whether this company matches what I'm targeting
  (size, sector, regulatory posture, whether it likely needs a real second-line
  GRC/Tech-Risk mandate with a team to lead).
- watchOuts: 2-4 honest flags I should weigh (e.g. recent layoffs, instability,
  legal/regulatory overhang, signs the role might be a solo IC seat).
- talkingPoints: 3-5 specific things I could raise in an interview.
- questionsToAsk: 3-5 smart, specific questions I could ask about the company or role.

About me (use ONLY for the fitAndAngle section):
${ABOUT_ME}

Remember: use web_search throughout (including SEC EDGAR and regulator sites where
relevant), source every fact, write "Not found" rather than guessing, and flag
anything low-confidence in "unknowns". End with the single \`\`\`json object and
nothing after it.
`.trim();
}
