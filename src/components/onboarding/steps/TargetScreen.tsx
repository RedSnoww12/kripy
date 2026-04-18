import { useEffect } from 'react';
import OnbHeader from '../OnbHeader';
import OnbFooter from '../OnbFooter';
import OnbLayout from '../OnbLayout';
import RulerSlider from '../RulerSlider';
import { T, mono, monoMicro, onbFadeUp, PHASE_CSS } from '../tokens';
import type { Phase } from '@/types';

interface Props {
  step: number;
  total: number;
  value: number;
  setValue: (v: number) => void;
  currentWeight: number;
  phase: Phase;
  onNext: () => void;
  onBack: () => void;
}

type PhaseTargetMeta = { dir: -1 | 0 | 1; label: string; desc: string };

const PHASE_TARGETS: Record<Phase, PhaseTargetMeta> = {
  A: { dir: 0, label: 'Maintien', desc: 'On garde ton poids actuel' },
  B: { dir: -1, label: 'Déficit', desc: 'Perdre progressivement' },
  F: { dir: -1, label: 'Remontée', desc: 'Perdre tout en remontant kcal' },
  C: { dir: 0, label: 'Reverse', desc: 'Arrêter un déficit, stabiliser' },
  D: { dir: 1, label: 'Prise de masse', desc: 'Gagner de la masse' },
  E: { dir: -1, label: 'Reset', desc: 'Sèche courte et intense' },
};

