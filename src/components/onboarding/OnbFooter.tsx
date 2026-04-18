import { T, mono } from './tokens';

interface Props {
  primary: string;
  onPrimary: () => void;
  disabled?: boolean;
  secondary?: string;
  onSecondary?: () => void;
  hint?: string | null;
}

export default function OnbFooter({
  primary,
  onPrimary,
  disabled,
  secondary,
  onSecondary,
  hint,
}: Props) {
  return (
    <div
      style={{
        padding: '12px 20px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        background: `linear-gradient(180deg, transparent, ${T.bg} 35%)`,
        position: 'relative',
        zIndex: 20,
      }}
    >
      {hint && (
        <div
          style={{
            ...mono,
            fontSize: 10,
            color: T.t3,
            textAlign: 'center',
            marginBottom: 4,
          }}
        >
          {hint}
        </div>
      )}
      <button
        type="button"
        onClick={onPrimary}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: 16,
          border: 'none',
          background: disabled ? T.s3 : T.grad,
          color: disabled ? T.t3 : '#0a1410',
          ...mono,
          fontSize: 13,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '.14em',
          cursor: disabled ? 'default' : 'pointer',
          boxShadow: disabled
            ? 'none'
            : `0 8px 24px rgba(106,239,175,.25), 0 0 0 1px rgba(106,239,175,.2)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        {primary}
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
          arrow_forward
        </span>
      </button>
      {secondary && (
        <button
          type="button"
          onClick={onSecondary}
          style={{
            background: 'none',
            border: 'none',
            color: T.t3,
            cursor: 'pointer',
            ...mono,
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '.08em',
            padding: 8,
          }}
        >
          {secondary}
        </button>
      )}
    </div>
  );
}
