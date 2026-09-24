import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

function cleanAndParseJSON(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      return JSON.parse(text.substring(firstBrace, lastBrace + 1));
    }
    throw new Error("Could not parse valid JSON from AI response.");
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { channels, totalBudget, targetROAS, businessType } = body;

    const systemPrompt = `You are a Principal Media Buyer, Quantitative Growth Architect, and Multi-Channel Attribution Specialist.
Analyze cross-platform advertising data (Meta, Google, TikTok, etc.) to mathematically detect ad fatigue, diminishing marginal returns, and allocate budget dynamically to maximize blended ROAS.
Return ONLY a raw JSON object strictly adhering to this schema:
{
  "executiveSummary": "2-3 concise, punchy sentences explaining the core reallocation thesis and why certain channels are losing efficiency.",
  "projectedBlendedROAS": "e.g. 3.42x (+22% uplift)",
  "projectedRevenue": "e.g. $102,600",
  "reallocations": [
    {
      "channel": "Channel Name",
      "currentSpend": 10000,
      "recommendedSpend": 6500,
      "changeAmount": "-$3,500",
      "action": "DECREASE",
      "rationale": "High frequency and rising CPA indicate creative fatigue on cold broad audiences."
    }
  ],
  "strategicActionItems": [
    "Specific tactical instruction for media buyer (e.g. scale Google PMax budget by $2k focusing on top 5 SKUs)"
  ]
}`;

    const userPrompt = `Business Model: ${businessType}
Total Monthly Budget: $${totalBudget}
Target Blended ROAS: ${targetROAS}x

Live Channel Performance Matrix:
${JSON.stringify(channels, null, 2)}

Diagnose diminishing returns, detect fatigue, and formulate the optimal mathematical budget rebalance plan. Output strictly raw JSON.`;

    const modelListRes = await groq.models.list();
    const candidateIds = modelListRes.data
      .map((m: any) => m.id)
      .filter((id: string) => {
        const lower = id.toLowerCase();
        return (
          !lower.includes("whisper") &&
          !lower.includes("guard") &&
          !lower.includes("vision") &&
          !lower.includes("safeguard") &&
          !lower.includes("canopy") &&
          !lower.includes("orpheus") &&
          !lower.includes("tts") &&
          !lower.includes("audio")
        );
      });

    const priorityList = [
      "llama-3.1-8b-instant",
      "llama-3.3-70b-versatile",
      "llama-3.2-3b-preview",
      ...candidateIds,
    ];

    const availableToTry = Array.from(
      new Set(priorityList.filter((p) => candidateIds.includes(p)))
    );

    let completion = null;
    let lastError: any = null;

    for (const model of availableToTry) {
      try {
        completion = await groq.chat.completions.create({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          model: model,
          temperature: 0.3,
          max_tokens: 2048,
          response_format: { type: "json_object" },
        });

        if (completion?.choices[0]?.message?.content) {
          break;
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    const responseContent = completion?.choices[0]?.message?.content || "";
    if (!responseContent) {
      throw lastError || new Error("No response from Groq models");
    }

    const parsedData = cleanAndParseJSON(responseContent);
    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error("Budget Rebalance Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to rebalance budget matrix" },
      { status: 500 }
    );
  }
}