import type { Phase, WeightEntry } from '@/types';
import { formatShortDate } from '@/lib/date';
import { linReg, type LinRegPoint } from '../trend';
import { currentPhaseSegment } from '../phaseSegments';
import { CHART_TOKENS } from './chartDefaults';

const MS_PER_DAY = 86_400_000;
const PALETTE = [
  CHART_TOKENS.yellow,
  CHART_TOKENS.pink,
  CHART_TOKENS.purple,
  CHART_TOKENS.primary,
  CHART_TOKENS.orange,
  CHART_TOKENS.cyan,
];

interface EnrichedPoint {
  date: string;
  w: number;
  tgKcal: number;
}

export interface PhaseChartPoint {
  label: string;
  weight: number;
  regression: number;
  tgKcal: number;
  color: string;
}

export interface PhaseChartResult {
  points: PhaseChartPoint[];
  rate: number;
  r2: number;
  startDate: string;
  endDate: string;
  totalChange: number;
  sampleCount: number;
  kcalLevels: number[];
}

interface BuildArgs {
  weights: readonly WeightEntry[];
  phase: Phase;
  currentKcal: number;
}

export function selectPhaseWeights(
  weights: readonly WeightEntry[],
  phase: Phase,
  currentKcal: number,
): EnrichedPoint[] {
  const segment = currentPhaseSegment(weights, phase);
  if (!segment) return [];
  return segment.entries.map((e) => ({
    date: e.date,
    w: e.w,
    tgKcal:
      typeof e.tgKcal === 'number' && e.tgKcal > 0 ? e.tgKcal : currentKcal,
  }));
}

export function buildPhaseChartData({
  weights,
  phase,
  currentKcal,
}: BuildArgs): PhaseChartResult | null {
  const pts = selectPhaseWeights(weights, phase, currentKcal);
  if (pts.length < 2) return null;

  const t0 = Date.parse(pts[0].date);
  const regPoints: LinRegPoint[] = pts.map((pt) => ({
    x: (Date.parse(pt.date) - t0) / MS_PER_DAY,
    y: pt.w,
  }));
  const lr = linReg(regPoints);

  const kcalLevels = Array.from(new Set(pts.map((e) => e.tgKcal)));
  const colorFor = (k: number): string =>
    PALETTE[kcalLevels.indexOf(k) % PALETTE.length];

  const points: PhaseChartPoint[] = pts.map((pt, i) => ({
    label: formatShortDate(pt.date),
    weight: pt.w,
    regression: +(lr.slope * regPoints[i].x + lr.intercept).toFixed(2),
    tgKcal: pt.tgKcal,
    color: colorFor(pt.tgKcal),
  }));

  return {
    rate: +(lr.slope * 7).toFixed(2),
    r2: +lr.r2.toFixed(2),
    startDate: pts[0].date,
    endDate: pts[pts.length - 1].date,
    totalChange: +(pts[pts.length - 1].w - pts[0].w).toFixed(1),
    sampleCount: pts.length,
    kcalLevels,
    points,
  };
}
