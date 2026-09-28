"use client";

import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Download,
  Loader2,
  Sparkles,
  Zap,
  Plus,
  Trash2,
  ArrowRight,
  Clock,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import type {
  ChannelInput,
  RebalanceResponse,
  ChannelDiagnosis,
  BudgetShiftDirective,
  CreativeFatigueAlert,
} from "@/lib/types";

/* ── Constants ── */

const TIMEFRAMES = ["Last 7 Days", "Last 14 Days", "Last 30 Days", "Last 90 Days"] as const;

const PLATFORMS = ["Meta Ads", "Google Ads PMax", "Google Ads Search", "TikTok Ads"] as const;

const CREATIVE_FORMATS = [
  "Video Heavy (70% UGC)",
  "Static Banner Heavy",
  "PMax Asset Group",
] as const;

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

function emptyChannel(): ChannelInput {
  return {
    id: genId(),
    platform: PLATFORMS[0],
    adSpend: 0,
    revenue: 0,
    creativeFormat: CREATIVE_FORMATS[0],
    avgCTR: 0,
  };
}

/* ── Presets ── */

const PRESET_DTC: { label: string; timeframe: string; channels: Omit<ChannelInput, "id">[] } = {
  label: 'DTC Skincare 30d ($45k Spend)',
  timeframe: "Last 30 Days",
  channels: [
    { platform: "Meta Ads", adSpend: 22000, revenue: 66000, creativeFormat: "Video Heavy (70% UGC)", avgCTR: 1.4 },
    { platform: "Google Ads PMax", adSpend: 15000, revenue: 37500, creativeFormat: "PMax Asset Group", avgCTR: 2.1 },
    { platform: "TikTok Ads", adSpend: 8000, revenue: 11200, creativeFormat: "Video Heavy (70% UGC)", avgCTR: 0.7 },
  ],
};

const PRESET_SAAS: typeof PRESET_DTC = {
  label: 'B2B SaaS 14d ($18k Spend)',
  timeframe: "Last 14 Days",
  channels: [
    { platform: "Google Ads Search", adSpend: 10000, revenue: 28000, creativeFormat: "Static Banner Heavy", avgCTR: 3.2 },
    { platform: "Meta Ads", adSpend: 5000, revenue: 6500, creativeFormat: "Static Banner Heavy", avgCTR: 0.9 },
    { platform: "TikTok Ads", adSpend: 3000, revenue: 2100, creativeFormat: "Video Heavy (70% UGC)", avgCTR: 0.5 },
  ],
};

/* ── Helpers ── */

