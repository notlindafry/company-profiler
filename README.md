# Company Profiler

A small web app for sizing up a company. Type a **company** (optionally a website
or ticker to pin it), click **Research**, and the app searches the live web with
Claude and returns a clean, sourced profile you can read (and print) — products,
milestones (funding/IPO), controversies (breaches, lawsuits), 10-K/8-K highlights,
regulatory filings (e.g. OCC), major customers, and a **Fit & Angle** section that
closes the report with how the company stacks up as a full-time role for *you*,
tailored to the background you provide. (You can optionally turn on a second
"advisory / consulting client" angle too — see *Make it your own* below.)

**None of your personal details live in the code.** Your name, your background,
and your API key are all things you plug in yourself, so it's easy to stand up
your own copy without touching any files — see **[Make it your own](#make-it-your-own)**.

Built with Next.js + TypeScript + Tailwind CSS, using the Anthropic API with the
web search tool. The API key is read on the server only and is never exposed to
the browser.

---

## Make it your own

**No coding required.** You set up your own copy by filling in a short web form —
your name, your API key, a password, and a few lines about your background. That's
it. Everyone's copy uses their *own* key and their *own* details; nothing is shared.

You'll do this in three short stages, all in a web browser — no terminal, no
coding. Budget about 15 minutes the first time.

### Stage 1 — Get an Anthropic API key (your "token")

1. Go to <https://console.anthropic.com> and sign in (or create a free account).
2. Add a payment method under **Billing** — web search and model usage are paid.
   A single profile typically costs only a few cents.
3. Open **Settings → API Keys → Create Key**. Copy the key (it starts with
   `sk-ant-`). You won't be able to see it again, so paste it somewhere safe for now.

### Stage 2 — Put these files in your own GitHub account

1. Create a free account at <https://github.com> if you don't have one.
2. Click the **+** at the top-right → **New repository**. Give it any name
   (e.g. `company-profiler`), leave everything else as-is, and click
   **Create repository**.
3. On the new empty repository's page, click **uploading an existing file**
   (the link in the "…or upload" line). Drag **all the files and folders from
   this project** into the page, then click **Commit changes**.

That's now *your* private copy. Nothing here contains anyone else's key or info.

### Stage 3 — Put it online with Vercel and fill in your details

1. Go to <https://vercel.com> and **Sign up** with your GitHub account (free).
2. Click **Add New → Project**, find the repository you just created, and click
   **Import**. Vercel auto-detects everything — don't change the build settings.
3. Open the **Environment Variables** section and add these four (type the name on
   the left, paste the value on the right, click **Add** after each):

   | Name | Value to put |
   | --- | --- |
   | `ANTHROPIC_API_KEY` | Your own key from Stage 1 (starts with `sk-ant-`). |
   | `APP_PASSWORD` | Any password you choose — you'll type it to open your site. |
   | `NEXT_PUBLIC_OWNER_NAME` | Your first name (the title becomes "*Name*'s Company Profiler"). |
   | `ABOUT_ME` | A few lines about you — your level/seniority, the kind of role you want, your field, and what makes a company a good fit. (You can paste a short paragraph.) |

4. Click **Deploy** and wait a minute. You'll get your own private web address.
   Open it, type the password you chose, and start researching companies.

> **Want to change your name or background later?** In Vercel, open your project →
> **Settings → Environment Variables**, edit the value, then **Deployments →
> Redeploy**. You never touch any code.

---

## What's in here

- `app/page.tsx` — the home page (the form + results + "Print / Save as PDF").
- `app/api/profile/route.ts` — the server route that calls Claude. Your API key
  is only ever used here, on the server.
- `lib/config.ts` — settings and tuning: the offered models, cost/rate guards, and
  how the personalization (your name, background, optional advisory lens) is read
  from environment variables. You set the personal values as env vars (see *Make it
  your own*), not by editing this file.
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
3. Create a file named `.env.local` in this folder (copy `.env.example`) and fill
   it in:
   ```
   ANTHROPIC_API_KEY=sk-ant-your-real-key-here
   NEXT_PUBLIC_OWNER_NAME=YourFirstName
   ABOUT_ME="A few lines about your background and the role you want."
   ```
   This file is **gitignored**, so your key and details are never committed.
   (`APP_PASSWORD` is optional locally; see *Privacy & access*. The advisory lens
   variables are optional too — see *Changing things later*.)
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
   - `ANTHROPIC_API_KEY` — your `sk-ant-...` key
   - `APP_PASSWORD` — a password you choose (required once it's live)
   - `NEXT_PUBLIC_OWNER_NAME` — your first name
   - `ABOUT_ME` — a few lines about your background
   - Apply them to Production (and Preview if you like).
5. Click **Deploy**. When it finishes, you'll get a public URL.

> Not a developer? You don't need this section — follow
> **[Make it your own](#make-it-your-own)** at the top instead; it's the same thing
> in plain language, all in the browser.

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
- **Update your background** (for the *Fit & Angle* section): change the `ABOUT_ME`
  environment variable (Vercel → Settings → Environment Variables, or `.env.local`
  locally), then redeploy. No code editing.
- **Change the title:** set `NEXT_PUBLIC_OWNER_NAME` to your name (the header reads
  "*Name*'s Company Profiler"). Leave it blank for a plain "Company Profiler".
- **Turn on a second "advisory / consulting" angle:** set
  `NEXT_PUBLIC_ENABLE_ADVISORY_LENS=true`. Each profile then closes with two reads —
  one as a full-time role, one as a potential advisory/consulting client — instead
  of just the full-time read. Optionally set `NEXT_PUBLIC_ADVISORY_NAME` to your
  practice's name to label that section.
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
