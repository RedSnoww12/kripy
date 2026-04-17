import { useMemo } from 'react';
import {
  CartesianGrid,
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
import { buildPalierChartData } from '@/features/analysis/charts/palierChartData';
import { palierDays } from '@/features/analysis/palier';
import { trend72 } from '@/features/analysis/trend';
import { todayISO } from '@/lib/date';
import { usePalierStore } from '@/store/usePalierStore';
import { useTrackingStore } from '@/store/useTrackingStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useNutritionStore } from '@/store/useNutritionStore';

export default function PalierChart() {
  const weights = useTrackingStore((s) => s.weights);
  const palier = usePalierStore((s) => s.palier);
  const targets = useSettingsStore((s) => s.targets);
  const phase = useSettingsStore((s) => s.phase);
  const log = useNutritionStore((s) => s.log);

  const today = todayISO();

  const payload = useMemo(() => {
    if (!palier) return null;
    const built = buildPalierChartData({ weights, palier });
    if (!built) return { kind: 'empty' as const };
    const days = palierDays(palier, today);
    const tr = trend72({
      weights,
      palier,
      currentKcal: targets.kcal,
      currentPhase: phase,
      log,
      today,
    });
    const confidence = tr?.confidence ?? 'low';
    return { kind: 'ready' as const, built, days, confidence };
  }, [weights, palier, targets.kcal, phase, log, today]);

  if (!palier || !payload) {
    return (
      <div className="stat-meta">
        Aucun palier actif (renseigne tes cibles et phase).
      </div>
    );
  }

  if (payload.kind === 'empty') {
    return (
      <div className="stat-meta">
        Palier {palier.kcal} kcal · phase {palier.phase} — trop peu de pesées
        pour une tendance
      </div>
    );
  }

  const { built, days, confidence } = payload;

  return (
    <>
      <p className="stat-meta">
        Palier {palier.kcal} kcal · phase {palier.phase} · {built.sampleCount}{' '}
        pesées sur {days + 1}j · {built.rate > 0 ? '+' : ''}
        {built.rate} kg/sem · conf {confidence} · R² {built.r2}
      </p>
      <div className="stat-chart-wrap" style={{ height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
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
              domain={['dataMin - 0.5', 'dataMax + 0.5']}
              width={30}
              tickMargin={2}
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
            <Line
              type="monotone"
              dataKey="weight"
              name="Poids"
              stroke={CHART_TOKENS.cyan}
              strokeWidth={2.2}
              dot={{ r: 3, fill: CHART_TOKENS.cyan, strokeWidth: 0 }}
              isAnimationActive={false}
            />
            <Line
              type="linear"
              dataKey="regression"
              name="Régression"
              stroke={CHART_TOKENS.cyan}
              strokeOpacity={0.6}
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
