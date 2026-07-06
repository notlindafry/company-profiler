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

// JSON Schema derived from the one Zod schema. zodOutputFormat's transform emits
// the API-accepted shape (per-field descriptions, $defs/$ref, required) — we
// reuse just that schema as the input schema of the emit_profile tool below.
const PROFILE_INPUT_SCHEMA = zodOutputFormat(CompanyProfileSchema)
  .schema as Anthropic.Tool.InputSchema;

// The model returns the finished profile by calling this tool once. It is a
// plain (non-strict) tool: the schema and its field descriptions still steer the
// model, but — unlike output_config.format (strict structured outputs) — a
// non-strict tool does NOT compile a constrained-decoding grammar. That matters
// because this schema is large enough that strict structured outputs overflow
// the API's grammar-size cap ("The compiled grammar is too large ..."), which
// 400s the whole request. The tool_use.input comes back already parsed into an
// object; CompanyProfileSchema re-validates it before anything trusts the shape.
const PROFILE_TOOL_NAME = "emit_profile";
const PROFILE_TOOL: Anthropic.Tool = {
  name: PROFILE_TOOL_NAME,
  description:
    "Return the finished company profile as a single structured object. Call this exactly once, using only what you have already researched.",
  input_schema: PROFILE_INPUT_SCHEMA,
};

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
  modelTier?: string,
  aboutMe?: string
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
    { role: "user", content: buildCompanyPrompt(company, detail, aboutMe) },
  ];

  // --- Search phase (up to 2 passes) ---
  // The web_search tool always attaches citations to the model's answer, and
  // citations are incompatible with structured outputs (output_config.format):
  // sending both in one request makes the API reject it with a 400. So the
  // search passes run the tool WITHOUT a format, and the tool-free finalization
  // pass below is the one that emits the constrained JSON.
  //
  // We use the direct web_search_20250305 tool (no code-execution "dynamic
  // filtering"), which is much faster per search; effort and the per-pass search
  // budget come from the selected model tier.
  for (let attempt = 0; attempt < 2; attempt++) {
    const searchMessage = await client.messages
      .stream(
        {
          model,
          max_tokens: 16000,
          output_config: { effort },
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
      )
      .finalMessage();

    // Keep the research (the model's notes plus the web-search results) in the
    // transcript so the finalization pass can write the profile from it.
    messages.push({ role: "assistant", content: searchMessage.content });

    // pause_turn = the model wants to keep searching; loop and let it continue.
    // Anything else (end_turn, refusal, max_tokens) ends the search phase.
    if (searchMessage.stop_reason !== "pause_turn") break;
  }

  // --- Finalization pass ---
  // Drop web_search (so no citations, which are incompatible with a constrained
  // final answer) and have the model emit the profile via the emit_profile tool.
  // We force that tool instead of using output_config.format because this
  // schema is too large to compile into a strict decoding grammar — see
  // PROFILE_TOOL above. This pass always runs: it's what turns the gathered
  // research into the structured profile (gaps become "Not found").
  messages.push({
    role: "user",
    content:
      'Stop researching now. Using only what you have already found, return the final profile by calling the `emit_profile` tool exactly once. Mark anything you could not confirm as "Not found", and put low-confidence items in "unknowns". Do not run any more web searches.',
  });

  // No cache_control here: this pass swaps the tools list (web_search out,
  // emit_profile in), which invalidates the prompt cache anyway — a marker would
  // only add the cache-write surcharge with nothing ever reading it back.
  // thinking is disabled: turning research into JSON needs no new reasoning, and
  // disabling it keeps a forced tool_choice valid across the supported models.
  const finalMessage = await client.messages
    .stream(
      {
        model,
        max_tokens: 16000,
        output_config: { effort },
        thinking: { type: "disabled" },
        system,
        tools: [PROFILE_TOOL],
        tool_choice: { type: "tool", name: PROFILE_TOOL_NAME },
        messages,
      },
      requestOptions
    )
    .finalMessage();

  if (finalMessage.stop_reason === "refusal") {
    throw new Error(
      "The model declined to answer this request. Try a different company."
    );
  }

  // Output hit the max_tokens ceiling — the tool input is cut off mid-object, so
  // fail with a clear message instead of a confusing validation error.
  if (finalMessage.stop_reason === "max_tokens") {
    throw new Error(
      "The profile was cut off before it finished. Please try again."
    );
  }

  // The finished profile is the forced tool call's input — the SDK has already
  // parsed it from JSON into an object, so there is no text/fences to handle.
  const toolUse = finalMessage.content.find(
    (block): block is Anthropic.ToolUseBlock =>
      block.type === "tool_use" && block.name === PROFILE_TOOL_NAME
  );
  if (!toolUse) {
    throw new Error("The model did not return a profile. Please try again.");
  }

  // The emit_profile schema is advisory (non-strict tool), so the input isn't
  // grammar-guaranteed — validate it against CompanyProfileSchema so everything
  // after this line can trust the shape completely.
  const validated = CompanyProfileSchema.safeParse(toolUse.input);
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
