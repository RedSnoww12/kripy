import { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  baseBarOptions,
  ensureChartJsRegistered,
} from '@/features/analysis/charts/chartDefaults';
import { buildProteinChart } from '@/features/analysis/charts/macroAverages';
import { todayISO } from '@/lib/date';
import { useNutritionStore } from '@/store/useNutritionStore';
import { useSettingsStore } from '@/store/useSettingsStore';

ensureChartJsRegistered();

export default function ProteinChart() {
  const log = useNutritionStore((s) => s.log);
  const targetProtein = useSettingsStore((s) => s.targets.prot);
  const today = todayISO();

  const built = useMemo(
    () => buildProteinChart({ log, today, targetProtein }),
    [log, today, targetProtein],
  );

  const options = useMemo(() => baseBarOptions(), []);

  return <Bar data={built.data} options={options} />;
}
