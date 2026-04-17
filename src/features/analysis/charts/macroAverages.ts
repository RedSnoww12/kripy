import type { ChartData } from 'chart.js';
import type { LogByDate } from '@/types';
import { formatShortDate } from '@/lib/date';
import { dayTotals } from '@/features/nutrition/totals';
import { MACRO_COLORS } from './chartDefaults';

export const MACRO_RANGES = [
  { label: '7j', value: 7 },
  { label: '14j', value: 14 },
  { label: '30j', value: 30 },
] as const;

export type MacroRange = (typeof MACRO_RANGES)[number]['value'];

export interface MacroAverages {
  p: number;
  g: number;
  l: number;
  pPct: number;
  gPct: number;
  lPct: number;
}

function listDates(n: number, today: string): string[] {
  const out: string[] = [];
  const base = Date.parse(today);
  for (let i = n - 1; i >= 0; i--) {
    out.push(new Date(base - i * 86_400_000).toISOString().slice(0, 10));
  }
  return out;
}

interface MacroDonutArgs {
  log: LogByDate;
  today: string;
  range: MacroRange;
}

export interface MacroDonutResult {
  data: ChartData<'doughnut'>;
  averages: MacroAverages;
}

export function buildMacroDonut({
  log,
  today,
  range,
}: MacroDonutArgs): MacroDonutResult {
  const dates = listDates(range, today);
  const tracked = dates.map((d) => dayTotals(log, d)).filter((t) => t.kcal > 0);

  const pAvg = tracked.length
    ? tracked.reduce((s, t) => s + t.p, 0) / tracked.length
    : 0;
  const gAvg = tracked.length
    ? tracked.reduce((s, t) => s + t.g, 0) / tracked.length
    : 0;
  const lAvg = tracked.length
    ? tracked.reduce((s, t) => s + t.l, 0) / tracked.length
    : 0;

  const total = pAvg + gAvg + lAvg;
  const pct = (v: number): number =>
    total > 0 ? Math.round((v / total) * 100) : 0;

  const averages: MacroAverages = {
    p: Math.round(pAvg),
    g: Math.round(gAvg),
    l: Math.round(lAvg),
    pPct: pct(pAvg),
    gPct: pct(gAvg),
    lPct: pct(lAvg),
  };

  return {
    averages,
    data: {
      labels: ['Prot', 'Gluc', 'Lip'],
      datasets: [
        {
          data: [averages.p, averages.g, averages.l],
          backgroundColor: [MACRO_COLORS.p, MACRO_COLORS.g, MACRO_COLORS.l],
          borderWidth: 0,
        },
      ],
    },
  };
}

interface ProteinArgs {
  log: LogByDate;
  today: string;
  targetProtein: number;
}

export interface ProteinChartResult {
  data: ChartData<'bar'>;
}

export function buildProteinChart({
  log,
  today,
  targetProtein,
}: ProteinArgs): ProteinChartResult {
  const dates = listDates(7, today);
  const totals = dates.map((d) => dayTotals(log, d));
  return {
    data: {
      labels: dates.map(formatShortDate),
      datasets: [
        {
          type: 'bar',
          data: totals.map((t) => Math.round(t.p)),
          backgroundColor: 'rgba(106, 239, 175, .55)',
          borderRadius: 6,
          borderSkipped: false,
        },
        {
          type: 'line' as unknown as 'bar',
          data: dates.map(() => targetProtein),
          borderColor: 'rgba(255, 179, 71, .5)',
          borderDash: [5, 5],
          pointRadius: 0,
          borderWidth: 2,
          fill: false,
        } as unknown as ChartData<'bar'>['datasets'][number],
      ],
    },
  };
}
