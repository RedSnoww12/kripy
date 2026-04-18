import { useEffect, useRef } from 'react';
import OnbHeader from '../OnbHeader';
import OnbFooter from '../OnbFooter';
import OnbLayout from '../OnbLayout';
import { T, mono, monoMicro, onbFadeUp } from '../tokens';

interface Props {
  step: number;
  total: number;
  name: string;
  setName: (v: string) => void;
  age: number;
  setAge: (v: number) => void;
  onNext: () => void;
  onBack: () => void;
}

const MIN_AGE = 12;
const MAX_AGE = 99;

export default function NameAgeScreen({
  step,
  total,
  name,
  setName,
  age,
  setAge,
  onNext,
  onBack,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    const id = window.setTimeout(() => inputRef.current?.focus(), 400);
    return () => window.clearTimeout(id);
  }, []);

  const valid = name.trim().length > 0 && age >= MIN_AGE && age <= MAX_AGE;

  return (
    <OnbLayout
      header={
        <OnbHeader
          step={step}
          total={total}
          label="OPERATOR_ID"
          onBack={onBack}
        />
      }
      footer={
        <OnbFooter primary="Continuer" onPrimary={onNext} disabled={!valid} />
      }
    >
      <div style={onbFadeUp(0)}>
        <div style={{ ...monoMicro, color: T.acc, marginBottom: 8 }}>
          ▸ 01 / IDENTITÉ
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
          Qui es-tu&nbsp;?
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
          Prénom + âge. Pas de compte,
          <br />
          tout reste local sur ton tel.
        </p>
      </div>

      <div style={{ ...onbFadeUp(1), marginTop: 24 }}>
        <div
          style={{
            ...monoMicro,
            fontSize: 8,
            color: T.t3,
            marginBottom: 8,
          }}
        >
          ▸ PRÉNOM
        </div>
        <div
          style={{
            background: T.s1,
            border: `1px solid ${T.outline}`,
            borderRadius: 14,
            padding: '4px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: `0 0 0 1px color-mix(in srgb, var(--acc) 20%, transparent), 0 0 24px color-mix(in srgb, var(--acc) 13%, transparent)`,
          }}
        >
          <span
            style={{
              ...mono,
              color: T.acc,
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            &gt;
          </span>
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex"
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              outline: 'none',
              color: T.t1,
              ...mono,
              fontSize: 20,
              fontWeight: 600,
              padding: '12px 0',
              caretColor: 'var(--acc)',
              width: '100%',
            }}
          />
        </div>
      </div>

      <div style={{ ...onbFadeUp(2), marginTop: 22 }}>
        <div
          style={{
            ...monoMicro,
            fontSize: 8,
            color: T.t3,
            marginBottom: 8,
          }}
        >
          ▸ ÂGE · {age} ANS
        </div>
        <AgeStepper value={age} setValue={setAge} />
      </div>

      <div style={{ ...onbFadeUp(3), marginTop: 24, paddingBottom: 8 }}>
        <div
          style={{
            background: T.s0,
            border: `1px solid ${T.outline}`,
            borderRadius: 12,
            padding: 14,
          }}
        >
          <div
            style={{
              ...monoMicro,
              color: T.t3,
              fontSize: 8,
              marginBottom: 8,
            }}
          >
            ▸ PREVIEW
          </div>
          <div style={{ ...mono, fontSize: 12, lineHeight: 1.7 }}>
            <div style={{ color: T.t2 }}>&gt; welcome back,</div>
            <div style={{ color: T.acc, fontWeight: 700 }}>
              &nbsp;&nbsp;{name || '______'}
            </div>
            <div style={{ color: T.t3, fontSize: 10, marginTop: 4 }}>
              &nbsp;&nbsp;{age}y · local profile
            </div>
          </div>
        </div>
      </div>
    </OnbLayout>
  );
}

function AgeStepper({
  value,
  setValue,
}: {
  value: number;
  setValue: (v: number) => void;
}) {
  return (
    <div
      style={{
        background: T.s1,
        border: `1px solid ${T.outline}`,
        borderRadius: 14,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <button
        type="button"
        onClick={() => setValue(Math.max(MIN_AGE, value - 1))}
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: T.s2,
          border: `1px solid ${T.outline}`,
          color: T.t1,
          cursor: 'pointer',
          ...mono,
          fontSize: 18,
          fontWeight: 800,
        }}
        aria-label="Diminuer l'âge"
      >
        −
      </button>
      <div style={{ flex: 1, textAlign: 'center' }}>
        <div
          style={{
            ...mono,
            fontSize: 44,
            fontWeight: 800,
            color: T.t1,
            lineHeight: 1,
            letterSpacing: '-.04em',
            textShadow: `0 0 24px color-mix(in srgb, var(--acc) 13%, transparent)`,
          }}
        >
          {value}
        </div>
        <div
          style={{
            ...monoMicro,
            color: T.t3,
            fontSize: 7,
            marginTop: 4,
          }}
        >
          ANNÉES
        </div>
      </div>
      <button
        type="button"
        onClick={() => setValue(Math.min(MAX_AGE, value + 1))}
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: T.s2,
          border: `1px solid ${T.outline}`,
          color: T.t1,
          cursor: 'pointer',
          ...mono,
          fontSize: 18,
          fontWeight: 800,
        }}
        aria-label="Augmenter l'âge"
      >
        +
      </button>
    </div>
  );
}
