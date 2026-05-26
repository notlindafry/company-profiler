import Anthropic from "@anthropic-ai/sdk";
import { MODEL, MAX_WEB_SEARCHES } from "./config";
import { SYSTEM_PROMPT, buildCompanyPrompt } from "./prompt";
import type { CompanyProfile, ProfileIntent } from "./schema";

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

export async function researchCompany(
  client: Anthropic,
  company: string,
  detail?: string,
  intent: ProfileIntent = "advisory"
): Promise<CompanyProfile> {
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: buildCompanyPrompt(company, detail, intent) },
  ];

  let finalMessage: Anthropic.Message | undefined;

  // Bounded search phase (2 passes). We use the direct web_search_20250305 tool
  // (no code-execution "dynamic filtering"), which is much faster per search;
  // that speed lets us afford medium effort + more searches for fuller coverage.
  for (let attempt = 0; attempt < 2; attempt++) {
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 16000,
      output_config: { effort: "medium" },
      system: SYSTEM_PROMPT,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
          max_uses: MAX_WEB_SEARCHES,
        },
      ],
      messages,
    });

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
        'Stop researching now. Using only what you have already found, output the final JSON object in a ```json fence. Mark anything you could not confirm as "Not found", and put low-confidence items in "unknowns". Do not request any more tools.',
    });
    finalMessage = await client.messages
      .stream({
        model: MODEL,
        max_tokens: 16000,
        output_config: { effort: "medium" },
        system: SYSTEM_PROMPT,
        messages,
      })
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

  const fullText = finalMessage.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  if (!fullText.trim()) {
    throw new Error("The model returned no readable text.");
  }

  const json = extractJson(fullText);

  try {
    return JSON.parse(json) as CompanyProfile;
  } catch {
    throw new Error("The model's response was not valid JSON.");
  }
}
