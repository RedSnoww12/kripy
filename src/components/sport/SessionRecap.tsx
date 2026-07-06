import { useMemo } from 'react';
import { makeExerciseResolver } from '@/data/exercises';
import {
  formatSuggestion,
  suggestNext,
  type SuggestionKind,
} from '@/features/sport/nextSession';
import { summarizeExercise } from '@/features/sport/progression';
import { useSportStore } from '@/store/useSportStore';
import type { StrengthSession, TrainingProfile } from '@/types';

interface Props {
  session: StrengthSession;
  profile: TrainingProfile;
  onClose: () => void;
}

const KIND_META: Record<SuggestionKind, { icon: string; label: string }> = {
  up: { icon: 'trending_up', label: 'MONTE' },
  reps: { icon: 'add', label: 'REPS' },
  keep: { icon: 'check', label: 'GARDE' },
  deload: { icon: 'south', label: 'ALLÈGE' },
};

export default function SessionRecap({ session, profile, onClose }: Props) {
  const sessions = useSportStore((s) => s.sessions);

  const resolve = useMemo(
    () => makeExerciseResolver(profile.customExercises),
    [profile.customExercises],
  );

  const { totalSets, totalReps, volume, prCount } = useMemo(() => {
    let sets = 0;
    let reps = 0;
    let vol = 0;
    let prs = 0;
    for (const entry of session.exercises) {
      sets += entry.sets.length;
      for (const s of entry.sets) {
        reps += s.r;
        vol += s.w * s.r;
      }
      const def = resolve(entry.exerciseId);
      if (
        def &&
        summarizeExercise(sessions, entry.exerciseId, def.bodyweight).isPR
      ) {
        prs += 1;
      }
    }
    return {
      totalSets: sets,
      totalReps: reps,
      volume: Math.round(vol),
      prCount: prs,
    };
  }, [session, sessions, resolve]);

  const suggestions = useMemo(
    () =>
      session.exercises.flatMap((entry) => {
        const def = resolve(entry.exerciseId);
        if (!def) return [];
        const s = suggestNext(
          profile,
          sessions,
          entry.exerciseId,
          def.bodyweight,
        );
        if (!s) return [];
        return [{ id: entry.exerciseId, def, s }];
      }),
    [session, sessions, profile, resolve],
  );

  return (
    <section className="kl-recap">
      <div className="kl-recap-hero">
        <span className="kl-recap-check" aria-hidden>
          <span className="material-symbols-outlined">check</span>
        </span>
        <div className="kl-recap-title">Séance {session.label} enregistrée</div>
        <div className="kl-recap-sub">
          {session.dur ? `${session.dur} min` : ''}
          {prCount > 0 && (
            <span className="kl-recap-pr">
              {' '}
              · {prCount} record{prCount > 1 ? 's' : ''} 🏆
            </span>
          )}
        </div>
      </div>

      <div className="kl-recap-stats">
        <div className="kl-recap-stat">
          <div className="kl-recap-stat-val">{session.exercises.length}</div>
          <div className="kl-recap-stat-lbl">EXOS</div>
        </div>
        <div className="kl-recap-stat">
          <div className="kl-recap-stat-val">{totalSets}</div>
          <div className="kl-recap-stat-lbl">SÉRIES</div>
        </div>
        <div className="kl-recap-stat">
          <div className="kl-recap-stat-val">{totalReps}</div>
          <div className="kl-recap-stat-lbl">REPS</div>
        </div>
        <div className="kl-recap-stat">
          <div className="kl-recap-stat-val">
            {volume > 0 ? volume.toLocaleString('fr-FR') : '—'}
          </div>
          <div className="kl-recap-stat-lbl">VOLUME KG</div>
        </div>
      </div>

      {suggestions.length > 0 && (
        <>
          <div className="kl-sport-section-lbl">
            <span className="kl-sport-section-bar" aria-hidden />
            PROCHAINE SÉANCE
          </div>
          <div className="kl-recap-next">
            {suggestions.map(({ id, def, s }) => (
              <div key={id} className={`kl-recap-row kind-${s.kind}`}>
                <span
                  className="material-symbols-outlined kl-recap-row-ico"
                  aria-hidden
                >
                  {KIND_META[s.kind].icon}
                </span>
                <div className="kl-recap-row-body">
                  <div className="kl-recap-row-head">
                    <span className="kl-recap-row-name">{def.name}</span>
                    <span className="kl-recap-row-target">
                      {formatSuggestion(s, def.bodyweight)}
                      <span className="kl-recap-row-sets">
                        {' '}
                        · {s.sets} série{s.sets > 1 ? 's' : ''}
                      </span>
                    </span>
                  </div>
                  <div className="kl-recap-row-why">{s.why}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <button
        type="button"
        className="kl-sport-save kl-recap-cta"
        onClick={onClose}
      >
        C'est noté 💪
      </button>
    </section>
  );
}
