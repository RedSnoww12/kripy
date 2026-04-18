import { T, monoMicro } from './tokens';
import StepDots from './StepDots';

interface Props {
  step: number;
  total: number;
  label: string;
  onBack?: () => void;
}

export default function OnbHeader({ step, total, label, onBack }: Props) {
  const disabled = step === 0 || !onBack;
  return (
    <div
      style={{
        padding: '8px 20px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <button
          type="button"
          onClick={onBack}
          disabled={disabled}
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: T.s1,
            border: `1px solid ${T.outline}`,
            color: disabled ? T.t3 : T.t1,
            cursor: disabled ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: disabled ? 0.3 : 1,
            flexShrink: 0,
          }}
          aria-label="Retour"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            arrow_back
          </span>
        </button>
        <div
          style={{
            ...monoMicro,
            color: T.t3,
            fontSize: 8,
            letterSpacing: '.15em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: 220,
            textAlign: 'center',
          }}
        >
          ▸ {String(step + 1).padStart(2, '0')}/{String(total).padStart(2, '0')}{' '}
          · {label}
        </div>
        <div style={{ width: 34, flexShrink: 0 }} />
      </div>
      <StepDots n={total} current={step} />
    </div>
  );
}
