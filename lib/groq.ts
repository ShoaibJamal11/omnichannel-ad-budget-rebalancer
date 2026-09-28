import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Preferred models in priority order.
 * resolveModel() picks the first one that's currently active on Groq.
 */
const PREFERRED_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "llama-3.2-3b-preview",
  "mixtral-8x7b-32768",
] as const;

let cachedModelId: string | null = null;

/**
 * Dynamically resolve the best available model from the Groq fleet.
 * Caches the result for the lifetime of the serverless function instance.
 */
export async function resolveModel(): Promise<string> {
  if (cachedModelId) return cachedModelId;

  try {
    const list = await groq.models.list();
    const activeIds = new Set(
      list.data
        .filter((m: any) => m.active !== false)
        .map((m: any) => m.id)
    );

    for (const preferred of PREFERRED_MODELS) {
      if (activeIds.has(preferred)) {
        cachedModelId = preferred;
        return preferred;
      }
    }

    // Fallback: first active model in the fleet
    const fallback = list.data.find((m: any) => m.active !== false);
    cachedModelId = fallback?.id ?? PREFERRED_MODELS[0];
  } catch {
    // If the models endpoint fails, use the top preferred model directly
    cachedModelId = PREFERRED_MODELS[0];
  }

  return cachedModelId!;
}

/**
 * Strip markdown code fences and parse JSON robustly.
 * Handles ```json ... ```, bare ``` ... ```, and leading/trailing whitespace.
 */
export function cleanAndParseJSON(raw: string): any {
  let cleaned = raw.trim();

  // Strip markdown code blocks (```json ... ``` or ``` ... ```)
  cleaned = cleaned
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();

  return JSON.parse(cleaned);
}

export { groq };
