import Anthropic from "@anthropic-ai/sdk";
import { MODEL, MAX_WEB_SEARCHES, RESEARCH_EFFORT } from "./config";
import {
  SYSTEM_PROMPT,
  buildExecutivePrompt,
  buildCompanyPrompt,
} from "./prompt";
import type { ExecutiveProfile, CompanyProfile } from "./schema";

// Pull the JSON object out of Claude's final answer. We instruct the model to
// wrap it in a ```json fence; we take the LAST fenced block (the final answer),
// and fall back to the outermost { ... } if no fence is present.
function extractJson(text: string): string {
  const fences = [...text.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)];
  const candidate = fences.length ? fences[fences.length - 1][1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Could not find a JSON object in the model's response.");
  }
  return candidate.slice(start, end + 1);
}

// Stop research before the serverless function's hard limit (300s) so we can
// return a clear message instead of being killed mid-flight.
const RESEARCH_BUDGET_MS = 240_000;

// Shared research loop: send the prompt, let the web search tool run, and parse
// the JSON profile out of the final message. Used for both executive and
// company lookups.
async function runResearch<T>(client: Anthropic, prompt: string): Promise<T> {
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: prompt },
  ];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RESEARCH_BUDGET_MS);

  let finalMessage: Anthropic.Message | undefined;

  try {
    // The web search tool runs a server-side loop. If it hits its internal
    // iteration cap it returns stop_reason "pause_turn"; we re-send to continue.
    // Capped at a couple of attempts so a thorough subject can't spiral.
    for (let attempt = 0; attempt < 2; attempt++) {
      const stream = client.messages.stream(
        {
          model: MODEL,
          max_tokens: 16000,
          // Effort is configurable in lib/config.ts; lower finishes faster.
          output_config: { effort: RESEARCH_EFFORT },
          system: SYSTEM_PROMPT,
          tools: [
            {
              type: "web_search_20260209",
              name: "web_search",
              max_uses: MAX_WEB_SEARCHES,
            },
          ],
          messages,
        },
        { signal: controller.signal }
      );

      finalMessage = await stream.finalMessage();

      if (finalMessage.stop_reason === "pause_turn") {
        messages.push({ role: "assistant", content: finalMessage.content });
        continue;
      }
      break;
    }

    // If it still wants to keep searching, force a final answer: re-send with
    // searching disabled so the model MUST output the JSON from what it has.
    if (finalMessage && finalMessage.stop_reason === "pause_turn") {
      messages.push({
        role: "user",
        content:
          'Stop researching now. Using only what you have already found, output the final JSON object in a ```json fence. Mark anything you could not confirm as "Not found", and put low-confidence items in "unknowns". Do not request any more tools.',
      });
      const wrapUp = client.messages.stream(
        {
          model: MODEL,
          max_tokens: 16000,
          output_config: { effort: RESEARCH_EFFORT },
          system: SYSTEM_PROMPT,
          tools: [
            {
              type: "web_search_20260209",
              name: "web_search",
              max_uses: MAX_WEB_SEARCHES,
            },
          ],
          tool_choice: { type: "none" },
          messages,
        },
        { signal: controller.signal }
      );
      finalMessage = await wrapUp.finalMessage();
    }
  } catch (err) {
    if (controller.signal.aborted) {
      throw new Error(
        "Research took too long for this subject and was stopped. Try researching the person and the company separately, or remove the extra detail field."
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (!finalMessage) {
    throw new Error("No response from the model.");
  }

  if (finalMessage.stop_reason === "refusal") {
    throw new Error(
      "The model declined to answer this request. Try a different name or company."
    );
  }

  // Gather all text the model produced; the final JSON lives in the last fence.
  const fullText = finalMessage.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  if (!fullText.trim()) {
    throw new Error("The model returned no readable text.");
  }

  const json = extractJson(fullText);

  try {
    return JSON.parse(json) as T;
  } catch {
    throw new Error("The model's response was not valid JSON.");
  }
}

export function researchExecutive(
  client: Anthropic,
  name: string,
  company: string,
  detail?: string
): Promise<ExecutiveProfile> {
  return runResearch<ExecutiveProfile>(
    client,
    buildExecutivePrompt(name, company, detail)
  );
}

export function researchCompany(
  client: Anthropic,
  company: string
): Promise<CompanyProfile> {
  return runResearch<CompanyProfile>(client, buildCompanyPrompt(company));
}
