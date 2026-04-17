import { useMemo } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTrackingStore } from '@/store/useTrackingStore';
import { formatShortDate } from '@/lib/date';
import { PHASE_COLORS } from '@/data/constants';
import type { WeightEntry } from '@/types';

type TrendClass = 'up' | 'down' | 'flat';

interface Row {
  entry: WeightEntry;
  phase: string;
  phaseColor: string;
  trendIcon: string;
  trendValue: string;
  trendClass: TrendClass;
}

function buildRows(
  weights: readonly WeightEntry[],
  fallbackPhase: string,
): Row[] {
  return weights
    .map((entry, idx) => {
      const phase = entry.phase ?? fallbackPhase;
      const phaseColor =
        PHASE_COLORS[phase as keyof typeof PHASE_COLORS] ?? '#6AEFAF';

      let trendIcon: string = 'trending_flat';
      let trendClass: TrendClass = 'flat';
      let trendValue = '0.0';
      if (idx >= 1) {
        const diff = +(entry.w - weights[idx - 1].w).toFixed(1);
        if (diff < -0.05) {
          trendIcon = 'trending_down';
          trendClass = 'down';
          trendValue = diff.toString();
        } else if (diff > 0.05) {
          trendIcon = 'trending_up';
          trendClass = 'up';
          trendValue = `+${diff}`;
        } else {
          trendValue = diff.toFixed(1);
        }
      }

      return {
        entry,
        phase,
        phaseColor,
        trendIcon,
        trendValue,
        trendClass,
      };
    })
    .reverse();
}

interface Props {
  onEdit: (date: string) => void;
}

export default function WeightHistoryTable({ onEdit }: Props) {
  const weights = useTrackingStore((s) => s.weights);
  const currentPhase = useSettingsStore((s) => s.phase);

  const rows = useMemo(
    () => buildRows(weights, currentPhase),
    [weights, currentPhase],
  );

  if (rows.length === 0) {
    return <div className="stat-wh-empty">Aucune pesée enregistrée</div>;
  }

  return (
    <div className="stat-wh-body">
      {rows.map(
        ({ entry, phase, phaseColor, trendIcon, trendValue, trendClass }) => (
          <button
            key={entry.date}
            type="button"
            className="stat-wh-row"
            onClick={() => onEdit(entry.date)}
          >
            <span className="stat-wh-date">{formatShortDate(entry.date)}</span>
            <span className="stat-wh-phase">
              <span
                className="stat-wh-dot"
                style={{
                  background: phaseColor,
                  boxShadow: `0 0 8px ${phaseColor}`,
                }}
              />
              <span className="stat-wh-phase-l">{phase}</span>
            </span>
            <span className="stat-wh-weight">
              {entry.w}
              <span className="stat-wh-unit">kg</span>
            </span>
            <span className={`stat-wh-trend ${trendClass}`}>
              <span className="material-symbols-outlined">{trendIcon}</span>
              <span className="stat-wh-trend-v">{trendValue}</span>
            </span>
          </button>
        ),
      )}
    </div>
  );
}
