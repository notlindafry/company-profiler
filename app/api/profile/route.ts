import Anthropic from "@anthropic-ai/sdk";
import { cookies } from "next/headers";
import { researchCompany } from "@/lib/research";
import { DEFAULT_INTENT, isProfileIntent } from "@/lib/schema";
import { COOKIE_NAME, isAuthorized } from "@/lib/auth";

// Run on the Node.js runtime (the Anthropic SDK needs it). Thorough live-web
// research can run several minutes, so allow a long ceiling. Pro with Fluid
// Compute supports up to ~800s; if a deploy rejects this value or lookups still
// cut off at ~5 min, enable Fluid Compute in Vercel (Settings -> Functions).
export const runtime = "nodejs";
export const maxDuration = 600;

function describeError(err: unknown): string {
  if (err instanceof Anthropic.APIError) {
    const detail =
      err.error && typeof err.error === "object"
        ? JSON.stringify(err.error)
        : err.message;
    return `Research provider error (${err.status ?? "?"}): ${detail}`.slice(0, 500);
  }
  if (err instanceof Error) return err.message || err.name;
  if (typeof err === "string") return err;
  return "Something went wrong during research.";
}

export async function POST(req: Request) {
  // --- Pre-stream checks: these can still return real HTTP status codes. ---
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "Server is missing ANTHROPIC_API_KEY. See the README setup steps." },
      { status: 500 }
    );
  }

  // Enforce the password gate here too, so the API (and your budget) is
  // protected even if someone calls it directly without the web page.
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

  const { company, detail, intent } = (body ?? {}) as {
    company?: string;
    detail?: string;
    intent?: string;
  };

  if (!company?.trim()) {
    return Response.json({ error: "Please provide a company." }, { status: 400 });
  }

  const client = new Anthropic();
  const trimmedCompany = company.trim();
  const trimmedDetail = detail?.trim() || undefined;
  const resolvedIntent = isProfileIntent(intent) ? intent : DEFAULT_INTENT;

  // --- Stream newline-delimited JSON. Research takes minutes, so we emit
  // periodic {"type":"ping"} keep-alives to stop the connection going idle and
  // being dropped (which surfaces as "failed to fetch"), then a final
  // {"type":"result",...} or {"type":"error",...}. ---
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
        } catch {
          // Controller already closed — nothing to do.
        }
      };

      send({ type: "ping" }); // flush something immediately
      const heartbeat = setInterval(() => send({ type: "ping" }), 15000);

      try {
        const profile = await researchCompany(
          client,
          trimmedCompany,
          trimmedDetail,
          resolvedIntent
        );
        send({ type: "result", profile });
      } catch (err) {
        console.error("Research failed:", err);
        send({ type: "error", error: describeError(err) });
      } finally {
        clearInterval(heartbeat);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
