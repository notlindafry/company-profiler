import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import {
  DEFAULT_MODEL_TIER,
  RESULT_CACHE_TTL_MS,
  resolveModel,
} from "./config";
import { buildSystemPrompt, buildCompanyPrompt } from "./prompt";
import { sanitizeProfile } from "./sanitize";
import { cacheGet, cacheSet } from "./cache";
import { CompanyProfileSchema, type CompanyProfile } from "./schema";

// Structured-output format derived from the one Zod schema. Sent with every
// request so the API constrains the model's final answer to exactly this
// shape — no fences, no prose, guaranteed-parseable JSON.
const PROFILE_FORMAT = zodOutputFormat(CompanyProfileSchema);

// The model is part of the key: a profile produced by Sonnet must not be served
// for an Opus request (or vice versa), since the chosen model is the whole point.
function cacheKey(
  company: string,
  detail: string | undefined,
  model: string
): string {
  return `${model} ${company.toLowerCase()} ${(detail ?? "").toLowerCase()}`;
}

export async function researchCompany(
  client: Anthropic,
  company: string,
  detail?: string,
  signal?: AbortSignal,
  modelTier?: string
): Promise<CompanyProfile> {
  // Resolve the requested tier to a concrete, validated model option (falls back
  // to the default for anything unrecognized). The option carries the model ID
  // plus the cost/depth knobs (effort, search budget) for this run.
  const { id: model, effort, maxWebSearches, thorough } = resolveModel(
    modelTier ?? DEFAULT_MODEL_TIER
  );
  // Premium tiers get the deep-research system prompt; default tiers the fast one.
  const system = buildSystemPrompt(thorough);

  // Reuse a recent identical result instead of re-running the expensive pipeline.
  const key = cacheKey(company, detail, model);
  const cached = cacheGet<CompanyProfile>(key);
  if (cached) return cached;

  // Pass the caller's AbortSignal to every model call so a timeout or client
  // disconnect actually stops the (billable) work in flight.
  const requestOptions = signal ? { signal } : undefined;

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: buildCompanyPrompt(company, detail) },
  ];

  let finalMessage: Anthropic.Message | undefined;

  // Bounded search phase (2 passes). We use the direct web_search_20250305 tool
  // (no code-execution "dynamic filtering"), which is much faster per search;
  // effort and the per-pass search budget come from the selected model tier.
  for (let attempt = 0; attempt < 2; attempt++) {
    const stream = client.messages.stream(
      {
        model,
        max_tokens: 16000,
        output_config: { effort, format: PROFILE_FORMAT },
        // Cache the prompt so continuation passes (which re-send the whole
        // transcript, including all web-search results) bill the repeated
        // prefix at ~10% of the normal input price instead of full price.
        cache_control: { type: "ephemeral" },
        system,
        tools: [
          {
            type: "web_search_20250305",
            name: "web_search",
            max_uses: maxWebSearches,
          },
        ],
        messages,
      },
      requestOptions
    );

    finalMessage = await stream.finalMessage();

    if (finalMessage.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: finalMessage.content });
      continue;
    }
    break;
  }

  // Still wants to search? Force a final answer with NO tools, so the model must
  // write the profile from what it already gathered (gaps -> "Not found").
  if (finalMessage && finalMessage.stop_reason === "pause_turn") {
    messages.push({
      role: "user",
      content:
        'Stop researching now. Using only what you have already found, output the final profile. Mark anything you could not confirm as "Not found", and put low-confidence items in "unknowns". Do not request any more tools.',
    });
    // No cache_control here: this pass drops the tools list, and changing the
    // tool set invalidates the prompt cache anyway — a marker would only add
    // the cache-write surcharge with nothing ever reading it back.
    finalMessage = await client.messages
      .stream(
        {
          model,
          max_tokens: 16000,
          output_config: { effort, format: PROFILE_FORMAT },
          system,
          messages,
        },
        requestOptions
      )
      .finalMessage();
  }

  if (!finalMessage) {
    throw new Error("No response from the model.");
  }

  if (finalMessage.stop_reason === "refusal") {
    throw new Error(
      "The model declined to answer this request. Try a different company."
    );
  }

  // Output hit the max_tokens ceiling — the JSON is cut off mid-object, so
  // fail with a clear message instead of a confusing parse error.
  if (finalMessage.stop_reason === "max_tokens") {
    throw new Error(
      "The profile was cut off before it finished. Please try again."
    );
  }

  // With structured outputs, the final text IS the JSON object — no fences.
  const fullText = finalMessage.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  if (!fullText.trim()) {
    throw new Error("The model returned no readable text.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(fullText);
  } catch {
    throw new Error("The model's response was not valid JSON. Please try again.");
  }

  // The API already constrains the output to CompanyProfileSchema; this
  // re-validation is a cheap belt-and-suspenders check so everything after
  // this line can trust the shape completely.
  const validated = CompanyProfileSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(
      "The model's response did not match the expected profile format. Please try again."
    );
  }

  // The schema can't enforce link safety — strip non-http(s) URLs and junk
  // entries before the UI renders anything.
  const profile = sanitizeProfile(validated.data);
  cacheSet(key, profile, RESULT_CACHE_TTL_MS);
  return profile;
}
