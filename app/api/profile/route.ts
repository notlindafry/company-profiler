import Anthropic from "@anthropic-ai/sdk";
import { cookies } from "next/headers";
import { researchCompany } from "@/lib/research";
import { COOKIE_NAME, isAuthorized } from "@/lib/auth";
import {
  PROFILE_RATE_LIMIT,
  PROFILE_RATE_WINDOW_MS,
  PROFILE_MAX_CONCURRENT,
} from "@/lib/config";
import { rateLimit, acquireSlot, releaseSlot, clientIp } from "@/lib/ratelimit";
import {
  readJsonBody,
  sanitizeInput,
  MAX_COMPANY_LEN,
  MAX_DETAIL_LEN,
} from "@/lib/validation";

// Run on the Node.js runtime (the Anthropic SDK needs it). Thorough live-web
// research can run several minutes, so allow a long ceiling. Pro with Fluid
// Compute supports up to ~800s; if a deploy rejects this value or lookups still
// cut off at ~5 min, enable Fluid Compute in Vercel (Settings -> Functions).
export const runtime = "nodejs";
export const maxDuration = 600;

// Returns a safe, user-facing message. Full error details are logged
// server-side by the caller; we deliberately avoid echoing provider internals
// (raw API error bodies) back to the client.
function describeError(err: unknown): string {
  if (err instanceof Anthropic.APIError) {
    const status = err.status ?? 0;
    if (status === 429) return "The research provider is rate limiting requests. Please try again shortly.";
    if (status >= 500) return "The research provider had a temporary error. Please try again.";
    return "The research request could not be completed. Please try again.";
  }
  // Our own thrown errors carry intentionally user-safe messages.
  if (err instanceof Error && err.message) return err.message;
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

  // Per-IP rate limit: each run is expensive, so cap how many a single client
  // can start in a window even with a valid password.
  const ip = clientIp(req);
  const limited = rateLimit(`profile:${ip}`, PROFILE_RATE_LIMIT, PROFILE_RATE_WINDOW_MS);
  if (!limited.ok) {
    return Response.json(
      { error: "Too many research requests. Please wait a bit and try again." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
  }

  const body = await readJsonBody(req);
  if (!body.ok) {
    return Response.json({ error: body.error }, { status: body.status });
  }

  const { company, detail } = (body.data ?? {}) as {
    company?: string;
    detail?: string;
  };

  if (!company?.trim()) {
    return Response.json({ error: "Please provide a company." }, { status: 400 });
  }

  const client = new Anthropic();
  const trimmedCompany = sanitizeInput(company, MAX_COMPANY_LEN);
  const trimmedDetail = detail ? sanitizeInput(detail, MAX_DETAIL_LEN) || undefined : undefined;

  if (!trimmedCompany) {
    return Response.json({ error: "Please provide a company." }, { status: 400 });
  }

  // Cap concurrent in-flight runs per IP so the rate-limit window can't be
  // sidestepped by firing many simultaneous long-running requests.
  const slotKey = `profile:${ip}`;
  if (!acquireSlot(slotKey, PROFILE_MAX_CONCURRENT)) {
    return Response.json(
      { error: "Too many concurrent research requests. Please wait for the current one to finish." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

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

      // Abort the (billable) model work on timeout OR if the client disconnects,
      // so we stop paying for a result no one is waiting for.
      const ac = new AbortController();
      const onClientAbort = () => ac.abort();
      req.signal?.addEventListener("abort", onClientAbort, { once: true });

      // Fire before the function's infrastructure ceiling so the client always
      // gets a clean {"type":"error"} frame instead of a bare TCP drop.
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          ac.abort();
          reject(new Error("Research timed out — the company may be too complex. Try reducing the scope or searching again."));
        }, 540_000); // 9 min, safely inside the 600s maxDuration ceiling
      });

      try {
        const profile = await Promise.race([
          researchCompany(client, trimmedCompany, trimmedDetail, ac.signal),
          timeoutPromise,
        ]);
        send({ type: "result", profile });
      } catch (err) {
        console.error("Research failed:", err);
        send({ type: "error", error: describeError(err) });
      } finally {
        ac.abort(); // stop any still-running model call
        req.signal?.removeEventListener("abort", onClientAbort);
        clearTimeout(timeoutId);
        clearInterval(heartbeat);
        releaseSlot(slotKey);
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
