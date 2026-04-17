import type { ChartData } from 'chart.js';
import type { WeightEntry } from '@/types';
import { formatShortDate } from '@/lib/date';
import { CHART_COLORS } from './chartDefaults';
import { ema } from './ema';

export const WEIGHT_RANGES = [
  { label: '7j', value: 7 },
  { label: '15j', value: 15 },
  { label: '30j', value: 30 },
  { label: '90j', value: 90 },
  { label: 'Tout', value: 9999 },
] as const;

export type WeightRange = (typeof WEIGHT_RANGES)[number]['value'];

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
}: BuildArgs): ChartData<'line'> | null {
  const slice = sliceWeights(weights, range);
  if (slice.length === 0) return null;

  const values = slice.map((w) => w.w);
  const labels = slice.map((w) => formatShortDate(w.date));

  const datasets: ChartData<'line'>['datasets'] = [
    {
      label: 'Poids',
      data: values,
      borderColor: CHART_COLORS.primary,
      backgroundColor: 'rgba(106, 239, 175, .08)',
      fill: true,
      tension: 0.35,
      pointRadius: slice.length > 60 ? 1 : 3,
      pointBackgroundColor: CHART_COLORS.primary,
      borderWidth: 2.5,
    },
  ];

  if (slice.length >= 3) {
    const smoothed = ema(values, Math.min(7, slice.length)).map(
      (v) => +v.toFixed(1),
    );
    datasets.push({
      label: 'Tendance (EMA)',
      data: smoothed,
      borderColor: CHART_COLORS.orange,
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.4,
      fill: false,
    });
  }

  if (goalWeight > 0) {
    datasets.push({
      label: 'Objectif',
      data: slice.map(() => goalWeight),
      borderColor: 'rgba(255, 179, 71, .5)',
      borderDash: [6, 4],
      pointRadius: 0,
      borderWidth: 1.5,
      fill: false,
    });
  }

  return { labels, datasets };
}
