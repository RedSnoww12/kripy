import { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  baseDoughnutOptions,
  ensureChartJsRegistered,
} from '@/features/analysis/charts/chartDefaults';
import {
  buildMacroDonut,
  type MacroDonutResult,
  type MacroRange,
} from '@/features/analysis/charts/macroAverages';
import { todayISO } from '@/lib/date';
import { useNutritionStore } from '@/store/useNutritionStore';

ensureChartJsRegistered();

interface Props {
  range: MacroRange;
}

export default function MacroDonutChart({ range }: Props) {
  const log = useNutritionStore((s) => s.log);
  const today = todayISO();

  const built: MacroDonutResult = useMemo(
    () => buildMacroDonut({ log, today, range }),
    [log, today, range],
  );

  const options = useMemo(() => baseDoughnutOptions(), []);

  return <Doughnut data={built.data} options={options} />;
}
