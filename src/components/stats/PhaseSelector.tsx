import { PHASE_COLORS, PHASE_NAMES } from '@/data/constants';
import type { Phase } from '@/types';

const ORDERED_PHASES: readonly Phase[] = ['A', 'B', 'F', 'C', 'D', 'E'];

interface Props {
  value: Phase;
  onChange: (phase: Phase) => void;
}

export default function PhaseSelector({ value, onChange }: Props) {
  return (
    <div
      className="ph-row"
      style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}
    >
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
              borderColor: selected ? color : 'var(--s3)',
              background: selected ? `${color}22` : undefined,
            }}
          >
            <span className="pl" style={{ color }}>
              {k}
            </span>{' '}
            {PHASE_NAMES[k]}
          </button>
        );
      })}
    </div>
  );
}
