import { useState } from 'react';
import type {
  CoachAxis,
  CoachReport,
  CoachTipKind,
} from '@/features/sport/coach';
import type { TrainingStatusKind } from '@/features/sport/trainingStatus';
import SportAIModal from './SportAIModal';
import type { TrainingProfile } from '@/types';

interface Props {
  profile: TrainingProfile;
  report: CoachReport;
  hasSessions: boolean;
}

const KIND_ICONS: Record<CoachTipKind, string> = {
  up: 'trending_up',
  down: 'trending_down',
  keep: 'check_circle',
  deload: 'battery_low',
  info: 'lightbulb',
  warn: 'warning',
  pr: 'trophy',
  priority: 'star',
};

const AXIS_LABEL: Record<CoachAxis, string> = {
  adherence: 'Régularité',
  volume: 'Volume',
  intensity: 'Intensité',
  performance: 'Perf',
  recovery: 'Récup',
};

const STATUS_ICONS: Record<TrainingStatusKind, string> = {
  insufficient: 'hourglass_empty',
  progressing: 'trending_up',
  steady: 'trending_flat',
  stalled: 'pause_circle',
  fatigue: 'battery_low',
  spike: 'warning',
  low_volume: 'south',
};

/** Conseils affichés avant le bouton « voir plus ». */
const VISIBLE_TIPS = 4;

export default function CoachCard({ profile, report, hasSessions }: Props) {
  const [aiOpen, setAiOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (!hasSessions) return null;

  const { status, tips } = report;
  const urgent = tips.filter((t) => t.priority === 0).length;
  const visible = expanded ? tips : tips.slice(0, VISIBLE_TIPS);
  const hidden = tips.length - visible.length;

  return (
    <section className="kl-coach">
      <div className="kl-sport-section-lbl kl-sport-section-inline">
        <span className="kl-sport-section-bar" aria-hidden />
        COACH
        {urgent > 0 && (
          <span className="kl-coach-urgent-count">{urgent} à traiter</span>
        )}
        <button
          type="button"
          className="kl-coach-ai-btn"
          onClick={() => setAiOpen(true)}
        >
          ✨ Analyse IA
        </button>
      </div>

      <div className={`kl-coach-status tone-${status.tone}`}>
        <span className="kl-coach-status-ico" aria-hidden>
          <span className="material-symbols-outlined">
            {STATUS_ICONS[status.kind]}
          </span>
        </span>
        <div className="kl-coach-status-body">
          <div className="kl-coach-status-lbl">BILAN · 7 DERNIERS JOURS</div>
          <div className="kl-coach-status-title">{status.title}</div>
          <div className="kl-coach-status-msg">{status.msg}</div>
        </div>
      </div>

      {tips.length === 0 ? (
        <div className="kl-sport-history-empty">
          ▸ Continue à logger tes séances, les conseils arrivent avec les
          données
        </div>
      ) : (
        <div className="kl-coach-tips">
          {visible.map((tip, i) => (
            <div
              key={`${tip.axis}-${tip.exerciseName ?? ''}-${i}`}
              className={`kl-coach-tip kind-${tip.kind} prio-${tip.priority}`}
            >
              <span
                className="material-symbols-outlined kl-coach-tip-ico"
                aria-hidden
              >
                {KIND_ICONS[tip.kind]}
              </span>
              <div className="kl-coach-tip-body">
                <div className="kl-coach-tip-head">
                  <span className={`kl-coach-tip-axis axis-${tip.axis}`}>
                    {AXIS_LABEL[tip.axis]}
                  </span>
                  {tip.exerciseName && (
                    <span className="kl-coach-tip-exo">{tip.exerciseName}</span>
                  )}
                </div>
                {tip.msg}
              </div>
            </div>
          ))}
          {(hidden > 0 || expanded) && tips.length > VISIBLE_TIPS && (
            <button
              type="button"
              className="kl-coach-more"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
            >
              <span className="material-symbols-outlined" aria-hidden>
                {expanded ? 'expand_less' : 'expand_more'}
              </span>
              {expanded
                ? 'Réduire'
                : `Voir ${hidden} conseil${hidden > 1 ? 's' : ''} de plus`}
            </button>
          )}
        </div>
      )}

      <SportAIModal
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        profile={profile}
      />
    </section>
  );
}