function fmtCurrency(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtROAS(n: number): string {
  return isFinite(n) ? n.toFixed(2) + "x" : "—";
}

function ratingColor(r: string) {
  if (r === "Optimal") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  if (r === "Fatigued") return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  return "bg-red-500/20 text-red-400 border-red-500/30";
}

/* ── Component ── */

export default function Home() {
  const [timeframe, setTimeframe] = useState<string>("Last 30 Days");
  const [channels, setChannels] = useState<ChannelInput[]>([emptyChannel()]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RebalanceResponse | null>(null);
  const [error, setError] = useState("");

  /* ── Channel CRUD ── */

  const updateChannel = (id: string, field: keyof ChannelInput, value: string | number) => {
    setChannels((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, [field]: value } : ch))
    );
  };

  const addChannel = () => setChannels((prev) => [...prev, emptyChannel()]);

  const removeChannel = (id: string) => {
    setChannels((prev) => (prev.length <= 1 ? prev : prev.filter((ch) => ch.id !== id)));
  };

  const loadPreset = (preset: typeof PRESET_DTC) => {
    setTimeframe(preset.timeframe);
    setChannels(preset.channels.map((c) => ({ ...c, id: genId() })));
    setResult(null);
    setError("");
  };

  /* ── Computed blended ROAS for live preview ── */

  const totalSpend = channels.reduce((s, c) => s + (c.adSpend || 0), 0);
  const totalRevenue = channels.reduce((s, c) => s + (c.revenue || 0), 0);
  const liveBlendedROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;

  /* ── Submit ── */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalSpend === 0) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/rebalance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeframe, channels }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Audit failed");

      setResult(data.data as RebalanceResponse);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  /* ── CSV Export ── */

  const exportCSV = () => {
    if (!result) return;

    const lines: string[] = [];
    const q = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

    lines.push("Performance Marketing Audit Report");
    lines.push(`Timeframe,${q(result.timeframe)}`);
    lines.push(`Blended ROAS,${result.blendedROAS}`);
    lines.push("");

    lines.push("Executive Audit");
    lines.push(q(result.executiveAudit));
    lines.push("");

    lines.push("Channel Diagnosis");
    lines.push("Platform,Efficiency,ROAS,CPA ($/rev$),Creative Status,Verdict");
    result.channelDiagnosis?.forEach((ch: ChannelDiagnosis) => {
      lines.push(
        [q(ch.platform), q(ch.efficiencyRating), ch.roas, ch.cpa, q(ch.creativeStatus), q(ch.actionVerdict)].join(",")
      );
    });
    lines.push("");

    lines.push("Budget Shift Directives");
    lines.push("From,To,Amount,Rationale,Projected Blended ROAS");
    result.budgetShiftDirectives?.forEach((d: BudgetShiftDirective) => {
      lines.push(
        [q(d.fromPlatform), q(d.toPlatform), d.amount, q(d.mathematicalRationale), d.projectedBlendedROAS].join(",")
      );
    });
    lines.push("");

    lines.push("Creative Fatigue Alerts");
    lines.push("Platform,Trigger,Recommendation");
    result.creativeFatigueAlerts?.forEach((a: CreativeFatigueAlert) => {
      lines.push([q(a.platform), q(a.trigger), q(a.recommendation)].join(","));
    });

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `budget-audit-${timeframe.replace(/\s+/g, "-").toLowerCase()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  /* ── Render ── */

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 font-sans selection:bg-indigo-500 selection:text-white">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* ── Header ── */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Performance Marketing Auditor
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Budget Rebalance Engine
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base">
            Input your real ad-spend numbers across platforms. The engine audits channel efficiency, detects creative fatigue, and produces mathematically grounded budget shift directives — zero hallucinations.
          </p>
        </div>

        {/* ── Config: Timeframe + Presets ── */}
        <div className="space-y-4">
          {/* Timeframe Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer border ${
                  timeframe === tf
                    ? "bg-indigo-600 text-white border-indigo-500"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Presets */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-slate-500 self-center mr-1">Quick Presets:</span>
            {[PRESET_DTC, PRESET_SAAS].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => loadPreset(p)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 text-slate-300 border border-slate-800 hover:border-indigo-500/50 hover:text-indigo-300 transition cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Editable Channel Table ── */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                  <th className="px-3 py-3 text-left font-semibold">Platform</th>
                  <th className="px-3 py-3 text-right font-semibold">Ad Spend ($)</th>
                  <th className="px-3 py-3 text-right font-semibold">Revenue ($)</th>
                  <th className="px-3 py-3 text-right font-semibold">ROAS</th>
                  <th className="px-3 py-3 text-left font-semibold">Creative Format</th>
                  <th className="px-3 py-3 text-right font-semibold">Avg CTR (%)</th>
                  <th className="px-3 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {channels.map((ch) => {
                  const rowROAS = ch.adSpend > 0 ? ch.revenue / ch.adSpend : 0;
                  return (
                    <tr key={ch.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition">
                      {/* Platform */}
                      <td className="px-3 py-2">
                        <select
                          value={ch.platform}
                          onChange={(e) => updateChannel(ch.id, "platform", e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                        >
                          {PLATFORMS.map((p) => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </td>
                      {/* Spend */}
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          step={100}
                          value={ch.adSpend || ""}
                          onChange={(e) => updateChannel(ch.id, "adSpend", parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-right text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                        />
                      </td>
                      {/* Revenue */}
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          step={100}
                          value={ch.revenue || ""}
                          onChange={(e) => updateChannel(ch.id, "revenue", parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-right text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                        />
                      </td>
                      {/* ROAS (auto) */}
                      <td className="px-3 py-2 text-right">
                        <span className={`font-mono font-bold ${
                          rowROAS >= 2.5 ? "text-emerald-400" : rowROAS >= 1.5 ? "text-amber-400" : "text-red-400"
                        }`}>
                          {fmtROAS(rowROAS)}
                        </span>
                      </td>
                      {/* Creative Format */}
                      <td className="px-3 py-2">
                        <select
                          value={ch.creativeFormat}
                          onChange={(e) => updateChannel(ch.id, "creativeFormat", e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                        >
                          {CREATIVE_FORMATS.map((f) => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                      </td>
                      {/* CTR */}
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          value={ch.avgCTR || ""}
                          onChange={(e) => updateChannel(ch.id, "avgCTR", parseFloat(e.target.value) || 0)}
                          placeholder="0.0"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-right text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                        />
                      </td>
                      {/* Delete */}
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeChannel(ch.id)}
                          className="text-slate-600 hover:text-red-400 transition cursor-pointer"
                          title="Remove channel"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Add row + blended ROAS preview */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={addChannel}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 bg-slate-900 border border-slate-800 rounded-lg hover:border-indigo-500/50 hover:text-indigo-300 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Channel
            </button>
            <div className="text-xs text-slate-500">
              Blended ROAS:{" "}
              <span className={`font-mono font-bold text-sm ${
                liveBlendedROAS >= 2.5 ? "text-emerald-400" : liveBlendedROAS >= 1.5 ? "text-amber-400" : "text-red-400"
              }`}>
                {fmtROAS(liveBlendedROAS)}
              </span>
              <span className="ml-3">Total Spend: <span className="text-slate-300 font-medium">{fmtCurrency(totalSpend)}</span></span>
              <span className="ml-3">Revenue: <span className="text-slate-300 font-medium">{fmtCurrency(totalRevenue)}</span></span>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading || totalSpend === 0}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-lg shadow-indigo-600/20"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Auditing…</>
              ) : (
                <><BarChart3 className="w-4 h-4" /> Run Budget Audit</>
              )}
            </button>
          </div>
        </form>

        {/* ── Loading State ── */}
        {loading && (
          <div className="text-center p-6 bg-slate-900/50 border border-slate-800/80 rounded-2xl max-w-md mx-auto space-y-2 animate-pulse">
            <Zap className="w-6 h-6 text-amber-400 mx-auto animate-bounce" />
            <p className="text-sm font-medium text-slate-300">Auditing channel performance…</p>
            <p className="text-xs text-slate-500">Pre-computing metrics → Groq LPU inference → Generating directives</p>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="max-w-2xl mx-auto p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ══════════════════════════════ Results ══════════════════════════════ */}
        {result && (
          <div className="space-y-6">
            {/* Report Header */}
            <div className="flex flex-wrap justify-between items-center bg-slate-900/60 p-4 border border-slate-800 rounded-xl gap-3">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-slate-200">Budget Audit Complete</h3>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  {result.timeframe}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  result.blendedROAS >= 2.5
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : result.blendedROAS >= 1.5
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                }`}>
                  Blended ROAS: {fmtROAS(result.blendedROAS)}
                </span>
              </div>
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition cursor-pointer"
              >
                <Download className="w-4 h-4" /> Export Executive CSV
              </button>
            </div>

            <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl space-y-8 text-slate-200">

              {/* Executive Audit */}
              <div className="border-b border-slate-800 pb-6">
                <h2 className="text-lg font-bold text-white mb-2">Executive Audit Summary</h2>
                <p className="text-sm text-slate-400 leading-relaxed">{result.executiveAudit}</p>
              </div>

              {/* ── Channel Diagnosis Cards ── */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-400" /> Channel Diagnosis
                </h4>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {result.channelDiagnosis?.map((ch: ChannelDiagnosis, idx: number) => (
                    <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-slate-200">{ch.platform}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${ratingColor(ch.efficiencyRating)}`}>
                          {ch.efficiencyRating}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-500 block">ROAS</span>
                          <span className="font-mono font-bold text-slate-200">{fmtROAS(ch.roas)}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">CPA ($/rev$)</span>
                          <span className="font-mono font-bold text-slate-200">{typeof ch.cpa === "number" ? ch.cpa.toFixed(2) : "—"}</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400">{ch.creativeStatus}</p>
                      <div className="pt-1 border-t border-slate-800/60">
                        <p className="text-[11px] text-indigo-300 font-medium">{ch.actionVerdict}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Budget Shift Directives ── */}
              {result.budgetShiftDirectives && result.budgetShiftDirectives.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Budget Shift Directives
                  </h4>
                  <div className="grid gap-3">
                    {result.budgetShiftDirectives.map((d: BudgetShiftDirective, idx: number) => (
                      <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-red-400 text-xs font-bold bg-red-500/10 px-2 py-1 rounded-lg">{d.fromPlatform}</span>
                          <ArrowRight className="w-4 h-4 text-slate-600" />
                          <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-1 rounded-lg">{d.toPlatform}</span>
                          <span className="text-amber-400 font-mono font-bold text-sm ml-1">{fmtCurrency(d.amount)}</span>
                        </div>
                        <div className="flex-1 text-xs text-slate-400">{d.mathematicalRationale}</div>
                        <div className="flex-shrink-0 text-xs text-slate-500">
                          Projected ROAS: <span className="font-mono font-bold text-indigo-300">{fmtROAS(d.projectedBlendedROAS)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Creative Fatigue & Hook Alerts ── */}
              {result.creativeFatigueAlerts && result.creativeFatigueAlerts.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-rose-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Creative Fatigue &amp; Hook Alerts
                  </h4>
                  <div className="grid gap-2">
                    {result.creativeFatigueAlerts.map((a: CreativeFatigueAlert, idx: number) => (
                      <div key={idx} className="bg-rose-500/5 border border-rose-500/15 rounded-xl p-3 flex flex-col sm:flex-row sm:items-start gap-2">
                        <span className="text-xs font-bold text-rose-300 flex-shrink-0 bg-rose-500/10 px-2 py-1 rounded-lg">{a.platform}</span>
                        <div className="flex-1">
                          <p className="text-xs text-rose-200/80 font-medium">{a.trigger}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{a.recommendation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── No alerts fallback ── */}
              {result.creativeFatigueAlerts && result.creativeFatigueAlerts.length === 0 && (
                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3">
                  <CheckCircle2 className="w-4 h-4" /> No creative fatigue detected — all hooks and formats performing within healthy thresholds.
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </main>
  );
}