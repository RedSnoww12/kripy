import OnbHeader from '../OnbHeader';
import OnbFooter from '../OnbFooter';
import OnbLayout from '../OnbLayout';
import RulerSlider from '../RulerSlider';
import { T, mono, monoMicro, onbFadeUp } from '../tokens';
import { deriveActivityDetailed } from '@/features/settings/activityFromInputs';

interface Props {
  step: number;
  total: number;
  steps: number;
  setSteps: (v: number) => void;
  sport: number;
  setSport: (v: number) => void;
  onNext: () => void;
  onBack: () => void;
}

const STEP_PRESETS: { l: string; v: number }[] = [
  { l: '🛋 Bureau', v: 4000 },
  { l: '🚶 Actif', v: 8000 },
  { l: '⚡ Sportif', v: 12000 },
  { l: '🏃 Athlète', v: 16000 },
];

const LEVEL_LABEL: Record<string, string> = {
  sedentary: 'Sédentaire',
  light: 'Actif léger',
  moderate: 'Actif',
  active: 'Très actif',
  very_active: 'Athlète',
};

export default function ActivityScreen({
  step,
  total,
  steps,
  setSteps,
  sport,
  setSport,
  onNext,
  onBack,
}: Props) {
  const { factor, level } = deriveActivityDetailed(steps, sport);
  const label = LEVEL_LABEL[level];

  return (
    <OnbLayout
      header={
        <OnbHeader
          step={step}
          total={total}
          label="ACTIVITY_PROFILE"
          onBack={onBack}
        />
      }
      footer={<OnbFooter primary="Continuer" onPrimary={onNext} />}
    >
      <div style={onbFadeUp(0)}>
        <div style={{ ...monoMicro, color: T.acc, marginBottom: 8 }}>
          ▸ 04 / ACTIVITÉ
        </div>
        <h1
          style={{
            fontFamily: "'Space Grotesk',sans-serif",
            fontSize: 28,
            fontWeight: 700,
            color: T.t1,
            margin: 0,
            lineHeight: 1.1,
            letterSpacing: '-.02em',
          }}
        >
          Ton niveau
          <br />
          d'activité&nbsp;?
        </h1>
        <p
          style={{
            ...mono,
            fontSize: 12,
            color: T.t3,
            marginTop: 10,
            lineHeight: 1.5,
          }}
        >
          Sert à estimer ta dépense calorique
          <br />
          journalière (TDEE).
        </p>
      </div>

      <div style={{ ...onbFadeUp(1), marginTop: 24 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <div style={{ ...monoMicro, fontSize: 8, color: T.t3 }}>
            ▸ PAS / JOUR (MOY.)
          </div>
          <div
            style={{
              ...mono,
              fontSize: 20,
              fontWeight: 800,
              color: T.acc,
              letterSpacing: '-.02em',
            }}
          >
            {steps.toLocaleString('fr-FR')}
          </div>
        </div>
        <RulerSlider
          min={2000}
          max={30000}
          value={steps}
          onChange={(v) => setSteps(Math.round(v / 500) * 500)}
          step={500}
        />
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          {STEP_PRESETS.map((p) => {
            const on = Math.abs(steps - p.v) < 500;
            return (
              <button
                type="button"
                key={p.v}
                onClick={() => setSteps(p.v)}
                style={{
                  flex: 1,
                  padding: '8px 2px',
                  borderRadius: 9,
                  background: on
                    ? 'color-mix(in srgb, var(--acc) 13%, transparent)'
                    : T.s1,
                  border: `1px solid ${on ? T.acc : T.outline}`,
                  color: on ? T.acc : T.t2,
                  cursor: 'pointer',
                  ...mono,
                  fontSize: 9,
                  fontWeight: 700,
                }}
              >
                {p.l}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ ...onbFadeUp(2), marginTop: 24 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <div style={{ ...monoMicro, fontSize: 8, color: T.t3 }}>
            ▸ SÉANCES SPORT / SEM.
          </div>
          <div
            style={{
              ...mono,
              fontSize: 20,
              fontWeight: 800,
              color: T.cyan,
              letterSpacing: '-.02em',
            }}
          >
            {sport}
            <span
              style={{
                fontSize: 11,
                color: T.t3,
                marginLeft: 4,
                fontWeight: 500,
              }}
            >
              × / sem
            </span>
          </div>
        </div>
        <div
          style={{
            background: T.s1,
            border: `1px solid ${T.outline}`,
            borderRadius: 12,
            padding: 10,
            display: 'flex',
            gap: 4,
          }}
        >
          {Array.from({ length: 8 }).map((_, i) => {
            const on = i <= sport;
            return (
              <button
                type="button"
                key={i}
                onClick={() => setSport(i)}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 8,
                  cursor: 'pointer',
                  background: on ? (i === 0 ? T.s3 : T.cyan) : T.s2,
                  border: `1px solid ${on && i > 0 ? T.cyan : T.outline}`,
                  color: on && i > 0 ? '#0a1410' : T.t2,
                  ...mono,
                  fontSize: 13,
                  fontWeight: 800,
                  transition: 'all .15s',
                }}
              >
                {i === 0 ? '0' : i}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ ...onbFadeUp(3), marginTop: 20, marginBottom: 12 }}>
        <div
          style={{
            background: T.s0,
            border: `1px solid color-mix(in srgb, var(--acc) 20%, transparent)`,
            borderRadius: 12,
            padding: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: 'color-mix(in srgb, var(--acc) 10%, transparent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 22, color: T.acc }}
            >
              bolt
            </span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ ...monoMicro, fontSize: 8, color: T.t3 }}>
              ▸ PROFIL ACTIVITÉ
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
              {label} · ×{factor}
            </div>
          </div>
        </div>
      </div>
    </OnbLayout>
  );
}
