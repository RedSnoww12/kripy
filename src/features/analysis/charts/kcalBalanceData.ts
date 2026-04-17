import type { ChartData } from 'chart.js';
import type { LogByDate, WeightEntry } from '@/types';
import { formatShortDate } from '@/lib/date';
import { dayTotals } from '@/features/nutrition/totals';
import { targetForDate } from '../palier';
import { CHART_COLORS } from './chartDefaults';

export const CALORIE_RANGES = [
  { label: '7j', value: 7 },
  { label: '14j', value: 14 },
  { label: '30j', value: 30 },
] as const;

export type CalorieRange = (typeof CALORIE_RANGES)[number]['value'];

function listDates(n: number, today: string): string[] {
  const out: string[] = [];
  const base = Date.parse(today);
  for (let i = n - 1; i >= 0; i--) {
    out.push(new Date(base - i * 86_400_000).toISOString().slice(0, 10));
  }
  return out;
}

export interface CalorieSummary {
  avgKcal: number;
  avgTarget: number;
  deficit: number;
  overDays: number;
  underDays: number;
  trackedDays: number;
}

export interface CalorieBalanceResult {
  data: ChartData<'bar'>;
  summary: CalorieSummary;
}

interface BuildArgs {
  log: LogByDate;
  weights: readonly WeightEntry[];
  currentKcal: number;
  today: string;
  range: CalorieRange;
}

export function buildCalorieBalance({
  log,
  weights,
  currentKcal,
  today,
  range,
}: BuildArgs): CalorieBalanceResult {
  const dates = listDates(range, today);
  const totals = dates.map((d) => dayTotals(log, d));
  const dayTargets = dates.map((d) =>
    targetForDate(d, weights, currentKcal, today),
  );

  const colors = totals.map((t, i) => {
    if (t.kcal <= 0) return 'rgba(90, 94, 107, .2)';
    return t.kcal > dayTargets[i]
      ? 'rgba(255, 107, 107, .55)'
      : 'rgba(106, 239, 175, .55)';
  });

  const tracked = totals
    .map((t, i) => ({ t, target: dayTargets[i] }))
    .filter((x) => x.t.kcal > 0);

  const avgKcal = tracked.length
    ? Math.round(tracked.reduce((s, x) => s + x.t.kcal, 0) / tracked.length)
    : 0;
  const avgTarget = tracked.length
    ? Math.round(tracked.reduce((s, x) => s + x.target, 0) / tracked.length)
    : currentKcal;
  const deficit = avgTarget - avgKcal;

  const summary: CalorieSummary = {
    avgKcal,
    avgTarget,
    deficit,
    overDays: tracked.filter((x) => x.t.kcal > x.target).length,
    underDays: tracked.filter((x) => x.t.kcal <= x.target).length,
    trackedDays: tracked.length,
  };

  const data: ChartData<'bar'> = {
    labels: dates.map(formatShortDate),
    datasets: [
      {
        type: 'bar',
        data: totals.map((t) => Math.round(t.kcal)),
        backgroundColor: colors,
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        type: 'line' as unknown as 'bar',
        label: 'Objectif',
        data: dayTargets,
        borderColor: 'rgba(255, 179, 71, .6)',
        borderDash: [5, 5],
        pointRadius: 0,
        borderWidth: 2,
        fill: false,
        stepped: true,
      } as unknown as ChartData<'bar'>['datasets'][number],
    ],
  };

  return { data, summary };
}

export function rateColor(value: number): string {
  if (value > 0) return 'var(--grn)';
  if (value < 0) return 'var(--red)';
  return CHART_COLORS.primary;
}
