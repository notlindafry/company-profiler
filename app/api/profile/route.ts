import Anthropic from "@anthropic-ai/sdk";
import { cookies } from "next/headers";
import { researchExecutive, researchCompany } from "@/lib/research";
import { COOKIE_NAME, isAuthorized } from "@/lib/auth";

// Run on the Node.js runtime (the Anthropic SDK needs it), and give the
// function room to finish — research can take 20-60 seconds. On Vercel's Hobby
// plan this is capped lower; see the README for plan notes.
export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "Server is missing ANTHROPIC_API_KEY. See the README setup steps." },
      { status: 500 }
    );
  }

  // Enforce the password gate here too, so the API (and your API budget) is
  // protected even if someone calls it directly without using the web page.
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!isAuthorized(token)) {
    return Response.json(
      { error: "Not authorized. Please enter the password." },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const { name, company, detail } = (body ?? {}) as {
    name?: string;
    company?: string;
    detail?: string;
  };

  if (!company?.trim()) {
    return Response.json(
      { error: "Please provide a company." },
      { status: 400 }
    );
  }

  const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

  try {
    // With a name: research the executive. Name left blank: research the company.
    if (name?.trim()) {
      const profile = await researchExecutive(
        client,
        name.trim(),
        company.trim(),
        detail?.trim() || undefined
      );
      return Response.json({ kind: "executive", profile });
    }
    const profile = await researchCompany(client, company.trim());
    return Response.json({ kind: "company", profile });
  } catch (err) {
    console.error("Research failed:", err);
    const message =
      err instanceof Error ? err.message : "Something went wrong during research.";
    return Response.json({ error: message }, { status: 502 });
  }
}
