import { useEffect, useMemo, useState } from 'react';
import OnbHeader from '../OnbHeader';
import OnbFooter from '../OnbFooter';
import OnbLayout from '../OnbLayout';
import { T, mono, monoMicro } from '../tokens';
import { PHASE_MULTIPLIERS } from '@/data/constants';
import {
  computeCalibration,
  type CalibrationData,
  type CalibrationResult,
} from '@/features/settings/calibration';

interface Props {
  step: number;
  total: number;
  data: CalibrationData;
  onNext: (result: CalibrationResult) => void;
  onBack: () => void;
}

interface LogLine {
  t: string;
  v?: string;
  b?: boolean;
}

export default function CalibrateScreen({
  step,
  total,
  data,
  onNext,
  onBack,
}: Props) {
  const result = useMemo(() => computeCalibration(data), [data]);
  const { bmr, actFactor, tdee, kcal, prot, gluc, lip, imc } = result;

  const steps = useMemo<(LogLine & { d: number })[]>(
    () => [
      { t: 'hash operator...', d: 300 },
      {
        t: `profile: ${data.name.toLowerCase() || 'anon'} · ${data.age}y · ${data.height}cm · ${data.weight}kg`,
        d: 420,
        v: T.acc,
      },
      { t: 'compute BMR (Mifflin)...', d: 380 },
      { t: `→ BMR ≈ ${bmr} kcal/j`, d: 300, v: T.cyan },
      {
        t: `activity: ${data.steps}pas · ${data.sport}×/sem`,
        d: 340,
      },
      { t: `→ facteur ×${actFactor}`, d: 280, v: T.cyan },
      { t: 'estimate TDEE...', d: 320 },
      { t: `→ TDEE ≈ ${tdee} kcal/j`, d: 300, v: T.cyan },
      { t: `→ BMI = ${imc}`, d: 280, v: T.cyan },
      {
        t: `apply phase ${data.phase} (×${PHASE_MULTIPLIERS[data.phase].toFixed(3)})`,
        d: 400,
      },
      { t: `→ kcal cible: ${kcal}`, d: 340, v: T.acc },
      { t: 'split macros (2.0/1.0 g/kg)...', d: 340 },
      {
        t: `→ P: ${prot}g · G: ${gluc}g · L: ${lip}g`,
        d: 340,
        v: T.acc,
      },
      { t: `target: ${data.targetWeight.toFixed(1)}kg`, d: 280 },
      { t: 'profile sealed. ready.', d: 400, v: T.acc, b: true },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, result],
  );

  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let canceled = false;
    (async () => {
      for (let i = 0; i < steps.length; i++) {
        await new Promise((r) => setTimeout(r, steps[i].d));
        if (canceled) return;
        setLogs((prev) => [...prev, steps[i]]);
        setProgress((i + 1) / steps.length);
      }
      await new Promise((r) => setTimeout(r, 400));
      if (!canceled) setDone(true);
    })();
    return () => {
      canceled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <OnbLayout
      header={
        <OnbHeader
          step={step}
          total={total}
          label="CALIBRATING"
          onBack={onBack}
        />
      }
      footer={
        <OnbFooter
          primary={done ? 'Valider' : 'Calcul...'}
          disabled={!done}
          onPrimary={() => onNext(result)}
        />
      }
    >
      <div style={{ marginBottom: 12, marginTop: 4 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 4,
          }}
        >
          <div style={{ ...monoMicro, color: T.t3, fontSize: 8 }}>
            ▸ CALIBRATION
          </div>
          <div
            style={{
              ...mono,
              fontSize: 10,
              color: T.acc,
              fontWeight: 700,
            }}
          >
            {Math.round(progress * 100)}%
          </div>
        </div>
        <div
          style={{
            height: 3,
            background: T.s2,
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress * 100}%`,
              background: T.grad,
              boxShadow: `0 0 8px ${T.acc}`,
              transition: 'width .3s',
            }}
          />
        </div>
      </div>

      <div
        style={{
          background: T.s0,
          border: `1px solid ${T.outline}`,
          borderRadius: 12,
          padding: 14,
          ...mono,
          fontSize: 11,
          lineHeight: 1.7,
          minHeight: 280,
        }}
      >
        {logs.map((l, idx) => (
          <div
            key={idx}
            style={{
              color: l.v || T.t2,
              fontWeight: l.b ? 800 : 500,
              animation: 'onbFadeIn .25s backwards',
            }}
          >
            <span style={{ color: T.t3 }}>
              [{String(idx).padStart(2, '0')}]
            </span>{' '}
            {l.t}
          </div>
        ))}
      </div>

      {done && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4,1fr)',
            gap: 6,
            marginTop: 14,
            marginBottom: 12,
            animation: 'onbFadeIn .4s',
          }}
        >
          {[
            { l: 'KCAL', v: kcal, c: T.acc },
            { l: 'PROT', v: `${prot}g`, c: T.cyan },
            { l: 'GLUC', v: `${gluc}g`, c: T.pur },
            { l: 'LIP', v: `${lip}g`, c: T.yel },
          ].map((x) => (
            <div
              key={x.l}
              style={{
                background: T.s1,
                border: `1px solid color-mix(in srgb, ${x.c} 27%, transparent)`,
                borderRadius: 10,
                padding: '8px 4px',
                textAlign: 'center',
              }}
            >
              <div style={{ ...monoMicro, fontSize: 7, color: x.c }}>{x.l}</div>
              <div
                style={{
                  ...mono,
                  fontSize: 14,
                  fontWeight: 800,
                  color: T.t1,
                  marginTop: 2,
                }}
              >
                {x.v}
              </div>
            </div>
          ))}
        </div>
      )}
    </OnbLayout>
  );
}
