# Company Profiler

A small web app for sizing up a company. Type a **company** (optionally a website
or ticker to pin it), click **Research**, and the app searches the live web with
Claude and returns a clean, sourced profile you can read (and print) — products,
milestones (funding/IPO), controversies (breaches, lawsuits), 10-K/8-K highlights,
regulatory filings (e.g. OCC), major customers, and **two Fit & Angle sections**
that close the report — one for each lens: a full-time (W2) role and an advisory
client for your practice. The facts stay the same across both; only the Fit &
Angle reads differ, so you get every angle in a single profile with nothing to
select up front.

Built with Next.js + TypeScript + Tailwind CSS, using the Anthropic API with the
web search tool. The API key is read on the server only and is never exposed to
the browser.

---

## What's in here

- `app/page.tsx` — the home page (the form + results + "Print / Save as PDF").
- `app/api/profile/route.ts` — the server route that calls Claude. Your API key
  is only ever used here, on the server.
- `lib/config.ts` — **the one file you'll most likely edit.** It holds the model
  name and the "About me" text used to tailor the *Fit & Angle* section.
- `lib/prompt.ts` — the research instructions sent to Claude.
- `lib/schema.ts` — the single definition of the profile's shape (every section
  and field, with per-field guidance). The API enforces it, so the model must
  return exactly this shape — add or change fields here.
- `lib/research.ts` — the code that runs the web search and reads back the result.
- `components/CompanyView.tsx` — how the profile is displayed.

---

## Step 1 — Get an Anthropic API key

1. Go to <https://console.anthropic.com> and sign in (or create an account).
2. Add a payment method under **Billing** — web search and the model usage are
   paid. A single profile typically costs a few cents.
3. Open **Settings → API Keys → Create Key**. Copy the key (it starts with
   `sk-ant-`). You won't be able to see it again, so keep it somewhere safe.

## Step 2 — Run it on your own computer

1. Install [Node.js](https://nodejs.org) (version 18 or newer) if you don't have it.
2. In a terminal, from this folder, install the dependencies:
   ```
   npm install
   ```
3. Create a file named `.env.local` in this folder (copy `.env.example`) and put
   your key in it:
   ```
   ANTHROPIC_API_KEY=sk-ant-your-real-key-here
   ```
   This file is **gitignored**, so your key will never be committed.
4. Start the app:
   ```
   npm run dev
   ```
5. Open <http://localhost:3000> in your browser. Type a company (optionally a
   website or ticker), click **Research**, and wait — a profile usually takes a
   few minutes.

## Step 3 — Put it online with Vercel

1. Push this project to a GitHub repository (if it isn't already).
2. Go to <https://vercel.com>, sign in with GitHub, and click **Add New → Project**.
3. Select this repository and click **Import**. Vercel auto-detects Next.js — you
   don't need to change the build settings.
4. **Before deploying**, open **Settings → Environment Variables** and add:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** your `sk-ant-...` key
   - Apply it to Production (and Preview if you like).
5. Click **Deploy**. When it finishes, you'll get a public URL.

> **Note on timing:** research usually takes a few minutes. The server route is
> set to allow up to 600 seconds (`maxDuration` in `app/api/profile/route.ts`).
> Vercel's free **Hobby** plan caps server functions at 60 seconds; if research is
> cut off, upgrade the plan (and enable Fluid Compute) or lower how many searches
> Claude runs (`maxWebSearches` on each tier in `MODEL_OPTIONS`, `lib/config.ts`),
> or pick the lighter Sonnet tier.

---

## Privacy & access

- **Search engines:** the app tells search engines not to index it (via a
  `noindex` setting), so it should not show up in Google results.
- **Password gate:** to require a password, add an environment variable named
  `APP_PASSWORD` (in `.env.local` locally, and in Vercel → Settings → Environment
  Variables, for the **Production** environment) and redeploy. Once set, visitors
  must enter that password before they can run any search. The password is checked
  on the server, so it also blocks anyone trying to call the API directly.
- **Fails closed in production:** a deployed (production) build with no
  `APP_PASSWORD` set is treated as a misconfiguration — the page shows a "setup
  required" notice and the research API returns `503` instead of silently serving
  an open app on your API key. Set `APP_PASSWORD` to enable it. (Local
  development is intentionally left open so you don't need a password to run it on
  your machine.)
- **Verify it's on:** open the deployed URL in a private/incognito window — you
  should see the password screen. If you set `APP_PASSWORD` only for Preview (not
  Production), or to an empty value, the gate won't be active.

## Changing things later

- **Pick the model per run:** each search has an *Analysis depth* selector —
  Sonnet 4.6 (faster, cheaper) or Opus 4.8 (most capable, most expensive). To
  add, remove, or swap the offered models (or change the default), edit
  `MODEL_OPTIONS` / `DEFAULT_MODEL_TIER` in `lib/config.ts`.
- **Update your background** (for the *Fit & Angle* section): edit `ABOUT_ME` in
  `lib/config.ts`. It feeds both lenses, so keep both your advisory practice
  and your W2 criteria there.
- **Add / rename / reword the evaluation lenses:** edit `INTENTS` (section title
  and field labels) in `lib/schema.ts` and the matching per-lens guidance in
  `fitAndAngleGuidance` in `lib/prompt.ts`. Every profile renders one Fit & Angle
  section per lens, in the order they appear in `INTENTS`.
- **Make research faster/cheaper or more thorough:** each model tier in
  `MODEL_OPTIONS` (`lib/config.ts`) carries its own `effort` and `maxWebSearches`
  — tune those to trade cost for depth, or add a new tier.

## A note on trust

The app instructs Claude to source every factual claim with a link, to use only
**publicly available** information (never logging in or scraping), and to write
"Not found" rather than guess. Anything uncertain is listed under
**Unknowns / low-confidence**. Always click through the `[source]` links to
verify anything important.
