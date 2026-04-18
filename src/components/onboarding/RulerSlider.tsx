import { useRef, useState } from 'react';
import { T, monoMicro } from './tokens';

interface Props {
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  unit?: string;
  accent?: string;
}

export default function RulerSlider({
  min,
  max,
  value,
  onChange,
  step = 1,
  unit = '',
  accent,
}: Props) {
  const c = accent || T.acc;
  const ref = useRef<HTMLDivElement | null>(null);
  const [drag, setDrag] = useState(false);

  const range = max - min;
  const tickCount = Math.min(140, Math.floor(range / step) + 1);
  const pct = Math.max(0, Math.min(1, (value - min) / range));

  const handle = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let p = (clientX - r.left) / r.width;
    p = Math.max(0, Math.min(1, p));
    const raw = min + p * range;
    const snapped = Math.round(raw / step) * step;
    onChange(+snapped.toFixed(2));
  };

  const fractionDigits = step < 1 ? 1 : 0;

  return (
    <div style={{ position: 'relative', userSelect: 'none' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          ...monoMicro,
          color: T.t3,
          fontSize: 8,
          marginBottom: 6,
        }}
      >
        <span>
          {(+min).toFixed(fractionDigits)}
          {unit}
        </span>
        <span>
          {((+min + +max) / 2).toFixed(fractionDigits)}
          {unit}
        </span>
        <span>
          {(+max).toFixed(fractionDigits)}
          {unit}
        </span>
      </div>

      <div
        ref={ref}
        onMouseDown={(e) => {
          setDrag(true);
          handle(e.clientX);
        }}
        onMouseMove={(e) => drag && handle(e.clientX)}
        onMouseUp={() => setDrag(false)}
        onMouseLeave={() => setDrag(false)}
        onTouchStart={(e) => {
          setDrag(true);
          handle(e.touches[0].clientX);
        }}
        onTouchMove={(e) => drag && handle(e.touches[0].clientX)}
        onTouchEnd={() => setDrag(false)}
        style={{
          position: 'relative',
          height: 52,
          background: T.s1,
          borderRadius: 12,
          border: `1px solid ${T.outline}`,
          overflow: 'hidden',
          cursor: 'ew-resize',
          touchAction: 'none',
        }}
      >
        <svg
          width="100%"
          height="100%"
          style={{ position: 'absolute', inset: 0 }}
        >
          {Array.from({ length: tickCount }).map((_, i) => {
            const x = (i / (tickCount - 1)) * 100;
            const major = i % 10 === 0;
            return (
              <line
                key={i}
                x1={`${x}%`}
                y1={major ? 8 : 18}
                x2={`${x}%`}
                y2="44"
                stroke={major ? T.t2 : T.t3}
                strokeWidth={major ? 1 : 0.5}
                opacity={major ? 0.6 : 0.3}
              />
            );
          })}
        </svg>

        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${pct * 100}%`,
            background: `linear-gradient(90deg, transparent, ${c}22)`,
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            position: 'absolute',
            left: `${pct * 100}%`,
            top: 0,
            bottom: 0,
            width: 2,
            background: c,
            transform: 'translateX(-50%)',
            boxShadow: `0 0 12px ${c}`,
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: `${pct * 100}%`,
            top: -3,
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: `6px solid ${c}`,
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
}
