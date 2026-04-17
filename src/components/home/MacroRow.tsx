import { useTweenInt } from '@/hooks/useTween';
import type { Macros, Targets } from '@/types';

interface MacroBarProps {
  label: string;
  current: number;
  target: number;
  unit: string;
  color: string;
}

function MacroBar({ label, current, target, unit, color }: MacroBarProps) {
  const value = Math.round(current);
  const valueRef = useTweenInt<HTMLSpanElement>(value, 450);
  const pct = target ? Math.min(100, Math.round((current / target) * 100)) : 0;
  return (
    <div className="mc">
      <div className="mc-h">
        <span className="mc-l">{label}</span>
        <span className="mc-v">
          <span ref={valueRef} className="mc-cur" style={{ color }}>
            {value}
          </span>
          <span className="mc-tgt">
            {' / '}
            {target} {unit}
          </span>
        </span>
      </div>
      <div className="mc-bw">
        <div className="mc-b" style={{ background: color, width: `${pct}%` }} />
      </div>
    </div>
  );
}

interface Props {
  totals: Macros;
  targets: Targets;
}

export default function MacroRow({ totals, targets }: Props) {
  return (
    <section className="macro-row">
      <MacroBar
        label="Protéines"
        current={totals.p}
        target={targets.prot}
        unit="g"
        color="#4AD295"
      />
      <MacroBar
        label="Glucides"
        current={totals.g}
        target={targets.gluc}
        unit="g"
        color="#28EFEA"
      />
      <MacroBar
        label="Lipides"
        current={totals.l}
        target={targets.lip}
        unit="g"
        color="#FF64B0"
      />
      <MacroBar
        label="Fibres"
        current={totals.f ?? 0}
        target={targets.fib || 30}
        unit="g"
        color="#FF9F64"
      />
    </section>
  );
}
