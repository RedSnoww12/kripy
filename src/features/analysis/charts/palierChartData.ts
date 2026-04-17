import type { ChartData } from 'chart.js';
import type { Palier, WeightEntry } from '@/types';
import { formatShortDate } from '@/lib/date';
import { linReg, type LinRegPoint } from '../trend';
import { CHART_COLORS } from './chartDefaults';

const MS_PER_DAY = 86_400_000;

export interface PalierChartResult {
  data: ChartData<'line'>;
  rate: number;
  r2: number;
  sampleCount: number;
}

export function selectPalierWeights(
  weights: readonly WeightEntry[],
  palier: Palier,
): WeightEntry[] {
  return weights.filter(
    (e) =>
      e.date >= palier.startDate &&
      (typeof e.tgKcal !== 'number' || e.tgKcal === palier.kcal) &&
      (typeof e.phase !== 'string' || e.phase === palier.phase),
  );
}

interface BuildArgs {
  weights: readonly WeightEntry[];
  palier: Palier;
}

export function buildPalierChartData({
  weights,
  palier,
}: BuildArgs): PalierChartResult | null {
  const slice = selectPalierWeights(weights, palier);
  if (slice.length < 2) return null;

  const t0 = Date.parse(slice[0].date);
  const regPoints: LinRegPoint[] = slice.map((pt) => ({
    x: (Date.parse(pt.date) - t0) / MS_PER_DAY,
    y: pt.w,
  }));
  const lr = linReg(regPoints);
  const regressionLine = regPoints.map(
    (pt) => +(lr.slope * pt.x + lr.intercept).toFixed(2),
  );

  return {
    rate: +(lr.slope * 7).toFixed(2),
    r2: +lr.r2.toFixed(2),
    sampleCount: slice.length,
    data: {
      labels: slice.map((pt) => formatShortDate(pt.date)),
      datasets: [
        {
          label: 'Poids',
          data: slice.map((pt) => pt.w),
          borderColor: CHART_COLORS.cyan,
          backgroundColor: 'rgba(77, 208, 225, .08)',
          fill: true,
          tension: 0.3,
          pointRadius: 3,
          pointBackgroundColor: CHART_COLORS.cyan,
          borderWidth: 2.2,
        },
        {
          label: 'Régression',
          data: regressionLine,
          borderColor: 'rgba(77, 208, 225, .6)',
          borderDash: [5, 4],
          pointRadius: 0,
          borderWidth: 1.5,
          fill: false,
        },
      ],
    },
  };
}
