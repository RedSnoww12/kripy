import { useMemo } from 'react';
import {
  Bar,
  CartesianGrid,
  Cell,
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
import {
  buildCalorieBalance,
  type CalorieRange,
  type KcalBarStatus,
} from '@/features/analysis/charts/kcalBalanceData';
import { todayISO } from '@/lib/date';
import { useNutritionStore } from '@/store/useNutritionStore';
import { useTrackingStore } from '@/store/useTrackingStore';
import { useSettingsStore } from '@/store/useSettingsStore';

interface Props {
  range: CalorieRange;
}

const BAR_COLORS: Record<KcalBarStatus, string> = {
  empty: 'var(--l1)',
  over: CHART_TOKENS.red,
  under: CHART_TOKENS.primary,
};

export default function KcalBalanceChart({ range }: Props) {
  const log = useNutritionStore((s) => s.log);
  const weights = useTrackingStore((s) => s.weights);
  const currentKcal = useSettingsStore((s) => s.targets.kcal);
  const today = todayISO();

  const built = useMemo(
    () => buildCalorieBalance({ log, weights, currentKcal, today, range }),
    [log, weights, currentKcal, today, range],
  );

  const tickSize = range > 14 ? 7 : 9;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={built.points}
        margin={{ top: 8, right: 12, left: 4, bottom: 8 }}
      >
        <CartesianGrid
          stroke={CHART_TOKENS.gridMute}
          strokeDasharray="3 3"
          vertical={false}
        />
        <XAxis
          dataKey="label"
          stroke={CHART_TOKENS.tickMute}
          tick={{
            fontFamily: 'JetBrains Mono',
            fontSize: tickSize,
            fill: CHART_TOKENS.tickMute,
          }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          tickMargin={6}
          height={22}
        />
        <YAxis
          stroke={CHART_TOKENS.tickMute}
          tick={{ ...MONO_FONT, fill: CHART_TOKENS.tickMute }}
          tickLine={false}
          axisLine={false}
          width={52}
          tickMargin={4}
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
          formatter={(value, name) => [`${value} kcal`, name]}
        />
        <Bar
          dataKey="kcal"
          name="Consommé"
          radius={[6, 6, 0, 0]}
          fillOpacity={0.55}
          isAnimationActive={false}
        >
          {built.points.map((p, i) => (
            <Cell key={i} fill={BAR_COLORS[p.status]} />
          ))}
        </Bar>
        <Line
          type="stepAfter"
          dataKey="target"
          name="Objectif"
          stroke={CHART_TOKENS.orange}
          strokeOpacity={0.6}
          strokeDasharray="5 5"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
