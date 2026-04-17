import { useMemo } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  CHART_TOKENS,
  MONO_FONT,
} from '@/features/analysis/charts/chartDefaults';
import { buildProteinChart } from '@/features/analysis/charts/macroAverages';
import { todayISO } from '@/lib/date';
import { useNutritionStore } from '@/store/useNutritionStore';
import { useSettingsStore } from '@/store/useSettingsStore';

export default function ProteinChart() {
  const log = useNutritionStore((s) => s.log);
  const targetProtein = useSettingsStore((s) => s.targets.prot);
  const today = todayISO();

  const built = useMemo(
    () => buildProteinChart({ log, today, targetProtein }),
    [log, today, targetProtein],
  );

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={built.points}
        margin={{ top: 6, right: 8, left: 0, bottom: 4 }}
      >
        <CartesianGrid
          stroke={CHART_TOKENS.gridMute}
          strokeDasharray="3 3"
          vertical={false}
        />
        <XAxis
          dataKey="label"
          stroke={CHART_TOKENS.tickMute}
          tick={{ ...MONO_FONT, fill: CHART_TOKENS.tickMute }}
          tickLine={false}
          axisLine={false}
          tickMargin={4}
          height={18}
        />
        <YAxis
          stroke={CHART_TOKENS.tickMute}
          tick={{ ...MONO_FONT, fill: CHART_TOKENS.tickMute }}
          tickLine={false}
          axisLine={false}
          width={30}
          tickMargin={2}
        />
        <Tooltip
          cursor={{ fill: 'var(--l1)', opacity: 0.4 }}
          contentStyle={{
            background: 'var(--b2)',
            border: '1px solid var(--l1)',
            borderRadius: 8,
            ...MONO_FONT,
          }}
          labelStyle={{ color: 'var(--t2)' }}
          formatter={(value, name) => [`${value} g`, name]}
        />
        <Bar
          dataKey="protein"
          name="Protéines"
          fill={CHART_TOKENS.primary}
          fillOpacity={0.55}
          radius={[6, 6, 0, 0]}
          isAnimationActive={false}
        />
        <Line
          type="linear"
          dataKey="target"
          name="Objectif"
          stroke={CHART_TOKENS.orange}
          strokeOpacity={0.5}
          strokeDasharray="5 5"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