export default function TargetScreen({
  step,
  total,
  value,
  setValue,
  currentWeight,
  phase,
  onNext,
  onBack,
}: Props) {
  const meta = PHASE_TARGETS[phase];
  const phaseColor = PHASE_CSS[phase];
  const diff = value - currentWeight;

  useEffect(() => {
    const sign = Math.sign(diff);
    if (meta.dir !== 0 && sign !== 0 && sign !== Math.sign(meta.dir)) {
      const suggestion = +(
        currentWeight +
        meta.dir * (meta.dir < 0 ? 5 : 3)
      ).toFixed(1);
      setValue(suggestion);
    } else if (meta.dir === 0 && Math.abs(diff) > 2) {
      setValue(+currentWeight.toFixed(1));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const sliderMin =
    meta.dir < 0
      ? Math.max(40, currentWeight - 25)
      : meta.dir > 0
        ? currentWeight - 1
        : currentWeight - 3;
  const sliderMax =
    meta.dir > 0
      ? Math.min(160, currentWeight + 25)
      : meta.dir < 0
        ? currentWeight + 1
        : currentWeight + 3;

  const inconsistent =
    meta.dir !== 0 &&
    Math.sign(diff) !== 0 &&
    Math.sign(diff) !== Math.sign(meta.dir);
  const kgLabel =
    meta.dir < 0 ? 'à perdre' : meta.dir > 0 ? 'à prendre' : "d'écart";

  const paceKgWeek =
    phase === 'E'
      ? 0.75
      : phase === 'D'
        ? 0.25
        : phase === 'A' || phase === 'C'
          ? 0
          : 0.45;
  const weeks =
    paceKgWeek > 0 ? Math.max(1, Math.round(Math.abs(diff) / paceKgWeek)) : 0;

  const presets =
    meta.dir < 0
      ? [-2, -3, -5, -8]
      : meta.dir > 0
        ? [+1, +2, +3, +5]
        : [-1, 0, +1];

  return (
    <OnbLayout
      header={
        <OnbHeader
          step={step}
          total={total}
          label={`TARGET · PHASE_${phase}`}
          onBack={onBack}
        />
      }
      footer={
        <OnbFooter
          primary="Continuer"
          onPrimary={onNext}
          disabled={inconsistent}
          hint={
            inconsistent
              ? `Phase ${phase} = ${meta.label.toLowerCase()}. Ajuste la cible.`
              : null
          }
        />
      }
    >
      <div style={onbFadeUp(0)}>
        <div style={{ ...monoMicro, color: phaseColor, marginBottom: 8 }}>
          ▸ 06 / POIDS CIBLE
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
          Tu vises quel
          <br />
          poids&nbsp;?
        </h1>
        <p
          style={{
            ...mono,
            fontSize: 11,
            color: T.t3,
            marginTop: 10,
            lineHeight: 1.5,
          }}
        >
          Ajusté à ta phase{' '}
          <span style={{ color: phaseColor, fontWeight: 700 }}>{phase}</span> —{' '}
          {meta.desc.toLowerCase()}.
        </p>
      </div>

      <div style={{ ...onbFadeUp(1), marginTop: 24 }}>
        <div
          style={{
            background: T.s1,
            border: `1px solid color-mix(in srgb, ${phaseColor} 20%, transparent)`,
            borderRadius: 16,
            padding: '16px 14px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -30,
              right: -30,
              width: 100,
              height: 100,
              borderRadius: 50,
              background: `radial-gradient(circle, color-mix(in srgb, ${phaseColor} 20%, transparent), transparent 70%)`,
            }}
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 12,
              position: 'relative',
            }}
          >
            <div style={{ textAlign: 'left' }}>
              <div style={{ ...monoMicro, color: T.t3, fontSize: 7 }}>
                ▸ ACTUEL
              </div>
              <div
                style={{
                  ...mono,
                  fontSize: 24,
                  fontWeight: 700,
                  color: T.t2,
                  lineHeight: 1,
                }}
              >
                {currentWeight.toFixed(1)}
                <span style={{ fontSize: 11, color: T.t3 }}>kg</span>
              </div>
            </div>
            <div
              style={{
                flex: 1,
                height: 4,
                background: T.s2,
                borderRadius: 2,
                margin: '0 4px 8px',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 2,
                  background: `linear-gradient(90deg, ${T.t3} 0%, ${phaseColor} 100%)`,
                  boxShadow: `0 0 8px ${phaseColor}`,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  right: -6,
                  top: -4,
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  background: phaseColor,
                  boxShadow: `0 0 12px ${phaseColor}`,
                  animation: 'onbPulse 1.8s infinite',
                }}
              />
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ ...monoMicro, color: phaseColor, fontSize: 7 }}>
                ▸ CIBLE
              </div>
              <div
                style={{
                  ...mono,
                  fontSize: 32,
                  fontWeight: 800,
                  color: T.t1,
                  lineHeight: 1,
                  textShadow: `0 0 24px color-mix(in srgb, ${phaseColor} 40%, transparent)`,
                }}
              >
                {value.toFixed(1)}
                <span style={{ fontSize: 12, color: T.t3 }}>kg</span>
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 14,
              position: 'relative',
            }}
          >
            <div
              style={{
                flex: 1,
                background: inconsistent
                  ? `color-mix(in srgb, ${T.red} 8%, transparent)`
                  : `color-mix(in srgb, ${phaseColor} 8%, transparent)`,
                border: `1px solid color-mix(in srgb, ${
                  inconsistent ? T.red : phaseColor
                } 27%, transparent)`,
                borderRadius: 10,
                padding: '8px 10px',
              }}
            >
              <div
                style={{
                  ...monoMicro,
                  fontSize: 7,
                  color: inconsistent ? T.red : phaseColor,
                }}
              >
                ▸ DELTA
              </div>
              <div
                style={{
                  ...mono,
                  fontSize: 14,
                  fontWeight: 800,
                  color: inconsistent ? T.red : T.t1,
                  marginTop: 2,
                }}
              >
                {diff > 0 ? '+' : ''}
                {diff.toFixed(1)}kg
              </div>
              <div
                style={{
                  ...mono,
                  fontSize: 9,
                  color: T.t3,
                  marginTop: 1,
                }}
              >
                {Math.abs(diff).toFixed(1)}kg {kgLabel}
              </div>
            </div>
            <div
              style={{
                flex: 1,
                background: T.s2,
                border: `1px solid ${T.outline}`,
                borderRadius: 10,
                padding: '8px 10px',
              }}
            >
              <div style={{ ...monoMicro, fontSize: 7, color: T.t3 }}>
                ▸ ETA
              </div>
              <div
                style={{
                  ...mono,
                  fontSize: 14,
                  fontWeight: 800,
                  color: T.t1,
                  marginTop: 2,
                }}
              >
                {weeks > 0 ? `~${weeks}sem` : '—'}
              </div>
              <div
                style={{
                  ...mono,
                  fontSize: 9,
                  color: T.t3,
                  marginTop: 1,
                }}
              >
                {paceKgWeek > 0 ? `${paceKgWeek}kg/sem` : 'stable'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ ...onbFadeUp(2), marginTop: 22 }}>
        <RulerSlider
          min={sliderMin}
          max={sliderMax}
          value={value}
          onChange={setValue}
          step={0.1}
          unit="kg"
          accent={phaseColor}
        />
      </div>

      <div
        style={{
          ...onbFadeUp(3),
          marginTop: 16,
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {presets.map((d) => {
          const tgt = +(currentWeight + d).toFixed(1);
          const on = Math.abs(value - tgt) < 0.05;
          return (
            <button
              type="button"
              key={d}
              onClick={() => setValue(tgt)}
              style={{
                padding: '8px 14px',
                background: on ? phaseColor : T.s1,
                border: `1px solid ${on ? phaseColor : T.outline}`,
                borderRadius: 10,
                color: on ? '#0a1410' : T.t2,
                cursor: 'pointer',
                ...mono,
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {d > 0 ? '+' : ''}
              {d}kg
            </button>
          );
        })}
      </div>

      {inconsistent && (
        <div
          style={{
            ...onbFadeUp(4),
            marginTop: 16,
            marginBottom: 16,
            background: `color-mix(in srgb, ${T.red} 8%, transparent)`,
            border: `1px solid color-mix(in srgb, ${T.red} 27%, transparent)`,
            borderRadius: 12,
            padding: 12,
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 20, color: T.red }}
          >
            warning
          </span>
          <div>
            <div
              style={{
                ...mono,
                fontSize: 11,
                fontWeight: 700,
                color: T.red,
              }}
            >
              Incohérence phase
            </div>
            <div
              style={{
                ...mono,
                fontSize: 10,
                color: T.t2,
                marginTop: 3,
                lineHeight: 1.4,
              }}
            >
              Phase <b>{phase}</b> ({meta.label}) implique de{' '}
              {meta.dir < 0 ? 'perdre' : 'prendre'} du poids — ta cible va dans
              l'autre sens.
            </div>
          </div>
        </div>
      )}
      <div style={{ height: 12 }} />
    </OnbLayout>
  );
}
