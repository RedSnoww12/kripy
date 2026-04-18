import OnbHeader from '../OnbHeader';
import OnbFooter from '../OnbFooter';
import OnbLayout from '../OnbLayout';
import { T, mono, monoMicro, onbFadeUp, PHASE_CSS } from '../tokens';
import {
  PHASE_DESCRIPTIONS,
  PHASE_MULTIPLIERS,
  PHASE_NAMES,
} from '@/data/constants';
import type { Phase } from '@/types';

interface Props {
  step: number;
  total: number;
  value: Phase;
  setValue: (v: Phase) => void;
  onNext: () => void;
  onBack: () => void;
}

const ORDER: readonly Phase[] = ['A', 'B', 'F', 'C', 'D', 'E'];

export default function PhaseScreen({
  step,
  total,
  value,
  setValue,
  onNext,
  onBack,
}: Props) {
  return (
    <OnbLayout
      header={
        <OnbHeader
          step={step}
          total={total}
          label="PHASE_LOCK"
          onBack={onBack}
        />
      }
      footer={<OnbFooter primary="Continuer" onPrimary={onNext} />}
    >
      <div style={onbFadeUp(0)}>
        <div style={{ ...monoMicro, color: T.acc, marginBottom: 8 }}>
          ▸ 05 / OBJECTIF
        </div>
        <h1
          style={{
            fontFamily: "'Space Grotesk',sans-serif",
            fontSize: 26,
            fontWeight: 700,
            color: T.t1,
            margin: 0,
            lineHeight: 1.1,
            letterSpacing: '-.02em',
          }}
        >
          Qu'est-ce que
          <br />
          tu vises&nbsp;?
        </h1>
        <p
          style={{
            ...mono,
            fontSize: 11,
            color: T.t3,
            marginTop: 8,
            lineHeight: 1.5,
          }}
        >
          Chaque phase a un multiplicateur kcal.
          <br />
          Switchable à tout moment.
        </p>
      </div>

      <div
        style={{
          ...onbFadeUp(1),
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          marginTop: 18,
        }}
      >
        {ORDER.map((k, idx) => {
          const color = PHASE_CSS[k];
          const sel = value === k;
          return (
            <button
              type="button"
              key={k}
              onClick={() => setValue(k)}
              style={{
                padding: 12,
                borderRadius: 14,
                textAlign: 'left',
                background: sel
                  ? `color-mix(in srgb, ${color} 13%, transparent)`
                  : T.s1,
                border: sel ? `1.5px solid ${color}` : `1px solid ${T.outline}`,
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all .25s cubic-bezier(.2,.9,.3,1)',
                transform: sel ? 'scale(1.02)' : 'scale(1)',
                boxShadow: sel
                  ? `0 8px 24px color-mix(in srgb, ${color} 20%, transparent), 0 0 0 1px color-mix(in srgb, ${color} 40%, transparent)`
                  : 'none',
                animationDelay: `${idx * 60 + 100}ms`,
                animation: 'onbCardIn .45s backwards cubic-bezier(.2,.9,.3,1)',
              }}
            >
              {sel && (
                <div
                  style={{
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    background: `radial-gradient(circle, color-mix(in srgb, ${color} 40%, transparent), transparent 70%)`,
                  }}
                />
              )}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    background: sel
                      ? color
                      : `color-mix(in srgb, ${color} 13%, transparent)`,
                    color: sel ? '#0a1410' : color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...mono,
                    fontSize: 12,
                    fontWeight: 800,
                    boxShadow: sel ? `0 0 12px ${color}` : 'none',
                  }}
                >
                  {k}
                </div>
                <div
                  style={{
                    ...monoMicro,
                    fontSize: 8,
                    color: sel ? color : T.t3,
                  }}
                >
                  ×{PHASE_MULTIPLIERS[k].toFixed(3)}
                </div>
              </div>
              <div
                style={{
                  ...mono,
                  fontSize: 13,
                  fontWeight: 700,
                  color: sel ? T.t1 : T.t2,
                  marginBottom: 4,
                }}
              >
                {PHASE_NAMES[k]}
              </div>
              <div
                style={{
                  ...mono,
                  fontSize: 10,
                  color: T.t3,
                  lineHeight: 1.3,
                }}
              >
                {PHASE_DESCRIPTIONS[k]}
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ ...onbFadeUp(2), marginTop: 14, marginBottom: 16 }}>
        <div
          style={{
            background: T.s0,
            border: `1px dashed ${T.outline}`,
            borderRadius: 12,
            padding: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              background: PHASE_CSS[value],
              boxShadow: `0 0 8px ${PHASE_CSS[value]}`,
              animation: 'onbPulse 1.6s infinite',
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ ...monoMicro, fontSize: 8, color: T.t3 }}>
              ▸ LOCKED
            </div>
            <div
              style={{
                ...mono,
                fontSize: 12,
                fontWeight: 700,
                color: T.t1,
              }}
            >
              Phase {value} · {PHASE_NAMES[value]}
            </div>
          </div>
        </div>
      </div>
    </OnbLayout>
  );
}
