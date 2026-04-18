import { useEffect, useState } from 'react';
import CRTGrid from '../CRTGrid';
import OnbFooter from '../OnbFooter';
import { T, mono, monoMicro } from '../tokens';

interface Line {
  t: string;
  hl?: boolean;
  warn?: boolean;
  prompt?: boolean;
}

const SCRIPT: (Line & { d: number })[] = [
  { t: '  KRIPY / KINETIC LAB', d: 200, hl: true },
  { t: '  v3.0.1 — terminal push', d: 350 },
  { t: '', d: 120 },
  { t: '▸ booting metabolic kernel...', d: 400 },
  { t: '  [ ok ] phase engine', d: 220 },
  { t: '  [ ok ] macro solver', d: 220 },
  { t: '  [ ok ] trend analyzer', d: 220 },
  { t: '  [ ok ] adherence scorer', d: 220 },
  { t: '', d: 100 },
  { t: '▸ handshake required', d: 400, warn: true },
  { t: '  no operator detected', d: 300 },
  { t: '  calibration = 6 inputs', d: 300 },
  { t: '', d: 120 },
  { t: '> awaiting operator...', d: 400, prompt: true },
];

interface Props {
  onDone: () => void;
}

export default function BootScreen({ onDone }: Props) {
  const [lines, setLines] = useState<Line[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let canceled = false;
    (async () => {
      for (let i = 0; i < SCRIPT.length; i++) {
        await new Promise((r) => setTimeout(r, SCRIPT[i].d));
        if (canceled) return;
        setLines((prev) => [...prev, SCRIPT[i]]);
      }
      await new Promise((r) => setTimeout(r, 500));
      if (!canceled) setDone(true);
    })();
    return () => {
      canceled = true;
    };
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <CRTGrid />
      <div
        className="kripy-scroll"
        style={{
          flex: 1,
          padding: '40px 24px 16px',
          position: 'relative',
          zIndex: 2,
          overflowY: 'auto',
        }}
      >
        <div style={{ ...monoMicro, color: T.t3, marginBottom: 24 }}>
          ▸ BOOT.LOG
        </div>
        <div style={{ ...mono, fontSize: 12, lineHeight: 1.7 }}>
          {lines.map((l, idx) => (
            <div
              key={idx}
              style={{
                color: l.hl ? T.acc : l.warn ? T.org : l.prompt ? T.t1 : T.t2,
                fontWeight: l.hl ? 800 : l.prompt ? 700 : 500,
                opacity: 0,
                animation: 'onbFadeIn .2s forwards',
                textShadow: l.hl ? `0 0 12px ${T.acc}` : 'none',
                letterSpacing: l.hl ? '.1em' : 'normal',
                fontSize: l.hl ? 14 : 12,
              }}
            >
              {l.t || '\u00A0'}
              {l.prompt && (
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 14,
                    background: T.acc,
                    marginLeft: 6,
                    verticalAlign: '-2px',
                    animation: 'onbBlink 1s infinite',
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
      <OnbFooter
        primary={done ? 'Engager' : 'Booting...'}
        disabled={!done}
        onPrimary={onDone}
        hint={done ? 'Appuie pour commencer la calibration' : null}
      />
    </div>
  );
}
