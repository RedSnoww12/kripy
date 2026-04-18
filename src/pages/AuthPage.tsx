import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isFirebaseConfigured } from '@/lib/firebase';
import { signInWithGoogle } from '@/features/auth/useAuth';
import { useSessionStore } from '@/store/useSessionStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import CRTGrid from '@/components/onboarding/CRTGrid';
import { T, mono, monoMicro, PHASE_CSS } from '@/components/onboarding/tokens';

const BOOT_LINES = [
  'KRIPY//BOOT v1.0',
  'init calibration · phase engine · tdee solver',
  'awaiting operator ▸',
];

const LED_PHASES: readonly (keyof typeof PHASE_CSS)[] = [
  'B',
  'A',
  'D',
  'C',
  'F',
  'E',
];

export default function AuthPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pressing, setPressing] = useState<'google' | 'guest' | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const goNext = () => {
    const setup = useSettingsStore.getState().setup;
    navigate(setup ? '/' : '/onboarding', { replace: true });
  };

  const handleGoogle = async () => {
    if (busy) return;
    setPressing('google');
    if (!isFirebaseConfigured) {
      setError(
        'Firebase non configuré. Continue en invité ou renseigne .env.local.',
      );
      setPressing(null);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
      goNext();
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code !== 'auth/popup-closed-by-user') {
        setError((e as Error).message);
      }
    } finally {
      setBusy(false);
      setPressing(null);
    }
  };

  const handleGuest = () => {
    setPressing('guest');
    window.setTimeout(() => {
      useSessionStore.getState().skipAuth();
      goNext();
    }, 220);
  };

  return (
    <div
      className="welcome-root"
      style={{
        position: 'fixed',
        inset: 0,
        background: T.bg,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
        zIndex: 100,
      }}
    >
      <CRTGrid />

      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `radial-gradient(circle at 50% 18%, color-mix(in srgb, var(--acc) 13%, transparent) 0%, transparent 48%), radial-gradient(circle at 50% 95%, color-mix(in srgb, var(--acc) 7%, transparent) 0%, transparent 45%)`,
        }}
      />

      <svg
        aria-hidden
        width="100%"
        height="100%"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0.6,
        }}
        viewBox="0 0 400 820"
        preserveAspectRatio="none"
      >
        <Crosshair x={20} y={20} />
        <Crosshair x={380} y={20} />
        <Crosshair x={20} y={800} />
        <Crosshair x={380} y={800} />
      </svg>

      <div
        style={{
          padding: '24px 24px 0',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {BOOT_LINES.map((l, i) => (
          <div
            key={i}
            style={{
              ...monoMicro,
              fontSize: 9,
              color: i === BOOT_LINES.length - 1 ? T.acc : T.t3,
              marginBottom: 3,
              letterSpacing: '.18em',
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateX(0)' : 'translateX(-8px)',
              transition: `opacity .4s ${i * 0.12}s, transform .4s ${i * 0.12}s cubic-bezier(.2,.9,.3,1)`,
            }}
          >
            {l}
          </div>
        ))}
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '0 32px',
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            marginBottom: 18,
            opacity: mounted ? 1 : 0,
            transform: mounted
              ? 'translateY(0) scale(1)'
              : 'translateY(8px) scale(.94)',
            transition:
              'opacity .6s .45s, transform .6s .45s cubic-bezier(.2,1.2,.3,1)',
          }}
        >
          <KripyMark />
        </div>

        <h1
          style={{
            fontFamily: "'Space Grotesk',sans-serif",
            fontSize: 34,
            fontWeight: 700,
            color: T.t1,
            margin: 0,
            lineHeight: 1.02,
            letterSpacing: '-.03em',
            opacity: mounted ? 1 : 0,
            transition: 'opacity .5s .6s',
          }}
        >
          Calibre ton
          <br />
          corps.
        </h1>
        <p
          style={{
            ...mono,
            fontSize: 12,
            color: T.t2,
            marginTop: 12,
            lineHeight: 1.5,
            maxWidth: 260,
            opacity: mounted ? 1 : 0,
            transition: 'opacity .5s .75s',
          }}
        >
          Phase par phase. Log par log.
          <br />
          Sans bullshit.
        </p>

        <div
          style={{
            display: 'flex',
            gap: 6,
            marginTop: 22,
            opacity: mounted ? 1 : 0,
            transition: 'opacity .5s .9s',
          }}
        >
          {LED_PHASES.map((ph, i) => (
            <div
              key={ph}
              style={{
                width: 26,
                height: 4,
                borderRadius: 2,
                background: PHASE_CSS[ph],
                boxShadow: `0 0 6px color-mix(in srgb, ${PHASE_CSS[ph]} 40%, transparent)`,
                animation: `welcomeLed 2.4s ${i * 0.15}s ease-in-out infinite`,
              }}
            />
          ))}
        </div>
      </div>

      <div
        style={{
          padding: '0 24px max(28px, env(safe-area-inset-bottom))',
          position: 'relative',
          zIndex: 2,
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(14px)',
          transition:
            'opacity .5s 1s, transform .5s 1s cubic-bezier(.2,.9,.3,1)',
        }}
      >
        <button
          type="button"
          onClick={handleGoogle}
          disabled={busy}
          style={{
            width: '100%',
            height: 52,
            border: 'none',
            borderRadius: 14,
            cursor: busy ? 'default' : 'pointer',
            background: pressing === 'google' ? T.acc : '#FFFFFF',
            color: '#1a1d2e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            fontFamily: "'Space Grotesk',sans-serif",
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: '-.01em',
            boxShadow: `0 0 0 1px ${T.outline}, 0 10px 24px rgba(0,0,0,.25), 0 0 24px color-mix(in srgb, var(--acc) 13%, transparent)`,
            transition: 'background .2s, transform .15s',
            transform: pressing === 'google' ? 'scale(.98)' : 'scale(1)',
            opacity: busy ? 0.7 : 1,
          }}
        >
          <GoogleG />
          <span>{busy ? 'Connexion…' : 'Continuer avec Google'}</span>
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            margin: '14px 0',
          }}
        >
          <div style={{ flex: 1, height: 1, background: T.outline }} />
          <span
            style={{
              ...monoMicro,
              fontSize: 8,
              color: T.t3,
              letterSpacing: '.28em',
            }}
          >
            OU
          </span>
          <div style={{ flex: 1, height: 1, background: T.outline }} />
        </div>

        <button
          type="button"
          onClick={handleGuest}
          disabled={busy}
          style={{
            width: '100%',
            height: 48,
            borderRadius: 14,
            cursor: busy ? 'default' : 'pointer',
            background: 'transparent',
            color: T.t1,
            border: `1px solid ${pressing === 'guest' ? T.acc : T.outline}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            ...mono,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '.1em',
            textTransform: 'uppercase',
            transition: 'border .2s, transform .15s',
            transform: pressing === 'guest' ? 'scale(.98)' : 'scale(1)',
          }}
        >
          <span style={{ color: T.acc }}>▸</span>
          <span>Continuer en invité</span>
        </button>

        {error && (
          <div
            role="alert"
            style={{
              marginTop: 14,
              ...mono,
              fontSize: 11,
              color: T.red,
              textAlign: 'center',
              lineHeight: 1.4,
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            marginTop: 18,
            textAlign: 'center',
            ...mono,
            fontSize: 10,
            color: T.t3,
            lineHeight: 1.55,
          }}
        >
          En continuant, tu acceptes les{' '}
          <Link
            to="/terms"
            style={{
              color: T.t2,
              textDecoration: 'underline',
              textDecorationColor: T.outline,
              textUnderlineOffset: 3,
            }}
          >
            CGU
          </Link>{' '}
          et la{' '}
          <Link
            to="/privacy"
            style={{
              color: T.t2,
              textDecoration: 'underline',
              textDecorationColor: T.outline,
              textUnderlineOffset: 3,
            }}
          >
            Politique de confidentialité
          </Link>
          .
        </div>
      </div>
    </div>
  );
}

function Crosshair({ x, y }: { x: number; y: number }) {
  return (
    <g style={{ color: T.acc }}>
      <line
        x1={x - 10}
        y1={y}
        x2={x + 10}
        y2={y}
        stroke={T.acc}
        strokeWidth=".8"
      />
      <line
        x1={x}
        y1={y - 10}
        x2={x}
        y2={y + 10}
        stroke={T.acc}
        strokeWidth=".8"
      />
      <circle cx={x} cy={y} r="1.5" fill={T.acc} />
    </g>
  );
}

function KripyMark() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width="44" height="44" viewBox="0 0 44 44" aria-hidden>
        <defs>
          <linearGradient id="kripyG" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={T.acc} />
            <stop offset="100%" stopColor={T.cyan} />
          </linearGradient>
        </defs>
        <rect
          x="1"
          y="1"
          width="42"
          height="42"
          rx="11"
          fill="none"
          stroke={T.acc}
          strokeWidth="1.2"
          opacity=".4"
        />
        <rect
          x="5"
          y="5"
          width="34"
          height="34"
          rx="8"
          fill={T.s1}
          stroke="url(#kripyG)"
          strokeWidth="1"
        />
        <path
          d="M14 15 L14 29 L18 29"
          fill="none"
          stroke={T.acc}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="28" cy="22" r="2.5" fill={T.acc}>
          <animate
            attributeName="opacity"
            values="1;.35;1"
            dur="1.6s"
            repeatCount="indefinite"
          />
        </circle>
        <path
          d="M30 22 L36 22"
          stroke={T.acc}
          strokeWidth="2"
          strokeLinecap="round"
          opacity=".5"
        />
      </svg>
      <div
        style={{
          fontFamily: "'Space Grotesk',sans-serif",
          fontSize: 30,
          fontWeight: 700,
          letterSpacing: '-.04em',
        }}
      >
        <span style={{ color: T.t1 }}>kripy</span>
        <span style={{ color: T.acc }}>.</span>
      </div>
    </div>
  );
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.3 0 10.2-2 13.9-5.3l-6.4-5.4c-2.1 1.5-4.8 2.4-7.5 2.4-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.4 5.4C41.9 34.8 44 29.8 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}
