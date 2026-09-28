import { NextResponse } from "next/server";
import { groq, resolveModel, cleanAndParseJSON } from "@/lib/groq";
import type { ChannelInput, RebalanceResponse } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const { timeframe, channels } = (await req.json()) as {
      timeframe: string;
      channels: ChannelInput[];
    };

    if (!channels || channels.length === 0) {
      return NextResponse.json(
        { error: "At least one channel is required." },
        { status: 400 }
      );
    }

    /* ── Pre-compute mathematically verifiable metrics ── */
    const totalSpend = channels.reduce((s, c) => s + c.adSpend, 0);
    const totalRevenue = channels.reduce((s, c) => s + c.revenue, 0);
    const blendedROAS = totalSpend > 0 ? +(totalRevenue / totalSpend).toFixed(4) : 0;

    const enriched = channels.map((c) => ({
      platform: c.platform,
      adSpend: c.adSpend,
      revenue: c.revenue,
      roas: c.adSpend > 0 ? +(c.revenue / c.adSpend).toFixed(4) : 0,
      costPerRevenueDollar: c.revenue > 0 ? +(c.adSpend / c.revenue).toFixed(4) : 0,
      creativeFormat: c.creativeFormat,
      avgCTR: c.avgCTR,
      spendSharePct: totalSpend > 0 ? +((c.adSpend / totalSpend) * 100).toFixed(1) : 0,
    }));

    /* ── System prompt: zero-hallucination enforcement ── */
    const systemPrompt = `You are a Performance Marketing Budget Auditor. You analyze ONLY the provided channel data.

ABSOLUTE RULES — VIOLATION MEANS FAILURE:
1. ZERO HALLUCINATIONS. Every single number you output MUST be directly derived from the provided data.
2. If a channel shows 1.4x ROAS, you MUST report exactly 1.4 — never 1.5, 2.0, or 3.0.
3. Do NOT invent platforms, metrics, or data points not present in the input.
4. All calculations must be mathematically verifiable: ROAS = revenue / spend, CPA (cost per revenue dollar) = spend / revenue.
5. Do NOT reference external benchmarks, industry averages, or assumptions not in the data.
6. When recommending budget shifts, recalculate the projected blended ROAS precisely after applying the shift.

CREATIVE FATIGUE DETECTION RULES:
- Flag as "creative decay / hook exhaustion" if Video Heavy CTR < 0.9% on any platform.
- Flag as "banner blindness" if Static Banner Heavy CTR < 1.2% on search platforms.
- If CTR is healthy (>= 1.5%), note as "creative performing well".
- TikTok specifically: flag "hook exhaustion" if Video CTR < 0.8%.

EFFICIENCY RATING RULES:
- "Optimal": ROAS >= 2.5 AND CTR is healthy for its creative format.
- "Fatigued": ROAS between 1.5 and 2.49, OR CTR shows fatigue signals.
- "Bleeding": ROAS < 1.5 OR severe CTR degradation.

You MUST output valid JSON matching the specified schema. No markdown, no explanations, no text outside the JSON object.`;

    const userPrompt = `Analyze this performance marketing data and produce a rebalancing audit.

ALL METRICS BELOW ARE PRE-COMPUTED AND MATHEMATICALLY VERIFIED. USE THESE EXACT NUMBERS.

Timeframe: ${timeframe}
Total Spend: $${totalSpend.toLocaleString()}
Total Revenue: $${totalRevenue.toLocaleString()}
Blended ROAS: ${blendedROAS}x

Channel Breakdown (pre-computed):
${JSON.stringify(enriched, null, 2)}

Return ONLY a JSON object with this EXACT schema:
{
  "timeframe": "${timeframe}",
  "blendedROAS": ${blendedROAS},
  "executiveAudit": "2-4 sentence executive summary grounded in the numbers above",
  "channelDiagnosis": [
    {
      "platform": "exact platform name from input",
      "efficiencyRating": "Optimal | Fatigued | Bleeding",
      "cpa": <costPerRevenueDollar from pre-computed data>,
      "roas": <roas from pre-computed data>,
      "creativeStatus": "assessment based on creative format + CTR",
      "actionVerdict": "specific next step"
    }
  ],
  "budgetShiftDirectives": [
    {
      "fromPlatform": "name",
      "toPlatform": "name",
      "amount": <dollar amount>,
      "mathematicalRationale": "cite exact ROAS numbers",
      "projectedBlendedROAS": <recalculated number>
    }
  ],
  "creativeFatigueAlerts": [
    {
      "platform": "name",
      "trigger": "what triggered the alert with exact numbers",
      "recommendation": "specific creative action"
    }
  ]
}`;

    const modelId = await resolveModel();

    const completion = await groq.chat.completions.create({
      model: modelId,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.15,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "";

    let parsed: RebalanceResponse;
    try {
      parsed = cleanAndParseJSON(raw) as RebalanceResponse;
    } catch {
      return NextResponse.json(
        { error: "Model returned unparseable response. Please retry." },
        { status: 502 }
      );
    }

    // Guard: force blendedROAS to the server-computed value
    parsed.blendedROAS = blendedROAS;
    parsed.timeframe = timeframe;

    return NextResponse.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error("Rebalance Pipeline Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process budget rebalance audit." },
      { status: 500 }
    );
  }
}
