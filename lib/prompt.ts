import { ABOUT_ME, RECENCY_YEARS } from "./config";
import type { ProfileIntent } from "./schema";

export const SYSTEM_PROMPT = `
You are a research assistant. You produce factual, sourced profiles of companies
for someone evaluating each company for a specific purpose — which may be a
potential full-time role, an advisory engagement, or a network relationship.
The user states that purpose; tailor ONLY the closing "fit & angle" assessment to
it, and keep every factual section objective regardless of the purpose.

Hard rules:
- The user message states TODAY'S DATE. Treat it as the authoritative present —
  even if it is later than your training data, never assume the year is earlier.
  Compute every date and duration relative to it, and actively look for the most
  recent information, including the current year.
- ALWAYS use the web_search tool to find current, authoritative information.
  Prefer recent and reputable sources (company sites, regulatory databases like
  SEC EDGAR, major news outlets).
- EVERY factual claim must be backed by at least one source URL. Put the URL in
  the relevant "source"/"url" field. If you cannot find a source for a claim, do
  not make the claim.
- Use ONLY publicly available information. Do NOT attempt to log in to, scrape,
  or reconstruct private data.
- If a fact cannot be found, write the exact string "Not found" for that field —
  NEVER invent, guess, or infer specifics.
- Add anything you are unsure about, or could not confirm, to the "unknowns" list.
- Make sure you have the RIGHT company. If you are not confident you found the
  correct one, say so clearly in "unknowns".
- Be efficient and decisive: gather the most important facts with a handful of
  searches, then produce the JSON. Do not aim for exhaustive coverage — if
  something isn't quickly found, mark it "Not found" and move on. A sourced,
  partial profile delivered promptly is better than searching endlessly.

Your final answer must be a single JSON object wrapped in a \`\`\`json code fence,
matching the requested schema exactly, with NO other text after it.
`.trim();

// Tells the model to limit searches to recent material, while exempting the
// foundational facts that are inherently older.
function recencyGuidance(exceptions: string): string {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const year = now.getFullYear();
  const cutoffYear = year - RECENCY_YEARS;
  return `
Date and recency requirements:
- TODAY'S DATE IS ${today}. Treat it as the authoritative present, even if later
  than your training data; do not assume the current year is earlier than ${year}.
- Compute any "how long" durations from the start date to TODAY (${today}).
- Limit findings to roughly the last ${RECENCY_YEARS} years (published
  ${cutoffYear} or later) and prefer the most recent; disregard older results.
- EXCEPTION: ${exceptions} Capture these accurately regardless of how far back
  they go.
`.trim();
}

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
  "execChanges": [
    { "summary": string, "date": string, "source": string }
  ],
  "layoffs": [
    { "summary": string, "date": string, "source": string }
  ],
  "controversies": [
    { "type": "breach" | "lawsuit" | "regulatory" | "other", "summary": string, "date": string, "source": string }
  ],
  "secFilingsHighlights": [
    { "filingType": string, "date": string, "highlight": string, "url": string }
  ],
  "riskFactors": [
    { "category": string, "summary": string, "source": string }
  ],
  "regulatoryFilings": [
    { "agency": string, "summary": string, "date": string, "url": string }
  ],
  "majorCustomers": [
    { "name": string, "note": string, "source": string }
  ],
  "culture": {
    "rtoPolicy": string,
    "benefits": string,
    "sentiment": string,
    "workLifeBalance": string,
    "generalNotes": string,
    "source": string
  },
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
- milestones: major events from roughly the LAST 3 YEARS, most recent first —
  funding rounds (Series A/B/C...), IPO, large acquisitions, major launches,
  leadership changes. (Founding and IPO dates may be older.)
- execChanges: leadership changes, most recent first — C-suite (CEO/CFO/CISO/etc.)
  and board appointments, departures, and promotions. Say who, the role, what
  changed (stepped down / appointed / promoted), and the date. Capture changes
  announced via press release. ACTIVELY search recent news; source each.
- layoffs: reductions in force / layoffs over roughly the last few years, most
  recent first — include the scale (headcount or %), the date, the stated reason
  if given, and a source. ACTIVELY search recent news, especially the current year.
- controversies: data breaches, lawsuits, enforcement actions, and major public
  criticism — ACTIVELY search recent news, especially the current year. (Layoffs
  and leadership changes have their own sections above — don't duplicate them
  here.) Be factual and cite a source for each; do not editorialize.
- secFilingsHighlights: notable items from 10-K (annual), 10-Q (quarterly), and
  8-K (material events) filings. Use SEC EDGAR (sec.gov) and link to the filing.
  If the company is private and does not file with the SEC, return [].
- riskFactors: summarize the key risks the company itself discloses in the
  "Risk Factors" section (Item 1A) of its most recent 10-K, plus any material
  updates in the latest 10-Q. Capture the most significant ones across categories
  (regulatory, legal, market/competitive, operational, financial, cybersecurity,
  etc.), each in plain language with the filing as the source. If the company is
  private / does not file with the SEC, return [].
- regulatoryFilings: filings or actions with regulators relevant to the company's
  industry — e.g. OCC, SEC, FINRA, FDA, state regulators — including new license
  or charter applications. Include recent ones from the current year. Link to the source.
