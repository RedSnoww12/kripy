import { useMemo } from 'react';
import EmptyState from '@/components/ui/EmptyState';
import { weightStats } from '@/features/analysis/trend';
import { useTrackingStore } from '@/store/useTrackingStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { todayISO } from '@/lib/date';

function bmiColor(bmi: string): string {
  const n = parseFloat(bmi);
  if (!Number.isFinite(n)) return 'var(--acc)';
  if (n < 18.5) return 'var(--org)';
  if (n > 25) return 'var(--red)';
  return 'var(--acc)';
}

function rateColor(rate: number): string {
  if (rate < 0) return 'var(--acc)';
  if (rate > 0) return 'var(--red)';
  return 'var(--t2)';
}

interface MetricProps {
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
}

function Metric({ label, value, unit, color }: MetricProps) {
  return (
    <div className="stat-metric">
      <span className="stat-metric-l">{label}</span>
      <span className="stat-metric-v" style={color ? { color } : undefined}>
        {value}
        {unit && <span className="stat-metric-u">{unit}</span>}
      </span>
    </div>
  );
}

interface Props {
  onAdd?: () => void;
}

export default function WeightStatsGrid({ onAdd }: Props = {}) {
  const weights = useTrackingStore((s) => s.weights);
  const height = useSettingsStore((s) => s.height);
  const startWeight = useSettingsStore((s) => s.startWeight);

  const stats = useMemo(
    () =>
      weightStats({
        weights,
        heightCm: height,
        startWeight,
        today: todayISO(),
      }),
    [weights, height, startWeight],
  );

  if (!stats) {
    return (
      <EmptyState
        icon="monitor_weight"
        title="Pas encore de pesée"
        subtitle="Ajoute ta première pesée pour voir tendance, IMC et projections."
        cta={
          onAdd
            ? {
                label: 'Ajouter ma première pesée',
                icon: 'add',
                onClick: onAdd,
              }
            : undefined
        }
      />
    );
  }

  const etaOrReg = stats.estDays
    ? { label: 'ETA', value: `~${stats.estDays}`, unit: 'j' }
    : { label: 'Régularité', value: stats.reg, unit: '%' };

  return (
    <section className="stat-metrics">
      <Metric label="Actuel" value={stats.cur} unit="kg" />
      <Metric
        label="Objectif"
        value={startWeight}
        unit="kg"
        color="var(--org)"
      />
      <Metric label="IMC" value={stats.bmi} color={bmiColor(stats.bmi)} />
      <Metric label="Moy 7j" value={stats.avg7} unit="kg" color="var(--acc)" />
      <Metric
        label="Rythme"
        value={`${stats.rate > 0 ? '+' : ''}${stats.rate}`}
        unit="/sem"
        color={rateColor(stats.rate)}
      />
      <Metric
        label={etaOrReg.label}
        value={etaOrReg.value}
        unit={etaOrReg.unit}
        color="var(--org)"
      />
    </section>
  );
}
