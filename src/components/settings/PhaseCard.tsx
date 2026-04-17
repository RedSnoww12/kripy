import {
  PHASE_COLORS,
  PHASE_DESCRIPTIONS,
  PHASE_DETAIL,
  PHASE_NAMES,
} from '@/data/constants';
import { useSettingsStore } from '@/store/useSettingsStore';
import type { Phase } from '@/types';
import SettingsSection from './SettingsSection';

const ORDERED: readonly Phase[] = ['A', 'B', 'F', 'C', 'D', 'E'];

export default function PhaseCard() {
  const phase = useSettingsStore((s) => s.phase);
  const setPhase = useSettingsStore((s) => s.setPhase);

  const detail = PHASE_DETAIL[phase];
  const detailColor = PHASE_COLORS[phase];

  return (
    <SettingsSection icon="trending_up" title="Phase métabolique">
      <div
        className="set-ph-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
        }}
      >
        {ORDERED.map((k) => {
          const color = PHASE_COLORS[k];
          const selected = k === phase;
          return (
            <button
              key={k}
              type="button"
              className={`set-ph-card${selected ? ' sel' : ''}`}
              style={{ ['--ph-color' as string]: color }}
              onClick={() => setPhase(k)}
            >
              <span className="ph-letter">{k}</span>
              <span className="ph-name">{PHASE_NAMES[k]}</span>
              <span className="ph-desc">{PHASE_DESCRIPTIONS[k]}</span>
            </button>
          );
        })}
      </div>

      <div
        className="ph-det"
        style={{
          marginTop: 10,
          padding: '10px 12px',
          borderRadius: 10,
          border: `1px solid ${detailColor}40`,
          background: `${detailColor}10`,
          lineHeight: 1.5,
          fontSize: '.78rem',
        }}
      >
        <strong style={{ color: detailColor }}>
          {phase} — {detail.title}
        </strong>
        <br />
        {detail.description}
      </div>
    </SettingsSection>
  );
}
