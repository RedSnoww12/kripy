import { useMemo } from 'react';
import {
  CartesianGrid,
  Dot,
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
  buildPhaseChartData,
  type PhaseChartPoint,
} from '@/features/analysis/charts/phaseChartData';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTrackingStore } from '@/store/useTrackingStore';

const MS_PER_DAY = 86_400_000;

interface ColoredDotProps {
  cx?: number;
  cy?: number;
  payload?: PhaseChartPoint;
}

function ColoredDot({ cx, cy, payload }: ColoredDotProps) {
  if (cx === undefined || cy === undefined || !payload) return null;
  return <Dot cx={cx} cy={cy} r={3} fill={payload.color} stroke="none" />;
}

export default function PhaseChart() {
  const weights = useTrackingStore((s) => s.weights);
  const phase = useSettingsStore((s) => s.phase);
  const currentKcal = useSettingsStore((s) => s.targets.kcal);

  const built = useMemo(
    () => buildPhaseChartData({ weights, phase, currentKcal }),
    [weights, phase, currentKcal],
  );

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
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
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
              tick={{ ...MONO_FONT, fill: CHART_TOKENS.tickMute }}
              interval="preserveStartEnd"
              tickLine={false}
              axisLine={false}
              tickMargin={6}
              height={22}
            />
            <YAxis
              stroke={CHART_TOKENS.tickMute}
              tick={{ ...MONO_FONT, fill: CHART_TOKENS.tickMute }}
              tickLine={false}
              axisLine={false}
              domain={['dataMin - 0.5', 'dataMax + 0.5']}
              width={44}
              tickMargin={4}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--b2)',
                border: '1px solid var(--l1)',
                borderRadius: 8,
                ...MONO_FONT,
              }}
              labelStyle={{ color: 'var(--t2)' }}
              formatter={(value, name, item) => {
                const p = (item as { payload?: PhaseChartPoint })?.payload;
                const suffix = p?.tgKcal ? ` (${p.tgKcal} kcal)` : '';
                return [`${value} kg${suffix}`, name];
              }}
            />
            <Line
              type="monotone"
              dataKey="weight"
              name="Poids"
              stroke={CHART_TOKENS.yellow}
              strokeWidth={2}
              dot={<ColoredDot />}
              isAnimationActive={false}
            />
            <Line
              type="linear"
              dataKey="regression"
              name="Régression"
              stroke={CHART_TOKENS.yellow}
              strokeOpacity={0.55}
              strokeDasharray="5 4"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
