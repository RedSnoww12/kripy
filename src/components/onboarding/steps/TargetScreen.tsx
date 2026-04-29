import { useEffect, type CSSProperties } from 'react';
import OnbHeader from '../OnbHeader';
import OnbFooter from '../OnbFooter';
import OnbLayout from '../OnbLayout';
import RulerSlider from '../RulerSlider';
import { PHASE_CSS } from '../tokens';
import type { Phase } from '@/types';
import styles from './TargetScreen.module.css';

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

const fadeDelay = (idx: number): CSSProperties =>
  ({ '--fade-delay': `${idx * 0.08}s` }) as CSSProperties;

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
      ? [-0.5, -2, -3, -5, -8]
      : meta.dir > 0
        ? [+0.5, +1, +2, +3, +5]
        : [-1, -0.5, 0, +0.5, +1];

  // Phase color exposed as CSS custom property; consumed by .module.css
  const rootStyle = { '--phase': phaseColor } as CSSProperties;
  const metricCls = `onb-mono ${styles.metric} ${inconsistent ? styles.inconsistent : ''}`;

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
      <div style={rootStyle}>
        <div className={styles.fadeUp} style={fadeDelay(0)}>
          <div className={`onb-mono-micro ${styles.eyebrow}`}>
            ▸ 07 / POIDS CIBLE
          </div>
          <h1 className={styles.title}>
            Tu vises quel
            <br />
            poids&nbsp;?
          </h1>
          <p className={`onb-mono ${styles.subtitle}`}>
            Ajusté à ta phase{' '}
            <span className={styles.subtitlePhase}>{phase}</span> —{' '}
            {meta.desc.toLowerCase()}.
          </p>
        </div>

        <div className={styles.fadeUp} style={fadeDelay(1)}>
          <div className={styles.card} style={{ marginTop: 24 }}>
            <div className={styles.cardGlow} />
            <div className={styles.cardRow}>
              <div className={styles.actual}>
                <div className={`onb-mono-micro ${styles.actualLabel}`}>
                  ▸ ACTUEL
                </div>
                <div className={`onb-mono ${styles.actualValue}`}>
                  {currentWeight.toFixed(1)}
                  <span className={styles.actualUnit}>kg</span>
                </div>
              </div>
              <div className={styles.bar}>
                <div className={styles.barFill} />
                <div className={styles.barDot} />
              </div>
              <div className={styles.target}>
                <div className={`onb-mono-micro ${styles.targetLabel}`}>
                  ▸ CIBLE
                </div>
                <div className={`onb-mono ${styles.targetValue}`}>
                  {value.toFixed(1)}
                  <span className={styles.targetUnit}>kg</span>
                </div>
              </div>
            </div>

            <div className={styles.metrics}>
              <div className={metricCls}>
                <div className={`onb-mono-micro ${styles.metricLabel}`}>
                  ▸ DELTA
                </div>
                <div className={styles.metricValue}>
                  {diff > 0 ? '+' : ''}
                  {diff.toFixed(1)}kg
                </div>
                <div className={styles.metricDesc}>
                  {Math.abs(diff).toFixed(1)}kg {kgLabel}
                </div>
              </div>
              <div className={`onb-mono ${styles.metricNeutral}`}>
                <div
                  className={`onb-mono-micro ${styles.metricLabelNeutral}`}
                >
                  ▸ ETA
                </div>
                <div className={styles.metricValue}>
                  {weeks > 0 ? `~${weeks}sem` : '—'}
                </div>
                <div className={styles.metricDesc}>
                  {paceKgWeek > 0 ? `${paceKgWeek}kg/sem` : 'stable'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`${styles.fadeUp} ${styles.slider}`} style={fadeDelay(2)}>
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

        <div className={`${styles.fadeUp} ${styles.presets}`} style={fadeDelay(3)}>
          {presets.map((d) => {
            const tgt = +(currentWeight + d).toFixed(1);
            const on = Math.abs(value - tgt) < 0.05;
            return (
              <button
                type="button"
                key={d}
                onClick={() => setValue(tgt)}
                className={`onb-mono ${styles.preset} ${on ? styles.active : ''}`}
              >
                {d > 0 ? '+' : ''}
                {d}kg
              </button>
            );
          })}
        </div>

        {inconsistent && (
          <div
            className={`${styles.fadeUp} ${styles.warning}`}
            style={fadeDelay(4)}
          >
            <span
              className={`material-symbols-outlined ${styles.warningIcon}`}
            >
              warning
            </span>
            <div>
              <div className={`onb-mono ${styles.warningTitle}`}>
                Incohérence phase
              </div>
              <div className={`onb-mono ${styles.warningDesc}`}>
                Phase <b>{phase}</b> ({meta.label}) implique de{' '}
                {meta.dir < 0 ? 'perdre' : 'prendre'} du poids — ta cible va
                dans l'autre sens.
              </div>
            </div>
          </div>
        )}
        <div className={styles.spacer} />
      </div>
    </OnbLayout>
  );
}
