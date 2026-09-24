"use client";

import React, { useState } from "react";
import { 
  Sparkles, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Minus, 
  Zap, 
  BarChart3, 
  Download, 
  RefreshCw,
  SlidersHorizontal,
  Layers,
  CheckCircle2
} from "lucide-react";

interface ChannelData {
  name: string;
  spend: number;
  revenue: number;
  cpa: number;
  roas: number;
}

interface ReallocationItem {
  channel: string;
  currentSpend: number;
  recommendedSpend: number;
  changeAmount: string;
  action: "INCREASE" | "DECREASE" | "HOLD";
  rationale: string;
}

interface RebalanceResult {
  executiveSummary: string;
  projectedBlendedROAS: string;
  projectedRevenue: string;
  reallocations: ReallocationItem[];
  strategicActionItems: string[];
}

export default function BudgetRebalancerPage() {
  const [businessType, setBusinessType] = useState("DTC Apparel & Footwear ($65 AOV)");
  const [targetROAS, setTargetROAS] = useState(3.0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RebalanceResult | null>(null);

  const [channels, setChannels] = useState<ChannelData[]>([
    { name: "Meta Ads (Advantage+ & Reels)", spend: 14000, revenue: 39200, cpa: 28, roas: 2.8 },
    { name: "Google Ads (PMax & Brand Search)", spend: 9500, revenue: 38000, cpa: 19, roas: 4.0 },
    { name: "TikTok Ads (Spark Ads UGC)", spend: 6500, revenue: 11700, cpa: 42, roas: 1.8 },
  ]);

  const totalCurrentSpend = channels.reduce((acc, c) => acc + c.spend, 0);
  const totalCurrentRevenue = channels.reduce((acc, c) => acc + c.revenue, 0);
  const currentBlendedROAS = totalCurrentSpend > 0 ? (totalCurrentRevenue / totalCurrentSpend).toFixed(2) : "0.00";

  const loadPreset = (type: "ecommerce" | "saas") => {
    if (type === "ecommerce") {
      setBusinessType("DTC Apparel & Footwear ($65 AOV)");
      setTargetROAS(3.2);
      setChannels([
        { name: "Meta Ads (Advantage+ & Reels)", spend: 14000, revenue: 39200, cpa: 28, roas: 2.8 },
        { name: "Google Ads (PMax & Brand Search)", spend: 9500, revenue: 38000, cpa: 19, roas: 4.0 },
        { name: "TikTok Ads (Spark Ads UGC)", spend: 6500, revenue: 11700, cpa: 42, roas: 1.8 },
      ]);
    } else {
      setBusinessType("B2B SaaS ($350 ACV Monthly)");
      setTargetROAS(2.5);
      setChannels([
        { name: "LinkedIn Ads (Sponsored Content)", spend: 8000, revenue: 15200, cpa: 120, roas: 1.9 },
        { name: "Google Search (High Intent Keywords)", spend: 7500, revenue: 26250, cpa: 78, roas: 3.5 },
        { name: "Meta Retargeting (Demo Bookings)", spend: 3000, revenue: 9600, cpa: 65, roas: 3.2 },
      ]);
    }
  };

  const handleChannelChange = (index: number, field: keyof ChannelData, value: number) => {
    const updated = [...channels];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "spend" || field === "revenue") {
      const s = field === "spend" ? value : updated[index].spend;
      const r = field === "revenue" ? value : updated[index].revenue;
      updated[index].roas = s > 0 ? parseFloat((r / s).toFixed(2)) : 0;
    }
    setChannels(updated);
  };

  const runRebalancer = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/rebalance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channels,
          totalBudget: totalCurrentSpend,
          targetROAS,
          businessType,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        alert("Rebalance Error: " + (data.error || "Failed to analyze"));
      }
    } catch (err: any) {
      alert("Network Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!result) return;
    const headers = "Channel,Current Spend,Recommended Spend,Action,Change,Rationale\n";
    const rows = result.reallocations
      .map(
        (r) =>
          `"${r.channel}",$${r.currentSpend},$${r.recommendedSpend},"${r.action}","${r.changeAmount}","${r.rationale.replace(/"/g, '""')}"`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `budget_rebalance_matrix_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto mb-8 border-b border-slate-800 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-2">
            <Sparkles className="w-3.5 h-3.5" /> High-Ticket Marketing Automation #9
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Dynamic Omni-Channel Ad Budget & ROAS Rebalancer
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Mathematical ad fatigue audit, diminishing return diagnosis, and dynamic capital reallocation via Groq LPU.
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-slate-500 font-mono">RETAINER VALUE</p>
          <p className="text-lg font-bold text-cyan-400">$850 - $1,400 / Month</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Total Monthly Ad Spend</span>
          <span className="text-xl font-bold text-slate-100 font-mono">${totalCurrentSpend.toLocaleString()}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Generated Revenue</span>
          <span className="text-xl font-bold text-emerald-400 font-mono">${totalCurrentRevenue.toLocaleString()}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Current Blended ROAS</span>
          <span className="text-xl font-bold text-cyan-400 font-mono">{currentBlendedROAS}x</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Target Agency ROAS</span>
          <span className="text-xl font-bold text-violet-400 font-mono">{targetROAS.toFixed(1)}x</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-semibold flex items-center gap-2 text-slate-200">
              <SlidersHorizontal className="w-4 h-4 text-cyan-400" /> Channel Performance Ingestion
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => loadPreset("ecommerce")}
                className="px-2.5 py-1 text-[10px] bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg border border-slate-700 transition"
              >
                E-com DTC ($30k)
              </button>
              <button
                type="button"
                onClick={() => loadPreset("saas")}
                className="px-2.5 py-1 text-[10px] bg-slate-800 hover:bg-slate-700 text-violet-300 rounded-lg border border-slate-700 transition"
              >
                B2B SaaS ($18k)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono text-slate-400 mb-1 block">Brand / Niche Persona</label>
              <input
                type="text"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-slate-400 mb-1 block">Target Blended ROAS</label>
              <input
                type="number"
                step="0.1"
                value={targetROAS}
                onChange={(e) => setTargetROAS(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-[11px] font-mono text-slate-400 block">Ad Channel Ingestion Matrix:</span>
            {channels.map((ch, idx) => (
              <div key={idx} className="bg-slate-950/70 border border-slate-800/80 p-3.5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                  <span>{ch.name}</span>
                  <span className={`font-mono text-[11px] px-2 py-0.5 rounded ${
                    ch.roas >= 3.0 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  }`}>
                    {ch.roas}x ROAS
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-mono text-slate-500 block mb-0.5">Spend ($)</label>
                    <input
                      type="number"
                      value={ch.spend}
                      onChange={(e) => handleChannelChange(idx, "spend", parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-500 block mb-0.5">Revenue ($)</label>
                    <input
                      type="number"
                      value={ch.revenue}
                      onChange={(e) => handleChannelChange(idx, "revenue", parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-500 block mb-0.5">CPA ($)</label>
                    <input
                      type="number"
                      value={ch.cpa}
                      onChange={(e) => handleChannelChange(idx, "cpa", parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={runRebalancer}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Calculating Mathematical Rebalance via Groq...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" /> Run AI Capital Reallocation Engine
              </>
            )}
          </button>
        </div>

        <div className="lg:col-span-6 space-y-6">
          {!result && !loading && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center h-full min-h-[480px]">
              <Layers className="w-12 h-12 text-slate-700 mb-3" />
              <p className="font-semibold text-slate-400">Awaiting Cross-Channel Performance Ingestion</p>
              <p className="text-[11px] text-slate-600 max-w-sm mt-1">
                Configure your active Meta, Google, and TikTok ad metrics on the left, then trigger the Groq LPU allocation model.
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-5">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" /> Capital Allocation Thesis
                  </h3>
                  <button
                    onClick={exportCSV}
                    className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] border border-slate-700 transition"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" /> Export CSV
                  </button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {result.executiveSummary}
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-950/70 border border-slate-800/80 p-3 rounded-xl">
                    <span className="text-[10px] font-mono text-slate-500 block">Projected Blended ROAS</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">{result.projectedBlendedROAS}</span>
                  </div>
                  <div className="bg-slate-950/70 border border-slate-800/80 p-3 rounded-xl">
                    <span className="text-[10px] font-mono text-slate-500 block">Projected Monthly Revenue</span>
                    <span className="text-sm font-bold text-cyan-400 font-mono">{result.projectedRevenue}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
                <h3 className="text-xs font-semibold text-slate-200 mb-2 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" /> Dynamic Reallocation Shifts
                </h3>

                <div className="space-y-3">
                  {result.reallocations?.map((item, i) => (
                    <div key={i} className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">{item.channel}</span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                          item.action === "INCREASE"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : item.action === "DECREASE"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-slate-800 text-slate-400 border border-slate-700"
                        }`}>
                          {item.action === "INCREASE" && <ArrowUpRight className="w-3 h-3" />}
                          {item.action === "DECREASE" && <ArrowDownRight className="w-3 h-3" />}
                          {item.action === "HOLD" && <Minus className="w-3 h-3" />}
                          {item.action} ({item.changeAmount})
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-b border-slate-900 pb-2">
                        <span>Current: <strong className="text-slate-200">${item.currentSpend.toLocaleString()}</strong></span>
                        <span>Recommended: <strong className="text-cyan-400">${item.recommendedSpend.toLocaleString()}</strong></span>
                      </div>

                      <p className="text-[11px] text-slate-400 leading-relaxed italic">
                        "{item.rationale}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
                <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Media Buyer Execution Directives
                </h4>
                <ul className="space-y-1.5 text-[11px] text-slate-300">
                  {result.strategicActionItems?.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-cyan-400 font-bold">•</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}