import { useMemo, useState } from 'react';
import {
  AVERAGE_WINDOWS,
  MAX_WINDOW_DAYS,
  MIN_WINDOW_DAYS,
  buildTargetGroups,
  compareWindows,
} from '@/features/analysis/averages';
import { formatShortDate, todayISO } from '@/lib/date';
import { sanitizeInteger } from '@/lib/numericInput';
import { useNutritionStore } from '@/store/useNutritionStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTrackingStore } from '@/store/useTrackingStore';
import type { Phase } from '@/types';

type Mode = 'window' | 'target';

const GOOD = 'var(--acc)';
const BAD = 'var(--org)';
const NEUTRAL = 'var(--t2)';

/** Seuil sous lequel un rythme est considéré comme une stabilité (kg/sem). */
const STABLE_THRESHOLD = 0.1;

/**
 * Un même rythme n'a pas le même sens selon la phase : perdre est un succès en
 * déficit, un échec en prise de masse. La couleur suit donc l'objectif en
 * cours plutôt que le signe brut.
 */
function rateColor(rate: number, phase: Phase): string {
  if (Math.abs(rate) < STABLE_THRESHOLD) {
    return phase === 'B' || phase === 'D' || phase === 'E' ? NEUTRAL : GOOD;
  }
  if (phase === 'D') return rate > 0 ? GOOD : BAD;
  if (phase === 'B' || phase === 'E') return rate < 0 ? GOOD : BAD;
  return NEUTRAL;
}

function signed(value: number, digits: number): string {
  const fixed = value.toFixed(digits);
  return value > 0 ? `+${fixed}` : fixed;
}

function range(start: string, end: string): string {
  return `${formatShortDate(start)} – ${formatShortDate(end)}`;
}

interface CompareRowProps {
  label: string;
  current: string;
  previous: string;
  delta?: { text: string; color: string };
}

function CompareRow({ label, current, previous, delta }: CompareRowProps) {
  return (
    <div className="stat-avg-row">
      <span className="stat-avg-lbl">{label}</span>
      <span className="stat-avg-cur mono">{current}</span>
      <span className="stat-avg-prev mono">{previous}</span>
      <span
        className="stat-avg-delta mono"
        style={delta ? { color: delta.color } : undefined}
      >
        {delta?.text ?? '—'}
      </span>
    </div>
  );
}

