import { PHASE_COLORS, PHASE_NAMES } from '@/data/constants';
import type { Phase } from '@/types';

const ORDERED_PHASES: readonly Phase[] = ['A', 'B', 'F', 'C', 'D', 'E'];

interface Props {
  value: Phase;
  onChange: (phase: Phase) => void;
  compact?: boolean;
}

export default function PhaseSelector({
  value,
  onChange,
  compact = true,
}: Props) {
  const className = compact ? 'ph-sel compact' : 'ph-sel';
  return (
    <div className={className}>
      {ORDERED_PHASES.map((k) => {
        const color = PHASE_COLORS[k];
        const selected = k === value;
        return (
          <button
            key={k}
            type="button"
            className={`ph-btn${selected ? ' sel' : ''}`}
            onClick={() => onChange(k)}
            style={{
              boxShadow: selected ? `inset 0 -2px 0 0 ${color}` : undefined,
            }}
          >
            <span className="pl" style={{ color }}>
              {k}
            </span>
            {PHASE_NAMES[k]}
          </button>
        );
      })}
    </div>
  );
}
