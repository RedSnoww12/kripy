import OnbHeader from '../OnbHeader';
import OnbFooter from '../OnbFooter';
import OnbLayout from '../OnbLayout';
import RulerSlider from '../RulerSlider';
import { T, mono, monoMicro, onbFadeUp } from '../tokens';

interface Props {
  step: number;
  total: number;
  value: number;
  setValue: (v: number) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function WeightScreen({
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
          label="CURRENT_MASS"
          onBack={onBack}
        />
      }
      footer={<OnbFooter primary="Continuer" onPrimary={onNext} />}
    >
      <div style={onbFadeUp(0)}>
        <div style={{ ...monoMicro, color: T.acc, marginBottom: 8 }}>
          ▸ 02 / POIDS ACTUEL
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
          Tu pèses
          <br />
          combien&nbsp;?
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
          Point de départ. Tu le rééntreras
          <br />
          chaque semaine pour suivre la pente.
        </p>
      </div>

      <div
        style={{
          ...onbFadeUp(1),
          textAlign: 'center',
          marginTop: 30,
        }}
      >
        <div style={{ ...monoMicro, color: T.t3, fontSize: 9 }}>▸ CURRENT</div>
        <div
          style={{
            ...mono,
            fontSize: 84,
            fontWeight: 800,
            color: T.t1,
            lineHeight: 1,
            letterSpacing: '-.04em',
            marginTop: 6,
            textShadow: `0 0 48px color-mix(in srgb, var(--acc) 27%, transparent)`,
          }}
        >
          {value.toFixed(1)}
          <span
            style={{
              fontSize: 22,
              color: T.t3,
              marginLeft: 6,
              fontWeight: 500,
            }}
          >
            kg
          </span>
        </div>
      </div>

      <div style={{ ...onbFadeUp(2), marginTop: 28 }}>
        <RulerSlider
          min={40}
          max={160}
          value={value}
          onChange={setValue}
          step={0.1}
          unit="kg"
        />
      </div>

      <div
        style={{
          ...onbFadeUp(3),
          marginTop: 16,
          display: 'flex',
          gap: 8,
          justifyContent: 'center',
        }}
      >
        {[-1, -0.1, +0.1, +1].map((d) => (
          <button
            type="button"
            key={d}
            onClick={() =>
              setValue(+Math.max(40, Math.min(160, value + d)).toFixed(1))
            }
            style={{
              flex: 1,
              padding: '10px 0',
              background: T.s1,
              border: `1px solid ${T.outline}`,
              borderRadius: 10,
              color: d < 0 ? T.pnk : T.grn,
              cursor: 'pointer',
              ...mono,
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {d > 0 ? '+' : ''}
            {d}
          </button>
        ))}
      </div>
      <div style={{ height: 20 }} />
    </OnbLayout>
  );
}
