import type {
  LogByDate,
  Palier,
  Phase,
  Recommendation,
  Targets,
  TrendResult,
  WeightEntry,
} from '@/types';
import { palierDays } from './palier';
import { dayTotals } from '@/features/nutrition/totals';
import { recommendAction, trend72 } from './trend';
import { buildPhaseAdvice, type PhaseAdvice } from './phaseAdvisor';

export type HomeAnalysisVariant = 'maintain' | 'increase' | 'decrease';

export interface HomeAnalysis {
  variant: HomeAnalysisVariant;
  headline: string;
  reason: string;
  macroHint: string;
  avgKcal: number;
  avgProt: number;
  weightChange: number;
  trackedDays: number;
  winDays: number;
  trend: TrendResult | null;
  recommendation: Recommendation | null;
  phaseAdvice: PhaseAdvice | null;
}

interface BuildDeps {
  weights: WeightEntry[];
  log: LogByDate;
  targets: Targets;
  phase: Phase;
  palier: Palier;
  today: string;
  bmr: number;
  goalWeight: number;
}

const MAX_WINDOW = 14;

export function buildHomeAnalysis(deps: BuildDeps): HomeAnalysis | null {
  const { weights, log, targets, phase, palier, today, bmr, goalWeight } = deps;

  const winDays = Math.min(MAX_WINDOW, palierDays(palier, today) + 1);

  const dates: string[] = [];
  const todayDate = new Date(today);
  for (let i = winDays - 1; i >= 0; i--) {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    if (iso >= palier.startDate) dates.push(iso);
  }

  const totals = dates.map((d) => dayTotals(log, d));
  const tracked = totals.filter((t) => t.kcal > 0);

  const avgKcal = tracked.length
    ? Math.round(tracked.reduce((s, t) => s + t.kcal, 0) / tracked.length)
    : 0;
  const avgProt = tracked.length
    ? Math.round(tracked.reduce((s, t) => s + t.p, 0) / tracked.length)
    : 0;

  const firstDate = dates[0] ?? today;
  const relevantWeights = weights.filter((x) => x.date >= firstDate);
  let weightChange = 0;
  if (relevantWeights.length >= 2) {
    weightChange =
      relevantWeights[relevantWeights.length - 1].w - relevantWeights[0].w;
  }

  const trend = trend72({
    weights,
    palier,
    currentKcal: targets.kcal,
    currentPhase: phase,
    log,
    today,
  });

  if (!trend || weights.length < 1) {
    return {
      variant: 'maintain',
      headline: 'Pèse-toi pour démarrer',
      reason: 'Ajoute une pesée pour activer le suivi de palier.',
      macroHint: '',
      avgKcal,
      avgProt,
      weightChange,
      trackedDays: tracked.length,
      winDays: dates.length,
      trend: null,
      recommendation: null,
      phaseAdvice: null,
    };
  }

  const rec = recommendAction(phase, trend, targets.kcal);
  const currentWeight = weights[weights.length - 1].w;
  const phaseAdvice = buildPhaseAdvice({
    phase,
    currentKcal: targets.kcal,
    bmr,
    weights,
    trend,
    goalWeight,
    currentWeight,
  });
  const newUp = targets.kcal + 200;
  const newDn = Math.max(1200, targets.kcal - 200);

  let variant: HomeAnalysisVariant = 'maintain';
  let headline = '';
  let macroHint = '';

  if (rec.act === 'observer') {
    headline =
      trend.dir === 'observing'
        ? `OBSERVE LE PALIER (${trend.daysOnPalier}/${trend.daysNeeded}j)`
        : rec.msg;
  } else if (rec.act === '+200') {
    variant = 'increase';
    headline = `+200 KCAL → ${newUp}`;
    macroHint = `Gluc: ${targets.gluc}g → ${targets.gluc + 50}g`;
  } else if (rec.act === '-200') {
    variant = 'decrease';
    headline = `-200 KCAL → ${newDn}`;
    macroHint = `Gluc: ${targets.gluc}g → ${Math.max(0, targets.gluc - 50)}g`;
  } else {
    headline = `MAINTENIR ${targets.kcal} KCAL`;
  }

  return {
    variant,
    headline,
    reason: rec.reason,
    macroHint,
    avgKcal,
    avgProt,
    weightChange,
    trackedDays: tracked.length,
    winDays: dates.length,
    trend,
    recommendation: rec,
    phaseAdvice,
  };
}
