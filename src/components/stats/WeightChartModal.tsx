import { useMemo, useState } from 'react';
import WeightChart from '@/components/charts/WeightChart';
import RangeSelector from '@/components/charts/RangeSelector';
import Modal from '@/components/ui/Modal';
import { buildProgressStats } from '@/features/analysis/progressStats';
import { weightStats } from '@/features/analysis/trend';
import {
  WEIGHT_RANGES,
  type WeightRange,
} from '@/features/analysis/charts/weightChartData';
import { todayISO } from '@/lib/date';
import { useNutritionStore } from '@/store/useNutritionStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTrackingStore } from '@/store/useTrackingStore';

interface Props {
  open: boolean;
  onClose: () => void;
}

function signed(value: number, digits = 1): string {
  const fixed = value.toFixed(digits);
  return value > 0 ? `+${fixed}` : fixed;
}

/**
 * Vue agrandie du graphe de poids : par défaut sur « Tout » pour montrer
 * l'intégralité de la progression, avec les repères chiffrés clés sous le
 * graphe (début, min, max, actuel, variation totale).
 */
export default function WeightChartModal({ open, onClose }: Props) {
  const weights = useTrackingStore((s) => s.weights);
  const log = useNutritionStore((s) => s.log);
  const height = useSettingsStore((s) => s.height);
  const startWeight = useSettingsStore((s) => s.startWeight);
  const targets = useSettingsStore((s) => s.targets);
  const [range, setRange] = useState<WeightRange>(9999);

  const today = todayISO();

  const stats = useMemo(
    () => weightStats({ weights, heightCm: height, startWeight, today }),
    [weights, height, startWeight, today],
  );

  const progress = useMemo(
    () => buildProgressStats({ weights, log, targets, today }),
    [weights, log, targets, today],
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      contentStyle={{ width: 'min(100%, 640px)' }}
    >
      <div className="stat-zoom-head">
        <div>
          <h3 className="stat-zoom-title">Progression du poids</h3>
          <p className="stat-zoom-sub">
            {stats
              ? `${stats.count} pesées · ${progress.daysTracked} jours de suivi`
              : 'Pas encore de données'}
          </p>
        </div>
        <button
          type="button"
          className="stat-zoom-close"
          onClick={onClose}
          aria-label="Fermer le graphe agrandi"
        >
          <span className="material-symbols-outlined" aria-hidden>
            close
          </span>
        </button>
      </div>

      <RangeSelector
        options={WEIGHT_RANGES}
        value={range}
        onChange={setRange}
      />

      <div className="stat-zoom-chart">
        <WeightChart weights={weights} range={range} goalWeight={startWeight} />
      </div>

      {stats && (
        <>
          <div className="stat-zoom-grid">
            <div className="stat-zoom-cell">
              <span className="stat-zoom-cell-l">Départ</span>
              <span className="stat-zoom-cell-v mono">{stats.start} kg</span>
            </div>
            <div className="stat-zoom-cell">
              <span className="stat-zoom-cell-l">Actuel</span>
              <span className="stat-zoom-cell-v mono">{stats.cur} kg</span>
            </div>
            <div className="stat-zoom-cell">
              <span className="stat-zoom-cell-l">Min</span>
              <span
                className="stat-zoom-cell-v mono"
                style={{ color: 'var(--acc)' }}
              >
                {stats.mn} kg
              </span>
            </div>
            <div className="stat-zoom-cell">
              <span className="stat-zoom-cell-l">Max</span>
              <span
                className="stat-zoom-cell-v mono"
                style={{ color: 'var(--red)' }}
              >
                {stats.mx} kg
              </span>
            </div>
            <div className="stat-zoom-cell">
              <span className="stat-zoom-cell-l">Total</span>
              <span
                className="stat-zoom-cell-v mono"
                style={{
                  color:
                    progress.totalChangeKg < 0 ? 'var(--acc)' : 'var(--red)',
                }}
              >
                {signed(progress.totalChangeKg)} kg
              </span>
            </div>
            <div className="stat-zoom-cell">
              <span className="stat-zoom-cell-l">Rythme</span>
              <span
                className="stat-zoom-cell-v mono"
                style={{ color: stats.rate < 0 ? 'var(--acc)' : 'var(--red)' }}
              >
                {signed(stats.rate, 2)}/sem
              </span>
            </div>
          </div>

          {stats.estDays !== null && (
            <p className="stat-zoom-eta">
              À ce rythme, objectif {startWeight} kg atteint dans ~
              <strong>{stats.estDays} jours</strong>
            </p>
          )}
        </>
      )}
    </Modal>
  );
}
