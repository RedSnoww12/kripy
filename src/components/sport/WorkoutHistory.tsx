import { useMemo } from 'react';
import { useSportStore } from '@/store/useSportStore';
import { useTrackingStore } from '@/store/useTrackingStore';
import { formatShortDate } from '@/lib/date';
import { SPLITS } from '@/data/constants';
import type { StrengthSession, Workout } from '@/types';

const HISTORY_LIMIT = 15;

function workoutAccent(w: Workout, isStrength: boolean): string {
  if (
    isStrength ||
    SPLITS.includes(w.type as (typeof SPLITS)[number]) ||
    w.muscles
  )
    return 'var(--acc)';
  const t = w.type.toLowerCase();
  if (/(box|mma|judo|karat|jiu|taekwondo|kick|muay|lutte)/.test(t))
    return 'var(--pnk)';
  if (
    /(foot|tennis|basket|volley|rugby|hand|escal|ski|surf|roller|dans)/.test(t)
  )
    return 'var(--org)';
  return 'var(--cyan)';
}

function strengthSummary(session: StrengthSession): string {
  const totalSets = session.exercises.reduce((n, e) => n + e.sets.length, 0);
  return `${session.exercises.length} exo${session.exercises.length > 1 ? 's' : ''} · ${totalSets} séries`;
}

export default function WorkoutHistory() {
  const workouts = useTrackingStore((s) => s.workouts);
  const removeWorkout = useTrackingStore((s) => s.removeWorkout);
  const sessions = useSportStore((s) => s.sessions);
  const removeSession = useSportStore((s) => s.removeSession);

  const sessionById = useMemo(
    () => new Map(sessions.map((s) => [s.id, s])),
    [sessions],
  );

  const recent = [...workouts].reverse().slice(0, HISTORY_LIMIT);

  const handleDelete = (id: number) => {
    removeWorkout(id);
    if (sessionById.has(id)) removeSession(id);
  };

  return (
    <section className="kl-sport-history">
      <div className="kl-sport-section-lbl kl-sport-section-inline">
        <span className="kl-sport-section-bar" aria-hidden />
        HISTORIQUE
        {recent.length > 0 && (
          <span className="kl-sport-history-count">{workouts.length}</span>
        )}
      </div>

      {recent.length === 0 ? (
        <div className="kl-sport-history-empty">
          ▸ Aucune séance enregistrée — log ta première session
        </div>
      ) : (
        recent.map((w, i) => {
          const session = sessionById.get(w.id);
          const accent = workoutAccent(w, Boolean(session));
          const muscleLabels = w.muscles
            ?.map((m) => `${m.name} ${m.sets}s`)
            .join(' · ');
          const subBits = [formatShortDate(w.date)];
          if (session) subBits.push(strengthSummary(session));
          else if (muscleLabels) subBits.push(muscleLabels);
          if (w.cal) subBits.push(`${w.cal} kcal`);
          const totalSets =
            session?.exercises.reduce((n, e) => n + e.sets.length, 0) ??
            w.muscles?.reduce((s, m) => s + m.sets, 0) ??
            0;

          return (
            <div
              key={w.id}
              className={`kl-sport-hist-row ${i > 0 ? 'divider' : ''}`}
            >
              <span
                className="kl-sport-hist-led"
                style={{
                  background: accent,
                  boxShadow: `0 0 6px color-mix(in srgb, ${accent} 55%, transparent)`,
                }}
                aria-hidden
              />
              <div className="kl-sport-hist-body">
                <div className="kl-sport-hist-title">{w.type}</div>
                <div className="kl-sport-hist-sub">{subBits.join(' · ')}</div>
                {(session?.notes ?? w.notes) && (
                  <div className="kl-sport-hist-notes">
                    {session?.notes ?? w.notes}
                  </div>
                )}
              </div>
              <div className="kl-sport-hist-stats">
                <div className="kl-sport-hist-dur">
                  {w.dur}
                  <span className="kl-sport-hist-dur-u">MIN</span>
                </div>
                {totalSets > 0 && (
                  <div className="kl-sport-hist-sets">{totalSets} sets</div>
                )}
              </div>
              <button
                type="button"
                className="kl-sport-hist-del"
                onClick={() => handleDelete(w.id)}
                aria-label={`Supprimer la séance ${w.type}`}
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
          );
        })
      )}
    </section>
  );
}
