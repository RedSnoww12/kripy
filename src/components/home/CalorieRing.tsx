import { useMemo } from 'react';
import { useTweenInt } from '@/hooks/useTween';
import { useSettingsStore } from '@/store/useSettingsStore';
import { PHASE_MULTIPLIERS, PHASE_COLORS } from '@/data/constants';

interface Props {
  consumed: number;
  target: number;
  baseTarget?: number;
}

const SIZE = 220;
const STROKE = 12;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

export default function CalorieRing({ consumed, target, baseTarget }: Props) {
  const phase = useSettingsStore((s) => s.phase);

  const remaining = Math.round(target - consumed);
  const overTarget = remaining < 0;
  const valueRef = useTweenInt<HTMLDivElement>(remaining, 520);
  const smoothDelta = baseTarget !== undefined ? baseTarget - target : 0;

  const { pct, fg, dash } = useMemo(() => {
    const p = target ? Math.min(999, Math.round((consumed / target) * 100)) : 0;
    const over = consumed > target;
    const color = over ? 'var(--red)' : p > 85 ? 'var(--org)' : 'var(--acc)';
    return {
      pct: p,
      fg: color,
      dash: CIRC * Math.min(1, p / 100),
    };
  }, [consumed, target]);

  const phaseColor = PHASE_COLORS[phase];
  const mult = PHASE_MULTIPLIERS[phase];

  return (
    <section className="kl-hero">
      <div className="kl-hero-corners" aria-hidden>
        <span className="kl-hero-corner kl-hero-corner--tl" />
        <span className="kl-hero-corner kl-hero-corner--tr" />
        <span className="kl-hero-corner kl-hero-corner--bl" />
        <span className="kl-hero-corner kl-hero-corner--br" />
      </div>

      <div className="kl-hero-head">
        <div>
          <div className="kl-hero-lbl">KCAL · DAILY BUDGET</div>
          <div className="kl-hero-sub">
            phase{' '}
            <span style={{ color: phaseColor, fontWeight: 700 }}>{phase}</span>{' '}
            · ×{mult.toFixed(2)}
          </div>
        </div>
        <div className="kl-hero-meter">
          <span
            className="kl-hero-pct"
            style={overTarget ? { color: 'var(--red)' } : undefined}
          >
            {pct}% USED
          </span>
          <div className="kl-hero-meter-track">
            <div
              className="kl-hero-meter-fill"
              style={{
                width: `${Math.min(100, pct)}%`,
                background: fg,
                boxShadow: `0 0 6px ${fg}`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="kl-hero-ring-wrap">
        <svg
          className="kl-hero-ring"
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{ transform: 'rotate(-90deg)' }}
        >
          <defs>
            <linearGradient id="klRingG" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="var(--acc)" />
              <stop offset="1" stopColor="var(--acc2)" />
            </linearGradient>
          </defs>
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke="var(--s3)"
            strokeWidth={STROKE}
            fill="none"
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke={overTarget ? 'var(--red)' : 'url(#klRingG)'}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={`${dash} ${CIRC}`}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 10px ${fg})`,
              transition: 'stroke-dasharray 1s cubic-bezier(.22,1,.36,1)',
            }}
          />
          {Array.from({ length: 48 }).map((_, i) => {
            const a = (i / 48) * Math.PI * 2;
            const r1 = R + STROKE / 2 + 6;
            const r2 = r1 + (i % 12 === 0 ? 6 : 3);
            const x1 = SIZE / 2 + Math.cos(a) * r1;
            const y1 = SIZE / 2 + Math.sin(a) * r1;
            const x2 = SIZE / 2 + Math.cos(a) * r2;
            const y2 = SIZE / 2 + Math.sin(a) * r2;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="var(--t3)"
                strokeWidth={i % 12 === 0 ? 1 : 0.5}
                opacity="0.4"
              />
            );
          })}
        </svg>
        <div className="kl-hero-ring-ctr">
          <div className="kl-hero-ring-lbl">
            {overTarget ? 'DÉPASSEMENT' : 'RESTANTES'}
          </div>
          <div
            ref={valueRef}
            className="kl-hero-ring-val"
            style={{ color: overTarget ? 'var(--red)' : 'var(--t1)' }}
          >
            {remaining.toLocaleString('fr-FR')}
          </div>
          <div className="kl-hero-ring-sub">
            <span style={{ color: fg }}>{Math.round(consumed)}</span>
            {' / '}
            {target} kcal
          </div>
          {smoothDelta > 0 && (
            <div className="kl-hero-ring-adj">
              lissage −{smoothDelta} · base {baseTarget}
            </div>
          )}
        </div>
      </div>

      <div className="kl-hero-stats">
        <div className="kl-mini">
          <div className="kl-mini-lbl">INGÉRÉS</div>
          <div className="kl-mini-val" style={{ color: 'var(--org)' }}>
            {Math.round(consumed)}
            <span className="kl-mini-unit">kcal</span>
          </div>
        </div>
        <div className="kl-mini">
          <div className="kl-mini-lbl">RESTANT</div>
          <div
            className="kl-mini-val"
            style={{ color: overTarget ? 'var(--red)' : 'var(--acc)' }}
          >
            {remaining.toLocaleString('fr-FR')}
            <span className="kl-mini-unit">kcal</span>
          </div>
        </div>
      </div>
    </section>
  );
}
