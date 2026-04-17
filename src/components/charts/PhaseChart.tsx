import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  baseLineOptions,
  ensureChartJsRegistered,
} from '@/features/analysis/charts/chartDefaults';
import { buildPhaseChartData } from '@/features/analysis/charts/phaseChartData';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTrackingStore } from '@/store/useTrackingStore';

ensureChartJsRegistered();

const MS_PER_DAY = 86_400_000;

export default function PhaseChart() {
  const weights = useTrackingStore((s) => s.weights);
  const phase = useSettingsStore((s) => s.phase);
  const currentKcal = useSettingsStore((s) => s.targets.kcal);

  const built = useMemo(
    () => buildPhaseChartData({ weights, phase, currentKcal }),
    [weights, phase, currentKcal],
  );

  const options = useMemo(() => {
    if (!built) return baseLineOptions();
    return baseLineOptions({
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: built.tooltipLabel } },
      },
      scales: {
        x: {
          ticks: {
            color: '#5A5E6B',
            font: { family: 'JetBrains Mono', size: 8 },
            maxTicksLimit: 7,
          },
          grid: { display: false },
        },
        y: {
          ticks: {
            color: '#5A5E6B',
            font: { family: 'JetBrains Mono', size: 8 },
          },
          grid: { color: 'rgba(42, 43, 49, .5)' },
        },
      },
    });
  }, [built]);

  if (!built) {
    return (
      <div className="stat-meta">
        Phase {phase} — pas assez de pesées pour une tendance
      </div>
    );
  }

  const spanDays =
    Math.max(
      1,
      (Date.parse(built.endDate) - Date.parse(built.startDate)) / MS_PER_DAY,
    ) + 1;
  const plural = built.kcalLevels.length > 1 ? 's' : '';

  return (
    <>
      <p className="stat-meta">
        Phase {phase} · {built.sampleCount} pesées sur {Math.round(spanDays)}j ·{' '}
        {built.rate > 0 ? '+' : ''}
        {built.rate} kg/sem · {built.totalChange > 0 ? '+' : ''}
        {built.totalChange} kg total · R² {built.r2} · {built.kcalLevels.length}{' '}
        palier{plural}
      </p>
      <div className="stat-chart-wrap" style={{ height: 160 }}>
        <Line data={built.data} options={options} />
      </div>
    </>
  );
}
