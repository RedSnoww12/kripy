import type { ChartData, TooltipItem } from 'chart.js';
import type { Phase, WeightEntry } from '@/types';
import { formatShortDate } from '@/lib/date';
import { linReg, type LinRegPoint } from '../trend';
import { CHART_COLORS } from './chartDefaults';

const MS_PER_DAY = 86_400_000;
const PALETTE = [
  CHART_COLORS.yellow,
  CHART_COLORS.pink,
  CHART_COLORS.purple,
  CHART_COLORS.primary,
  CHART_COLORS.orange,
  CHART_COLORS.cyan,
];

interface EnrichedPoint {
  date: string;
  w: number;
  tgKcal: number;
}

export interface PhaseChartResult {
  data: ChartData<'line'>;
  tooltipLabel: (ctx: TooltipItem<'line'>) => string;
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
  return weights
    .filter((e) => (typeof e.phase === 'string' ? e.phase === phase : true))
    .map((e) => ({
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
  const regressionLine = regPoints.map(
    (pt) => +(lr.slope * pt.x + lr.intercept).toFixed(2),
  );

  const kcalLevels = Array.from(new Set(pts.map((e) => e.tgKcal)));
  const colorFor = (k: number): string =>
    PALETTE[kcalLevels.indexOf(k) % PALETTE.length];
  const pointColors = pts.map((e) => colorFor(e.tgKcal));

  return {
    rate: +(lr.slope * 7).toFixed(2),
    r2: +lr.r2.toFixed(2),
    startDate: pts[0].date,
    endDate: pts[pts.length - 1].date,
    totalChange: +(pts[pts.length - 1].w - pts[0].w).toFixed(1),
    sampleCount: pts.length,
    kcalLevels,
    tooltipLabel: (ctx) => {
      const point = pts[ctx.dataIndex];
      const suffix = point?.tgKcal ? ` (${point.tgKcal} kcal)` : '';
      return `${ctx.dataset.label}: ${ctx.parsed.y} kg${suffix}`;
    },
    data: {
      labels: pts.map((pt) => formatShortDate(pt.date)),
      datasets: [
        {
          label: 'Poids',
          data: pts.map((pt) => pt.w),
          borderColor: CHART_COLORS.yellow,
          backgroundColor: 'rgba(255, 217, 61, .06)',
          fill: true,
          tension: 0.25,
          pointRadius: 3,
          pointBackgroundColor: pointColors,
          pointBorderColor: pointColors,
          borderWidth: 2,
        },
        {
          label: 'Régression',
          data: regressionLine,
          borderColor: 'rgba(255, 217, 61, .55)',
          borderDash: [5, 4],
          pointRadius: 0,
          borderWidth: 1.5,
          fill: false,
        },
      ],
    },
  };
}
