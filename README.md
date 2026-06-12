# Company Profiler — Setup Guide

This tool researches any company on the live web and gives you a clean, sourced
profile to help with your job search — what they do, recent news, layoffs,
controversies, company culture, open roles, and a tailored "is this a good fit for
*me*?" read based on the background you provide.

**No coding required.** Setup takes about 15 minutes, all in your web browser.

---

## Step 1 — Get your own Anthropic API key

This tool uses Anthropic's AI to do the research. You need your own key (think of
it like an account) so the searches run on your dime, not anyone else's.

1. Go to **console.anthropic.com** and create a free account.
2. Click **Billing** in the left sidebar and add a credit card. You'll only be
   charged for what you use — a single company profile typically costs a few cents.
3. Click **Settings → API Keys → Create Key**. Copy the key that appears (it starts
   with `sk-ant-`). **Save it somewhere safe** — you can only see it once.

---

## Step 2 — Make your own copy on GitHub

GitHub is a free website that stores the tool's files. You'll make your own copy
of this template with one click, so it lives in *your* account.

1. Create a free account at **github.com** if you don't have one (sign up with
   your email).
2. Go to the template page: **https://github.com/notlindafry/companyprofiler-template**
3. Click the green **"Use this template"** button near the top-right, then choose
   **Create a new repository**.
4. Give it any name (e.g. `company-profiler`), make sure it's set to **Private** or
   **Public** (either is fine), and click **Create repository**.

GitHub instantly makes your own clean copy. (No downloading or uploading files.)

---

## Step 3 — Put it online and fill in your details

Vercel is a free service that turns your GitHub files into a live website. This is
also where you enter your personal details — your name, API key, and a short bio.

1. Go to **vercel.com** and click **Sign Up**. Choose **Continue with GitHub** so
   it connects to the account you just used.
2. Once in, click **Add New → Project**. Find the repository you created in Step 2
   (the copy named e.g. `company-profiler`) and click **Import**.
3. Vercel auto-detects everything — **don't change any build settings**.
4. Scroll down to the **Environment Variables** section. You'll add four variables
   here. For each one: type the name in the left box, paste the value in the right
   box, and click **Add**.

   | Name | What to put |
   |---|---|
   | `ANTHROPIC_API_KEY` | The key you copied in Step 1 (starts with `sk-ant-`). |
   | `APP_PASSWORD` | Any password you choose — you'll type this to open your site. |
   | `NEXT_PUBLIC_OWNER_NAME` | Your first name. The title will say "*Name*'s Company Profiler". |
   | `ABOUT_ME` | A short paragraph about you — your job level, the kind of role you're looking for, your field, what makes a company a good fit, and your location or remote preference. **Don't want to write it yourself?** Open `CUSTOMIZE-ME-PROMPT.txt` — paste it into any AI chat and it will interview you and write this for you. |

5. Click **Deploy**. Wait about a minute while it builds.
6. When it's done, Vercel gives you a URL. Open it, type the password you chose,
   and you're in.

---

## Changing your details later

You never need to edit any files. To update your name, password, API key, or bio:

1. Go to **vercel.com** → open your project → **Settings → Environment Variables**.
2. Click the variable you want to change, update the value, and save.
3. Go to **Deployments**, click the three-dot menu on the latest deployment, and
   choose **Redeploy**.

Your site will update within a minute.

---

## A few good-to-knows

- **Cost:** each profile run costs a few cents. The Vercel hosting is free.
- **Privacy:** the site tells search engines not to index it, and the password gate
  means only people with your password can run searches.
- **Timing:** research usually takes 1–3 minutes. If it times out, try the lighter
  "Sonnet" model in the Analysis depth selector.
- **Accuracy:** the tool sources every claim with a link. Always click through the
  `[source]` links to verify anything important before an interview.

---

<details>
<summary>Technical details (for developers)</summary>

Built with Next.js 15 + TypeScript + Tailwind CSS, using the Anthropic API with
the `web_search` tool and structured outputs (Zod schema).

**Personalization is entirely env-driven** — no PII in the source:

| Variable | Scope | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | Server only | Anthropic API key |
| `APP_PASSWORD` | Server only | Password gate |
| `ABOUT_ME` | Server only | Tailors the Fit & Angle prompt |
| `NEXT_PUBLIC_OWNER_NAME` | Client + server | Display name in the UI title |
| `NEXT_PUBLIC_ENABLE_ADVISORY_LENS` | Client + server | Set to `"true"` to add a second advisory/consulting lens |
| `NEXT_PUBLIC_ADVISORY_NAME` | Client + server | Label for the advisory lens (optional) |

Key files: `lib/config.ts` (settings), `lib/prompt.ts` (Claude instructions),
`lib/schema.ts` (profile shape), `lib/research.ts` (web search pipeline),
`components/CompanyView.tsx` (rendering).

Vercel Hobby plan caps server functions at 60 seconds. For deep research (Opus
tier), upgrade to Pro and enable Fluid Compute, or reduce `maxWebSearches` in
`MODEL_OPTIONS` in `lib/config.ts`.

</details>
