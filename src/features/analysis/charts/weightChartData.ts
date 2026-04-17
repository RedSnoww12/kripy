import type { WeightEntry } from '@/types';
import { formatShortDate } from '@/lib/date';
import { ema } from './ema';

export const WEIGHT_RANGES = [
  { label: '7j', value: 7 },
  { label: '15j', value: 15 },
  { label: '30j', value: 30 },
  { label: '90j', value: 90 },
  { label: 'Tout', value: 9999 },
] as const;

export type WeightRange = (typeof WEIGHT_RANGES)[number]['value'];

export interface WeightChartPoint {
  label: string;
  weight: number;
  ema?: number;
  goal?: number;
}

export interface WeightChartResult {
  points: WeightChartPoint[];
  hasEma: boolean;
  hasGoal: boolean;
  dense: boolean;
}

export function sliceWeights(
  weights: readonly WeightEntry[],
  range: number,
): WeightEntry[] {
  if (range >= 9999) return [...weights];
  return weights.slice(-range);
}

interface BuildArgs {
  weights: readonly WeightEntry[];
  range: number;
  goalWeight: number;
}

export function buildWeightChartData({
  weights,
  range,
  goalWeight,
}: BuildArgs): WeightChartResult | null {
  const slice = sliceWeights(weights, range);
  if (slice.length < 2) return null;

  const values = slice.map((w) => w.w);
  const hasEma = slice.length >= 3;
  const smoothed = hasEma
    ? ema(values, Math.min(7, slice.length)).map((v) => +v.toFixed(1))
    : [];
  const hasGoal = goalWeight > 0;

  const points: WeightChartPoint[] = slice.map((entry, i) => ({
    label: formatShortDate(entry.date),
    weight: entry.w,
    ema: hasEma ? smoothed[i] : undefined,
    goal: hasGoal ? goalWeight : undefined,
  }));

  return { points, hasEma, hasGoal, dense: slice.length > 60 };
}
