import { useMemo, useState } from 'react';
import { makeExerciseResolver } from '@/data/exercises';
import { coachTips, type CoachTipKind } from '@/features/sport/coach';
import { todayISO } from '@/lib/date';
import { useSportStore } from '@/store/useSportStore';
import SportAIModal from './SportAIModal';
import type { TrainingProfile } from '@/types';

interface Props {
  profile: TrainingProfile;
}

const KIND_ICONS: Record<CoachTipKind, string> = {
  up: 'trending_up',
  down: 'trending_down',
  keep: 'check_circle',
  deload: 'battery_low',
  info: 'lightbulb',
  pr: 'trophy',
};

export default function CoachCard({ profile }: Props) {
  const sessions = useSportStore((s) => s.sessions);
  const [aiOpen, setAiOpen] = useState(false);

  const resolve = useMemo(
    () => makeExerciseResolver(profile.customExercises),
    [profile.customExercises],
  );

  const tips = useMemo(
    () => coachTips(profile, sessions, resolve, todayISO()),
    [profile, sessions, resolve],
  );

  if (sessions.length === 0) return null;

  return (
    <section className="kl-coach">
      <div className="kl-sport-section-lbl kl-sport-section-inline">
        <span className="kl-sport-section-bar" aria-hidden />
        COACH
        <button
          type="button"
          className="kl-coach-ai-btn"
          onClick={() => setAiOpen(true)}
        >
          ✨ Analyse IA
        </button>
      </div>

      {tips.length === 0 ? (
        <div className="kl-sport-history-empty">
          ▸ Continue à logger tes séances, les conseils arrivent avec les
          données
        </div>
      ) : (
        <div className="kl-coach-tips">
          {tips.map((tip, i) => (
            <div key={i} className={`kl-coach-tip kind-${tip.kind}`}>
              <span
                className="material-symbols-outlined kl-coach-tip-ico"
                aria-hidden
              >
                {KIND_ICONS[tip.kind]}
              </span>
              <div className="kl-coach-tip-body">
                {tip.exerciseName && (
                  <span className="kl-coach-tip-exo">{tip.exerciseName}</span>
                )}
                {tip.msg}
              </div>
            </div>
          ))}
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
