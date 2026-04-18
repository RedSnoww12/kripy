import CRTGrid from '../CRTGrid';
import OnbFooter from '../OnbFooter';
import { T, mono, monoMicro } from '../tokens';
import { PHASE_NAMES } from '@/data/constants';
import type { Phase } from '@/types';

interface Props {
  name: string;
  phase: Phase;
  kcal: number;
  targetWeight: number;
  onNext: () => void;
}

export default function ReadyScreen({
  name,
  phase,
  kcal,
  targetWeight,
  onNext,
}: Props) {
  return (
    <div
      style={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <CRTGrid />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--acc) 13%, transparent) 0%, transparent 50%)`,
          pointerEvents: 'none',
        }}
      />

      <div
        className="kripy-scroll"
        style={{
          flex: 1,
          padding: '40px 24px 0',
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            position: 'relative',
            marginBottom: 24,
            animation: 'onbPop .6s .2s backwards cubic-bezier(.2,1.3,.3,1)',
          }}
        >
          <svg width="160" height="160" viewBox="0 0 160 160">
            <defs>
              <linearGradient id="readyG" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={T.acc} />
                <stop offset="100%" stopColor={T.cyan} />
              </linearGradient>
            </defs>
            <g
              style={{
                animation: 'onbSpin 24s linear infinite',
                transformOrigin: '80px 80px',
              }}
            >
              {Array.from({ length: 60 }).map((_, i) => {
                const a = (i / 60) * Math.PI * 2;
                return (
                  <line
                    key={i}
                    x1={80 + Math.cos(a) * 70}
                    y1={80 + Math.sin(a) * 70}
                    x2={80 + Math.cos(a) * 74}
                    y2={80 + Math.sin(a) * 74}
                    stroke={i % 5 === 0 ? T.acc : T.t3}
                    strokeWidth={i % 5 === 0 ? 1.5 : 0.8}
                  />
                );
              })}
            </g>
            <circle
              cx="80"
              cy="80"
              r="56"
              fill="none"
              stroke="url(#readyG)"
              strokeWidth="2"
              opacity=".5"
            />
            <circle
              cx="80"
              cy="80"
              r="48"
              fill={T.bg}
              stroke="url(#readyG)"
              strokeWidth="1"
            />
            <text
              x="80"
              y="62"
              textAnchor="middle"
              dominantBaseline="middle"
              fill={T.t3}
              style={{ ...monoMicro, fontSize: 8 }}
            >
              ▸ LOCKED
            </text>
            <text
              x="80"
              y="82"
              textAnchor="middle"
              dominantBaseline="middle"
              fill={T.acc}
              style={{ ...mono, fontSize: 22, fontWeight: 800 }}
            >
              {phase}
            </text>
            <text
              x="80"
              y="100"
              textAnchor="middle"
              dominantBaseline="middle"
              fill={T.t2}
              style={{ ...monoMicro, fontSize: 7 }}
            >
              {PHASE_NAMES[phase].toUpperCase()}
            </text>
          </svg>
        </div>

        <div style={{ animation: 'onbFadeUp .5s .5s backwards' }}>
          <div
            style={{
              ...monoMicro,
              color: T.acc,
              marginBottom: 12,
              letterSpacing: '.3em',
            }}
          >
            ▸ ACCÈS ACCORDÉ
          </div>
          <h1
            style={{
              fontFamily: "'Space Grotesk',sans-serif",
              fontSize: 30,
              fontWeight: 700,
              color: T.t1,
              margin: 0,
              lineHeight: 1.05,
              letterSpacing: '-.02em',
            }}
          >
            Prêt,
            <br />
            <span style={{ color: T.acc }}>{name || 'opérateur'}</span>.
          </h1>
          <p
            style={{
              ...mono,
              fontSize: 12,
              color: T.t2,
              marginTop: 14,
              lineHeight: 1.6,
              maxWidth: 280,
            }}
          >
            Ta calibration est scellée.
            <br />
            Premier log → streak démarre.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 20,
            marginTop: 24,
            animation: 'onbFadeUp .5s .8s backwards',
          }}
        >
          {[
            { l: 'KCAL', v: String(kcal) },
            { l: 'CIBLE', v: `${targetWeight.toFixed(1)}kg` },
            { l: 'PHASE', v: phase },
          ].map((x) => (
            <div key={x.l} style={{ textAlign: 'center' }}>
              <div style={{ ...monoMicro, fontSize: 7, color: T.t3 }}>
                {x.l}
              </div>
              <div
                style={{
                  ...mono,
                  fontSize: 18,
                  fontWeight: 800,
                  color: T.t1,
                  marginTop: 4,
                }}
              >
                {x.v}
              </div>
            </div>
          ))}
        </div>
      </div>

      <OnbFooter primary="Entrer dans Kripy" onPrimary={onNext} />
    </div>
  );
}
