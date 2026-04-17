import { useMemo } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
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
  buildWeightChartData,
  type WeightRange,
} from '@/features/analysis/charts/weightChartData';
import type { WeightEntry } from '@/types';

interface Props {
  weights: readonly WeightEntry[];
  range: WeightRange;
  goalWeight: number;
}

export default function WeightChart({ weights, range, goalWeight }: Props) {
  const result = useMemo(
    () => buildWeightChartData({ weights, range, goalWeight }),
    [weights, range, goalWeight],
  );

  if (!result) {
    return (
      <div className="stat-chart-empty">Aucune pesée sur cette fenêtre</div>
    );
  }

  const dotSize = result.dense ? 0 : 3;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={result.points}
        margin={{ top: 6, right: 8, left: 0, bottom: 4 }}
      >
        <CartesianGrid stroke={CHART_TOKENS.gridMute} strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          stroke={CHART_TOKENS.tickMute}
          tick={{ ...MONO_FONT, fill: CHART_TOKENS.tickMute }}
          interval="preserveStartEnd"
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
          domain={['dataMin - 1', 'dataMax + 1']}
          width={30}
          tickMargin={2}
          tickFormatter={(v: number) => `${v}`}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--b2)',
            border: '1px solid var(--l1)',
            borderRadius: 8,
            ...MONO_FONT,
          }}
          labelStyle={{ color: 'var(--t2)' }}
          formatter={(value, name) => [`${value} kg`, name]}
        />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ ...MONO_FONT, color: CHART_TOKENS.tickMute }}
        />
        <Line
          type="monotone"
          dataKey="weight"
          name="Poids"
          stroke={CHART_TOKENS.primary}
          strokeWidth={2.5}
          dot={{ r: dotSize, fill: CHART_TOKENS.primary, strokeWidth: 0 }}
          activeDot={{ r: 4 }}
          isAnimationActive={false}
        />
        {result.hasEma && (
          <Line
            type="monotone"
            dataKey="ema"
            name="Tendance (EMA)"
            stroke={CHART_TOKENS.orange}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        )}
        {result.hasGoal && (
          <Line
            type="linear"
            dataKey="goal"
            name="Objectif"
            stroke={CHART_TOKENS.orange}
            strokeDasharray="6 4"
            strokeOpacity={0.5}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
