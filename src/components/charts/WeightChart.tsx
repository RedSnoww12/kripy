import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  ensureChartJsRegistered,
  baseLineOptions,
  CHART_COLORS,
  MONO_FONT,
} from '@/features/analysis/charts/chartDefaults';
import {
  buildWeightChartData,
  type WeightRange,
} from '@/features/analysis/charts/weightChartData';
import type { WeightEntry } from '@/types';

interface Props {
  weights: readonly WeightEntry[];
  range: WeightRange;
  goalWeight: number;
}

ensureChartJsRegistered();

export default function WeightChart({ weights, range, goalWeight }: Props) {
  const data = useMemo(
    () => buildWeightChartData({ weights, range, goalWeight }),
    [weights, range, goalWeight],
  );

  const options = useMemo(
    () =>
      baseLineOptions({
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              color: CHART_COLORS.legendMute,
              font: { ...MONO_FONT, size: 9 },
              padding: 10,
              usePointStyle: true,
              pointStyleWidth: 8,
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y} kg`,
            },
          },
        },
      }),
    [],
  );

  if (!data) {
    return (
      <div className="stat-chart-empty">Aucune pesée sur cette fenêtre</div>
    );
  }

  return <Line data={data} options={options} />;
}
