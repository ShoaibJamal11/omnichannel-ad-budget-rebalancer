/* ── Shared types for the Performance Marketing Budget Rebalancer ── */

export interface ChannelInput {
  id: string;
  platform: string;
  adSpend: number;
  revenue: number;
  creativeFormat: string;
  avgCTR: number;
}

export interface ChannelDiagnosis {
  platform: string;
  efficiencyRating: "Optimal" | "Fatigued" | "Bleeding";
  cpa: number;
  roas: number;
  creativeStatus: string;
  actionVerdict: string;
}

export interface BudgetShiftDirective {
  fromPlatform: string;
  toPlatform: string;
  amount: number;
  mathematicalRationale: string;
  projectedBlendedROAS: number;
}

export interface CreativeFatigueAlert {
  platform: string;
  trigger: string;
  recommendation: string;
}

export interface RebalanceResponse {
  timeframe: string;
  blendedROAS: number;
  executiveAudit: string;
  channelDiagnosis: ChannelDiagnosis[];
  budgetShiftDirectives: BudgetShiftDirective[];
  creativeFatigueAlerts: CreativeFatigueAlert[];
}
