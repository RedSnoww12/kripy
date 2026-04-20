import { useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  CHART_TOKENS,
  MONO_FONT,
} from '@/features/analysis/charts/chartDefaults';
import { buildPhaseComparisonData } from '@/features/analysis/charts/phaseComparisonData';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTrackingStore } from '@/store/useTrackingStore';

interface MergedRow {
  day: number;
  [seriesId: string]: number;
}

export default function PhaseComparisonChart() {
  const weights = useTrackingStore((s) => s.weights);
  const phase = useSettingsStore((s) => s.phase);

  const data = useMemo(
    () => buildPhaseComparisonData({ weights, phase }),
    [weights, phase],
  );

  const merged = useMemo<MergedRow[]>(() => {
    if (!data) return [];
    const byDay = new Map<number, MergedRow>();
    for (const s of data.series) {
      for (const p of s.points) {
        const row = byDay.get(p.day) ?? { day: p.day };
        row[s.id] = p.delta;
        byDay.set(p.day, row);
      }
    }
    return Array.from(byDay.values()).sort((a, b) => a.day - b.day);
  }, [data]);

  if (!data) {
    return (
      <div className="stat-meta">
        Phase {phase} — pas encore assez de segments pour comparer. Reviens
        après une nouvelle phase {phase}.
      </div>
    );
  }

  return (
    <>
      <p className="stat-meta">
        Phase {phase} · {data.series.length} segments · delta poids (kg) aligné
        sur jour 0
      </p>
      <ul className="stat-cmp-list">
        {data.series.map((s) => (
          <li key={s.id} style={{ color: s.color }}>
            <span
              className="stat-dot"
              style={{ background: s.color, marginRight: 6 }}
            />
            {s.label} · {s.sampleCount} pesées ·{' '}
            {s.totalChange > 0 ? '+' : ''}
            {s.totalChange} kg · {s.rate > 0 ? '+' : ''}
            {s.rate} kg/sem
          </li>
        ))}
      </ul>
      <div className="stat-chart-wrap" style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={merged}
            margin={{ top: 6, right: 8, left: 0, bottom: 4 }}
          >
            <CartesianGrid
              stroke={CHART_TOKENS.gridMute}
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="day"
              type="number"
              stroke={CHART_TOKENS.tickMute}
              tick={{ ...MONO_FONT, fill: CHART_TOKENS.tickMute }}
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              height={18}
              label={{
                value: 'Jours depuis début segment',
                position: 'insideBottom',
                offset: -2,
                style: { ...MONO_FONT, fill: CHART_TOKENS.tickMute },
              }}
            />
            <YAxis
              stroke={CHART_TOKENS.tickMute}
              tick={{ ...MONO_FONT, fill: CHART_TOKENS.tickMute }}
              tickLine={false}
              axisLine={false}
              domain={['dataMin - 0.3', 'dataMax + 0.3']}
              width={34}
              tickMargin={2}
              label={{
                value: 'Δ kg',
                angle: -90,
                position: 'insideLeft',
                offset: 12,
                style: { ...MONO_FONT, fill: CHART_TOKENS.tickMute },
              }}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--b2)',
                border: '1px solid var(--l1)',
                borderRadius: 8,
                ...MONO_FONT,
              }}
              labelFormatter={(v) => `J${v}`}
              formatter={(value, name) => {
                const v = typeof value === 'number' ? value.toFixed(2) : value;
                const label = data.series.find((s) => s.id === name)?.label;
                return [`${v} kg`, label ?? name];
              }}
            />
            <Legend
              wrapperStyle={{ ...MONO_FONT, color: CHART_TOKENS.tickMute }}
              formatter={(value) =>
                data.series.find((s) => s.id === value)?.label ?? value
              }
            />
            {data.series.map((s) => (
              <Line
                key={s.id}
                type="monotone"
                dataKey={s.id}
                name={s.id}
                stroke={s.color}
                strokeWidth={s.isCurrent ? 2.2 : 1.5}
                strokeDasharray={s.isCurrent ? undefined : '5 4'}
                dot={{ r: s.isCurrent ? 3 : 2, fill: s.color, strokeWidth: 0 }}
                connectNulls
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
