import Anthropic from "@anthropic-ai/sdk";
import { researchExecutive } from "@/lib/research";

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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const { name, company } = (body ?? {}) as { name?: string; company?: string };

  if (!name?.trim() || !company?.trim()) {
    return Response.json(
      { error: "Please provide both an executive name and a company." },
      { status: 400 }
    );
  }

  const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

  try {
    const profile = await researchExecutive(client, name.trim(), company.trim());
    return Response.json({ profile });
  } catch (err) {
    console.error("Research failed:", err);
    const message =
      err instanceof Error ? err.message : "Something went wrong during research.";
    return Response.json({ error: message }, { status: 502 });
  }
}
