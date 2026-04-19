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

export default function HeightScreen({
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
          label="HEIGHT_CM"
          onBack={onBack}
        />
      }
      footer={<OnbFooter primary="Continuer" onPrimary={onNext} />}
    >
      <div style={onbFadeUp(0)}>
        <div style={{ ...monoMicro, color: T.acc, marginBottom: 8 }}>
          ▸ 04 / GABARIT
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
          Et tu
          <br />
          mesures&nbsp;?
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
          Sert à calibrer l'IMC et le BMR.
        </p>
      </div>

      <div
        style={{
          ...onbFadeUp(1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 18,
          minHeight: 280,
        }}
      >
        <svg
          viewBox="0 0 140 260"
          width="140"
          height="260"
          style={{ overflow: 'visible', flexShrink: 0 }}
        >
          <defs>
            <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={T.acc} stopOpacity=".4" />
              <stop offset="100%" stopColor={T.acc} stopOpacity=".05" />
            </linearGradient>
          </defs>
          <g
            transform={`translate(70 ${130 - (value - 170) * 0.6}) scale(${
              0.85 + (value - 170) * 0.004
            })`}
          >
            <g transform="translate(-70 -130)">
              <circle
                cx="70"
                cy="30"
                r="18"
                fill="none"
                stroke={T.acc}
                strokeWidth="1.5"
              />
              <path
                d="M 52 52 L 88 52 L 94 80 L 100 130 L 88 210 L 78 250 L 62 250 L 52 210 L 40 130 L 46 80 Z"
                fill="url(#bodyGrad)"
                stroke={T.acc}
                strokeWidth="1.2"
              />
              <path
                d="M 48 58 L 30 120 L 24 170"
                fill="none"
                stroke={T.acc}
                strokeWidth="1.2"
              />
              <path
                d="M 92 58 L 110 120 L 116 170"
                fill="none"
                stroke={T.acc}
                strokeWidth="1.2"
              />
            </g>
          </g>
          <g>
            <line x1="126" y1="20" x2="126" y2="240" stroke={T.outline} />
            {[140, 160, 180, 200].map((h) => {
              const y = 240 - ((h - 140) / 60) * 220;
              return (
                <g key={h}>
                  <line x1="122" y1={y} x2="130" y2={y} stroke={T.t3} />
                  <text
                    x="136"
                    y={y + 3}
                    fill={T.t3}
                    style={{ ...monoMicro, fontSize: 7 }}
                  >
                    {h}
                  </text>
                </g>
              );
            })}
            {(() => {
              const y = 240 - ((value - 140) / 60) * 220;
              return (
                <line
                  x1="118"
                  y1={y}
                  x2="134"
                  y2={y}
                  stroke={T.acc}
                  strokeWidth="2"
                />
              );
            })()}
          </g>
        </svg>

        <div style={{ textAlign: 'right' }}>
          <div style={{ ...monoMicro, color: T.t3, fontSize: 8 }}>▸ HEIGHT</div>
          <div
            style={{
              ...mono,
              fontSize: 58,
              fontWeight: 800,
              color: T.t1,
              lineHeight: 1,
              letterSpacing: '-.04em',
              textShadow: `0 0 24px color-mix(in srgb, var(--acc) 20%, transparent)`,
            }}
          >
            {value.toFixed(1)}
            <span
              style={{
                fontSize: 18,
                color: T.t3,
                marginLeft: 4,
                fontWeight: 500,
              }}
            >
              cm
            </span>
          </div>
        </div>
      </div>

      <div style={{ ...onbFadeUp(2), marginTop: 24 }}>
        <RulerSlider
          min={140}
          max={210}
          value={value}
          onChange={(v) => setValue(+(Math.round(v * 2) / 2).toFixed(1))}
          step={0.5}
          unit="cm"
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
        {[-1, -0.5, +0.5, +1].map((d) => (
          <button
            type="button"
            key={d}
            onClick={() =>
              setValue(+Math.max(140, Math.min(210, value + d)).toFixed(1))
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
