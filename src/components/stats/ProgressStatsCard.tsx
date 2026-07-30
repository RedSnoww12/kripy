import { useMemo } from 'react';
import { buildProgressStats } from '@/features/analysis/progressStats';
import { formatShortDate, todayISO } from '@/lib/date';
import { useNutritionStore } from '@/store/useNutritionStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTrackingStore } from '@/store/useTrackingStore';

function signed(value: number, digits = 1): string {
  const fixed = value.toFixed(digits);
  return value > 0 ? `+${fixed}` : fixed;
}

function changeColor(value: number): string {
  if (value < 0) return 'var(--acc)';
  if (value > 0) return 'var(--red)';
  return 'var(--t2)';
}

function adherenceColor(pct: number): string {
  if (pct >= 80) return 'var(--acc)';
  if (pct >= 50) return 'var(--org)';
  return 'var(--red)';
}

interface RowProps {
  label: string;
  value: string;
  hint?: string;
  color?: string;
}

function Row({ label, value, hint, color }: RowProps) {
  return (
    <div className="stat-prog-row">
      <span className="stat-prog-l">{label}</span>
      <span className="stat-prog-v">
        <span className="mono" style={color ? { color } : undefined}>
          {value}
        </span>
        {hint && <span className="stat-prog-hint">{hint}</span>}
      </span>
    </div>
  );
}

export default function ProgressStatsCard() {
  const weights = useTrackingStore((s) => s.weights);
  const log = useNutritionStore((s) => s.log);
  const targets = useSettingsStore((s) => s.targets);

  const stats = useMemo(
    () => buildProgressStats({ weights, log, targets, today: todayISO() }),
    [weights, log, targets],
  );

  if (weights.length === 0) {
    return (
      <div className="stat-chart-empty">
        Ajoute des pesées pour voir ta dynamique de progression
      </div>
    );
  }

  return (
    <div className="stat-prog">
      <Row
        label="Depuis le début"
        value={`${signed(stats.totalChangeKg)} kg`}
        hint={stats.daysTracked > 0 ? `en ${stats.daysTracked} j` : undefined}
        color={changeColor(stats.totalChangeKg)}
      />
      {stats.weekOverWeekKg !== null && (
        <Row
          label="Cette semaine vs précédente"
          value={`${signed(stats.weekOverWeekKg, 2)} kg`}
          hint="moyennes 7j"
          color={changeColor(stats.weekOverWeekKg)}
        />
      )}
      {stats.bestWeek && (
        <Row
          label="Meilleure semaine"
          value={`${signed(stats.bestWeek.deltaKg, 2)} kg`}
          hint={`dès le ${formatShortDate(stats.bestWeek.startDate)}`}
          color="var(--acc)"
        />
      )}
      {stats.worstWeek && (
        <Row
          label="Semaine la plus dure"
          value={`${signed(stats.worstWeek.deltaKg, 2)} kg`}
          hint={`dès le ${formatShortDate(stats.worstWeek.startDate)}`}
          color="var(--org)"
        />
      )}
      <Row
        label="Série de pesées"
        value={`${stats.weighInStreak} j`}
        hint={`${stats.weighInRate30} % sur 30j`}
        color={stats.weighInStreak >= 3 ? 'var(--acc)' : 'var(--t2)'}
      />
      {stats.kcalAdherence14 !== null && (
        <Row
          label="Cible kcal tenue"
          value={`${stats.kcalAdherence14} %`}
          hint={`${stats.trackedDays14}/14 j tracés`}
          color={adherenceColor(stats.kcalAdherence14)}
        />
      )}
      {stats.bestLogStreak > 1 && (
        <Row
          label="Meilleure série de tracking"
          value={`${stats.bestLogStreak} j`}
          color="var(--cyan)"
        />
      )}
    </div>
  );
}