- majorCustomers: notable named customers or partners, with a source each.
- culture: a concise read on the company's culture as an employer, drawn from
  public sources (company careers page, Glassdoor, Comparably, LinkedIn, news,
  "best place to work" lists). Fill each field in plain language, citing a source:
  * rtoPolicy: current return-to-office stance — fully remote, hybrid (note days
    in office if stated), or office-first. Check the careers page and recent news.
  * benefits: notable benefits and perks (health coverage, 401(k)/retirement
    match, parental/family leave, PTO/unlimited PTO, equity, wellness, learning
    budget, etc.).
  * sentiment: overall employee sentiment — e.g. a Glassdoor/Comparably rating,
    "best place to work" recognition, and recurring themes in recent reviews.
  * workLifeBalance: assessment of hours, flexibility, and any burnout/crunch
    signals from reviews or reporting.
  * generalNotes: other cultural signals — stated values, DEI initiatives, team
    vibe, turnover, or notable culture-related controversies.
  Use "Not found" for any field you cannot source.
`.trim();
}

// The "fitAndAngle" section is the only part tailored to the user, and it is
// reframed entirely by the chosen intent. This keeps the app from defaulting to
// a job-candidate framing the user has explicitly ruled out.
function fitAndAngleGuidance(intent: ProfileIntent): string {
  switch (intent) {
    case "advisory":
      return `
Intent: I am evaluating this company as a potential ADVISORY CLIENT for Second
Line Labs, my solo advisory practice (fractional / advisory GRC & Tech Risk). I am
NOT looking to be hired full-time here. The question is whether they have a need my
practice could serve and whether they would buy advisory help. Fill "fitAndAngle":
- whyItCouldFitYou: 3-5 points on why they could be a strong advisory client —
  buying signals that map to what Second Line Labs offers: scaling fast, recent
  funding, entering or already in a regulated space, IPO / charter / audit pressure,
  a recent breach or incident, new or vacant senior risk/security leadership, a thin
  or nonexistent second line, or leadership churn in risk. Tie each to a concrete way
  my practice (standing up or maturing GRC, FAIR-based quantitative risk, board /
  regulator reporting, AI-native risk operating models) would help.
- watchOuts: 2-4 honest flags that would make them a poor or low-probability advisory
  client — an already-mature in-house risk function unlikely to bring in outside help,
  signs of no budget or financial distress, too small to need a real second line, or
  obvious conflicts.
- talkingPoints: 3-5 specific pitch angles — hooks tied to a recent, sourced event
  (funding, breach, regulatory filing, exec change) I could open an intro or scoping
  conversation with.
- questionsToAsk: 3-5 scoping / qualifying questions to size the engagement and confirm
  the need (who owns risk today, what triggered the need, budget and timeline, board or
  regulator pressure, in-house vs. fractional preference).`.trim();
    case "network":
      return `
Intent: I am evaluating this company as a NETWORK relationship — whether it is
worth my time and energy to build a connection here (warm intros, an advisor seat,
ongoing dialogue with leadership, mutual support). I am NOT evaluating it as a
job for myself, and I am NOT making a financial investment decision — do not
discuss capital, equity, returns, valuation, runway as an investment factor, or
diligence-for-investing. Fill "fitAndAngle":
- whyItCouldFitYou: 3-5 points on why this relationship could be worth building —
  who I would meet, alignment with my GRC / Tech Risk world, what we might learn
  from each other, and any natural edge I have for being useful to them (e.g. an
  advisor seat leveraging my background in a regulated space).
- watchOuts: 2-4 honest flags that would make this a poor use of relationship
  energy — values or reputation concerns, leadership churn that makes connections
  short-lived, irrelevance to my world, or signs they would not reciprocate.
- talkingPoints: 3-5 angles to build the relationship — who to know, warm-intro
  paths, and concrete value I could offer (e.g. an advisory seat on risk /
  compliance, intros from my network, a perspective on a current challenge).
- questionsToAsk: 3-5 questions to surface where the relationship could go — what
  they are wrestling with, who in their world I should know, how they prefer to
  collaborate with outside operators.`.trim();
    case "w2":
      return `
Intent: I am evaluating this company as a potential FULL-TIME (W2) role for myself.
Fill "fitAndAngle":
- whyItCouldFitYou: 3-5 points on whether this company matches what I would take a
  full-time seat for (size, sector, regulatory posture, whether it likely needs a real
  second-line GRC / Tech-Risk mandate with a TEAM to lead — not a solo IC seat).
- watchOuts: 2-4 honest flags I should weigh (recent layoffs, instability, legal /
  regulatory overhang, signs the role would be a solo IC seat or lack a real mandate).
- talkingPoints: 3-5 specific things I could raise in an interview.
- questionsToAsk: 3-5 smart, specific questions about the company or the role.`.trim();
  }
}

export function buildCompanyPrompt(
  company: string,
  detail?: string,
  intent: ProfileIntent = "advisory"
): string {
  const trimmed = detail?.trim();
  const disambiguation = trimmed
    ? `

Use this detail to identify the exact company (company names can be ambiguous):
"${trimmed}". If it is a website/domain or a stock ticker, treat it as the
authoritative anchor for the entity. If you cannot confirm the company matches
this detail, say so in "unknowns" rather than profiling a different company.`
    : "";

  return `
Research this company and produce a sourced profile.

Company: ${company}${disambiguation}

${recencyGuidance(
  "the company's foundational history — its founding date and IPO date — is inherently older and must still be captured."
)}

${companySchemaDescription()}

The factual sections above are objective and do NOT change based on my intent.
Only "fitAndAngle" is tailored to me, and it is framed entirely by my intent below.
Do NOT steer toward a full-time role unless the intent is explicitly W2.

${fitAndAngleGuidance(intent)}

About me (use ONLY for the fitAndAngle section):
${ABOUT_ME}

Remember: use web_search throughout (including SEC EDGAR and regulator sites where
relevant), source every fact, write "Not found" rather than guessing, and flag
anything low-confidence in "unknowns". End with the single \`\`\`json object and
nothing after it.
`.trim();
}
