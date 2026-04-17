import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  baseLineOptions,
  ensureChartJsRegistered,
} from '@/features/analysis/charts/chartDefaults';
import { buildPalierChartData } from '@/features/analysis/charts/palierChartData';
import { palierDays } from '@/features/analysis/palier';
import { trend72 } from '@/features/analysis/trend';
import { todayISO } from '@/lib/date';
import { usePalierStore } from '@/store/usePalierStore';
import { useTrackingStore } from '@/store/useTrackingStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useNutritionStore } from '@/store/useNutritionStore';

ensureChartJsRegistered();

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
    return {
      kind: 'ready' as const,
      built,
      days,
      confidence,
    };
  }, [weights, palier, targets.kcal, phase, log, today]);

  const options = useMemo(
    () =>
      baseLineOptions({
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y} kg`,
            },
          },
        },
        scales: {
          x: {
            ticks: {
              color: '#5A5E6B',
              font: { family: 'JetBrains Mono', size: 8 },
              maxTicksLimit: 6,
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
    [],
  );

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
        <Line data={built.data} options={options} />
      </div>
    </>
  );
}
