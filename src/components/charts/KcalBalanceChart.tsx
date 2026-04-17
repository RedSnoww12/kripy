import { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  baseBarOptions,
  ensureChartJsRegistered,
} from '@/features/analysis/charts/chartDefaults';
import {
  buildCalorieBalance,
  type CalorieBalanceResult,
  type CalorieRange,
} from '@/features/analysis/charts/kcalBalanceData';
import { todayISO } from '@/lib/date';
import { useNutritionStore } from '@/store/useNutritionStore';
import { useTrackingStore } from '@/store/useTrackingStore';
import { useSettingsStore } from '@/store/useSettingsStore';

interface Props {
  range: CalorieRange;
}

ensureChartJsRegistered();

export default function KcalBalanceChart({ range }: Props) {
  const log = useNutritionStore((s) => s.log);
  const weights = useTrackingStore((s) => s.weights);
  const currentKcal = useSettingsStore((s) => s.targets.kcal);
  const today = todayISO();

  const built: CalorieBalanceResult = useMemo(
    () => buildCalorieBalance({ log, weights, currentKcal, today, range }),
    [log, weights, currentKcal, today, range],
  );

  const options = useMemo(
    () =>
      baseBarOptions({
        scales: {
          x: {
            ticks: {
              color: '#5A5E6B',
              font: {
                family: 'JetBrains Mono',
                size: range > 14 ? 7 : 8,
              },
              maxTicksLimit: range > 14 ? 8 : 14,
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
      }),
    [range],
  );

  return <Bar data={built.data} options={options} />;
}