export default function AverageLab() {
  const weights = useTrackingStore((s) => s.weights);
  const log = useNutritionStore((s) => s.log);
  const targets = useSettingsStore((s) => s.targets);
  const phase = useSettingsStore((s) => s.phase);

  const [mode, setMode] = useState<Mode>('window');
  const [days, setDays] = useState(7);
  const [customDays, setCustomDays] = useState('');

  const today = todayISO();

  const comparison = useMemo(
    () => compareWindows(weights, log, today, days),
    [weights, log, today, days],
  );

  const groups = useMemo(
    () => buildTargetGroups(weights, log, targets.kcal, today),
    [weights, log, targets.kcal, today],
  );

  const applyCustom = (raw: string) => {
    const clean = sanitizeInteger(raw);
    setCustomDays(clean);
    const n = parseInt(clean, 10);
    if (Number.isFinite(n) && n >= MIN_WINDOW_DAYS && n <= MAX_WINDOW_DAYS) {
      setDays(n);
    }
  };

  const pickPreset = (n: number) => {
    setDays(n);
    setCustomDays('');
  };

  const { current, previous } = comparison;

  return (
    <div className="stat-avg">
      <div className="stat-avg-modes" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'window'}
          className={`stat-avg-mode ${mode === 'window' ? 'on' : ''}`}
          onClick={() => setMode('window')}
        >
          Période
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'target'}
          className={`stat-avg-mode ${mode === 'target' ? 'on' : ''}`}
          onClick={() => setMode('target')}
        >
          Paliers kcal
        </button>
      </div>

      {mode === 'window' ? (
        <>
          <div className="stat-avg-picker">
            {AVERAGE_WINDOWS.map((n) => (
              <button
                key={n}
                type="button"
                className={`stat-avg-day ${days === n && customDays === '' ? 'on' : ''}`}
                onClick={() => pickPreset(n)}
                aria-pressed={days === n && customDays === ''}
              >
                {n} j
              </button>
            ))}
            <input
              type="text"
              inputMode="numeric"
              className="stat-avg-custom"
              placeholder="autre"
              value={customDays}
              onChange={(e) => applyCustom(e.target.value)}
              aria-label="Nombre de jours personnalisé"
            />
          </div>

          <div className="stat-avg-heads">
            <span />
            <span className="stat-avg-head">
              Actuel
              <small>{range(current.startDate, current.endDate)}</small>
            </span>
            <span className="stat-avg-head">
              Précédent
              <small>{range(previous.startDate, previous.endDate)}</small>
            </span>
            <span className="stat-avg-head right">Écart</span>
          </div>

          <CompareRow
            label="Poids moyen"
            current={current.weightKg !== null ? `${current.weightKg} kg` : '—'}
            previous={
              previous.weightKg !== null ? `${previous.weightKg} kg` : '—'
            }
            delta={
              comparison.deltaWeightKg !== null
                ? {
                    text: `${signed(comparison.deltaWeightKg, 2)} kg`,
                    color: rateColor(comparison.deltaWeightKg, phase),
                  }
                : undefined
            }
          />
          <CompareRow
            label="Calories"
            current={current.kcal !== null ? String(current.kcal) : '—'}
            previous={previous.kcal !== null ? String(previous.kcal) : '—'}
            delta={
              comparison.deltaKcal !== null
                ? {
                    text: signed(comparison.deltaKcal, 0),
                    color: NEUTRAL,
                  }
                : undefined
            }
          />
          <CompareRow
            label="Protéines"
            current={current.prot !== null ? `${current.prot} g` : '—'}
            previous={previous.prot !== null ? `${previous.prot} g` : '—'}
            delta={
              comparison.deltaProt !== null
                ? {
                    text: `${signed(comparison.deltaProt, 0)} g`,
                    color: NEUTRAL,
                  }
                : undefined
            }
          />
          <CompareRow
            label="Jours tracés"
            current={`${current.trackedDays}/${current.days}`}
            previous={`${previous.trackedDays}/${previous.days}`}
          />
          <CompareRow
            label="Pesées"
            current={String(current.weighIns)}
            previous={String(previous.weighIns)}
          />

          {comparison.weeklyRateKg !== null && (
            <div className="stat-avg-rate">
              <span className="stat-avg-rate-lbl">Rythme équivalent</span>
              <span
                className="stat-avg-rate-val mono"
                style={{ color: rateColor(comparison.weeklyRateKg, phase) }}
              >
                {signed(comparison.weeklyRateKg, 2)} kg/sem
              </span>
            </div>
          )}

          {comparison.deltaWeightKg === null && (
            <p className="stat-avg-note">
              Pas assez de pesées sur l&apos;une des deux périodes pour
              comparer.
            </p>
          )}
        </>
      ) : (
        <>
          <p className="stat-avg-intro">
            Chaque palier calorique que tu as tenu, avec le rythme de poids
            observé — de quoi comparer directement ce que donnaient 2 900 kcal
            face à 2 700.
          </p>

          {groups.length === 0 ? (
            <div className="stat-chart-empty">
              Ajoute des pesées pour comparer tes paliers
            </div>
          ) : (
            groups.map((g) => (
              <div key={g.targetKcal} className="stat-avg-group">
                <div className="stat-avg-group-head">
                  <span className="stat-avg-group-kcal mono">
                    {g.targetKcal} kcal
                  </span>
                  <span className="stat-avg-group-days mono">
                    {g.days} j · {range(g.firstDate, g.lastDate)}
                  </span>
                </div>
                <div className="stat-avg-group-body">
                  <div className="stat-avg-metric">
                    <span className="stat-avg-metric-lbl">Rythme</span>
                    <span
                      className="stat-avg-metric-val mono"
                      style={
                        g.weeklyRateKg !== null
                          ? { color: rateColor(g.weeklyRateKg, phase) }
                          : undefined
                      }
                    >
                      {g.weeklyRateKg !== null
                        ? `${signed(g.weeklyRateKg, 2)} kg/sem`
                        : '—'}
                    </span>
                  </div>
                  <div className="stat-avg-metric">
                    <span className="stat-avg-metric-lbl">Poids moyen</span>
                    <span className="stat-avg-metric-val mono">
                      {g.weightKg !== null ? `${g.weightKg} kg` : '—'}
                    </span>
                  </div>
                  <div className="stat-avg-metric">
                    <span className="stat-avg-metric-lbl">Réel mangé</span>
                    <span className="stat-avg-metric-val mono">
                      {g.kcal !== null ? `${g.kcal} kcal` : '—'}
                    </span>
                  </div>
                </div>
                {g.kcal !== null && Math.abs(g.kcal - g.targetKcal) > 100 && (
                  <p className="stat-avg-group-warn">
                    {g.kcal > g.targetKcal ? '+' : ''}
                    {Math.round(g.kcal - g.targetKcal)} kcal/j vs la cible — le
                    rythme reflète ce qui a été mangé, pas la cible.
                  </p>
                )}
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}
