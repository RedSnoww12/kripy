import { useMemo, useState, type FormEvent } from 'react';
import { useTrackingStore } from '@/store/useTrackingStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { usePalierStore } from '@/store/usePalierStore';
import { toast } from '@/components/ui/toastStore';
import { todayISO } from '@/lib/date';
import { sanitizeDecimal } from '@/lib/numericInput';
import type { WeightEntry } from '@/types';

interface SparkProps {
  data: number[];
  goal?: number;
}

function Sparkline({ data, goal }: SparkProps) {
  if (data.length < 2) {
    return (
      <div className="kl-weight-empty">
        <span>▸ Pas assez de données — 2 pesées min</span>
      </div>
    );
  }

  const w = 360;
  const h = 60;
  const vals = goal !== undefined ? [...data, goal] : data;
  const min = Math.min(...vals) - 0.5;
  const max = Math.max(...vals) + 0.5;
  const range = max - min || 1;

  const pts = data.map(
    (v, i) =>
      [(i / (data.length - 1)) * w, h - ((v - min) / range) * h] as [
        number,
        number,
      ],
  );
  const d = pts
    .map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1))
    .join(' ');
  const fillD = d + ` L ${w},${h} L 0,${h} Z`;
  const goalY = goal !== undefined ? h - ((goal - min) / range) * h : null;
  const last = pts[pts.length - 1];

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="kl-weight-spark"
    >
      <defs>
        <linearGradient id="klWeightG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--acc)" stopOpacity="0.28" />
          <stop offset="1" stopColor="var(--acc)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {goalY !== null && (
        <line
          x1="0"
          y1={goalY}
          x2={w}
          y2={goalY}
          stroke="var(--acc2)"
          strokeWidth="0.8"
          strokeDasharray="3 3"
          opacity="0.6"
          vectorEffect="non-scaling-stroke"
        />
      )}
      <path d={fillD} fill="url(#klWeightG)" />
      <path
        d={d}
        fill="none"
        stroke="var(--acc)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx={last[0]}
        cy={last[1]}
        r="3"
        fill="var(--acc)"
        style={{ filter: 'drop-shadow(0 0 4px var(--acc))' }}
      />
    </svg>
  );
}

export default function WeightCard() {
  const weights = useTrackingStore((s) => s.weights);
  const setWeights = useTrackingStore((s) => s.setWeights);
  const weightSkipped = useTrackingStore((s) => s.weightSkipped);
  const skipWeightForDate = useTrackingStore((s) => s.skipWeightForDate);
  const unskipWeightForDate = useTrackingStore((s) => s.unskipWeightForDate);
  const targets = useSettingsStore((s) => s.targets);
  const phase = useSettingsStore((s) => s.phase);
  const goalWeight = useSettingsStore((s) => s.goalWeight);
  const extendPalier = usePalierStore((s) => s.extend);
  const recomputePalier = usePalierStore((s) => s.recompute);

  const today = todayISO();
  const todayEntry = weights.find((x) => x.date === today);
  const isSkippedToday = weightSkipped.includes(today);
  const [value, setValue] = useState<string>(
    todayEntry ? String(todayEntry.w) : '',
  );

  const { sparkData, latest, delta7 } = useMemo(() => {
    const sorted = [...weights]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);
    const values = sorted.map((x) => x.w);
    const last = values.length ? values[values.length - 1] : null;
    const prev =
      values.length >= 2 ? values[Math.max(0, values.length - 8)] : null;
    return {
      sparkData: values,
      latest: last,
      delta7: last !== null && prev !== null ? +(last - prev).toFixed(1) : null,
    };
  }, [weights]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = parseFloat(value.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 400) {
      toast('Poids invalide', 'error');
      return;
    }

    const entry: WeightEntry = {
      date: today,
      w: +parsed.toFixed(1),
      tgKcal: targets.kcal,
      phase,
    };
    const next = [...weights.filter((x) => x.date !== today), entry].sort(
      (a, b) => a.date.localeCompare(b.date),
    );
    setWeights(next);
    if (isSkippedToday) unskipWeightForDate(today);
    extendPalier(today, targets.kcal, phase);
    recomputePalier(targets.kcal, phase, next);
    toast(`Poids ${entry.w} kg enregistré`, 'success');
  };

  const handleSkip = () => {
    skipWeightForDate(today);
    setValue('');
    toast('Ok, passé pour aujourd’hui', 'success');
  };

  const handleUnskip = () => {
    unskipWeightForDate(today);
  };

  const deltaColor =
    delta7 === null
      ? 'var(--t3)'
      : delta7 < 0
        ? 'var(--acc)'
        : delta7 > 0
          ? 'var(--red)'
          : 'var(--t2)';

  return (
    <section className="kl-weight">
      <div className="kl-weight-head">
        <div>
          <div className="kl-weight-lbl">POIDS · 30D</div>
          <div className="kl-weight-val-line">
            <span className="kl-weight-val">
              {latest !== null ? latest.toFixed(1) : '—'}
            </span>
            <span className="kl-weight-unit">kg</span>
            {delta7 !== null && (
              <span className="kl-weight-delta" style={{ color: deltaColor }}>
                {delta7 > 0 ? '+' : ''}
                {delta7.toFixed(1)} / 7j
              </span>
            )}
          </div>
        </div>
        {goalWeight && (
          <div className="kl-weight-goal">
            <div className="kl-weight-goal-lbl">GOAL</div>
            <div className="kl-weight-goal-val">{goalWeight.toFixed(1)}</div>
          </div>
        )}
      </div>
      <div className="kl-weight-chart">
        <Sparkline data={sparkData} goal={goalWeight} />
      </div>
      {isSkippedToday && !todayEntry ? (
        <div className="kl-weight-skipped" role="status">
          <span className="kl-weight-skipped-msg">
            Pesée passée pour aujourd’hui
          </span>
          <button
            type="button"
            className="kl-weight-skipped-undo"
            onClick={handleUnskip}
          >
            Annuler
          </button>
        </div>
      ) : (
        <form className="kl-weight-form" onSubmit={handleSubmit}>
          <input
            type="text"
            inputMode="decimal"
            className="kl-weight-input"
            value={value}
            onChange={(e) => setValue(sanitizeDecimal(e.target.value))}
            placeholder="Nouveau poids..."
          />
          <button
            type="submit"
            className="kl-weight-log"
            aria-label="Valider poids"
          >
            LOG
          </button>
          <button
            type="button"
            className="kl-weight-skip"
            onClick={handleSkip}
            aria-label="Je ne peux pas me peser aujourd’hui"
            title="Je ne peux pas me peser aujourd’hui"
          >
            PASS
          </button>
        </form>
      )}
    </section>
  );
}
