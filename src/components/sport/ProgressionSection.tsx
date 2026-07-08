import { useMemo, useState } from 'react';
import { makeExerciseResolver, styleMeta } from '@/data/exercises';
import { overloadTrack, suggestNext } from '@/features/sport/nextSession';
import { summarizeExercise } from '@/features/sport/progression';
import { useSportStore } from '@/store/useSportStore';
import { formatShortDate } from '@/lib/date';
import ExerciseDetailModal from './ExerciseDetailModal';
import OverloadTrackBar from './OverloadTrackBar';
import type { TrainingProfile } from '@/types';

interface Props {
  profile: TrainingProfile;
}

const SPARK_W = 96;
const SPARK_H = 28;
const SPARK_POINTS = 10;

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = SPARK_W / (values.length - 1);
  const pts = values
    .map((v, i) => {
      const x = i * step;
      const y = SPARK_H - 3 - ((v - min) / span) * (SPARK_H - 6);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg
      className="kl-prog-spark"
      viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
      aria-hidden
    >
      <polyline points={pts} />
    </svg>
  );
}

interface Selected {
  id: string;
  name: string;
  bodyweight: boolean;
}

export default function ProgressionSection({ profile }: Props) {
  const sessions = useSportStore((s) => s.sessions);
  const [selected, setSelected] = useState<Selected | null>(null);

  const resolve = useMemo(
    () => makeExerciseResolver(profile.customExercises),
    [profile.customExercises],
  );

  const rows = useMemo(
    () =>
      profile.trackedExercises.flatMap((id) => {
        const def = resolve(id);
        if (!def) return [];
        const summary = summarizeExercise(sessions, id, def.bodyweight);
        if (!summary.last) return [];
        const next = suggestNext(profile, sessions, id, def.bodyweight);
        const track =
          next && summary.last
            ? overloadTrack(
                summary.last,
                next,
                styleMeta(profile.style).repRange,
                def.bodyweight,
              )
            : null;
        return [{ id, def, summary, track }];
      }),
    [profile, resolve, sessions],
  );

  return (
    <section className="kl-prog">
      <div className="kl-sport-section-lbl kl-sport-section-inline">
        <span className="kl-sport-section-bar" aria-hidden />
        SURCHARGE PROGRESSIVE
      </div>

      {rows.length === 0 ? (
        <div className="kl-sport-history-empty">
          ▸ Enregistre ta première séance pour suivre ta progression
        </div>
      ) : (
        <div className="kl-prog-grid">
          {rows.map(({ id, def, summary, track }) => {
            const { last, deltaPct, isPR } = summary;
            if (!last) return null;
            const pureBw = def.bodyweight && last.topW <= 0;
            const unit = pureBw ? 'reps' : 'kg e1RM';
            const value = pureBw ? last.topReps : last.best;
            const topSet = pureBw
              ? `${last.topReps} reps · ${last.setCount} série${last.setCount > 1 ? 's' : ''}`
              : `${def.bodyweight ? '+' : ''}${last.topW} kg × ${last.topReps}`;
            const values = summary.points
              .slice(-SPARK_POINTS)
              .map((p) => p.best);
            return (
              <button
                key={id}
                type="button"
                className="kl-prog-card"
                onClick={() =>
                  setSelected({
                    id,
                    name: def.name,
                    bodyweight: def.bodyweight,
                  })
                }
                aria-label={`Détail de la progression ${def.name}`}
              >
                <div className="kl-prog-head">
                  <span className="kl-prog-name">{def.name}</span>
                  {isPR && <span className="kl-prog-pr">PR</span>}
                  {deltaPct !== null && !isPR && (
                    <span
                      className={`kl-prog-delta ${
                        deltaPct > 0 ? 'up' : deltaPct < 0 ? 'down' : ''
                      }`}
                    >
                      {deltaPct > 0 ? '+' : ''}
                      {deltaPct}%
                    </span>
                  )}
                </div>
                <div className="kl-prog-val">
                  {Math.round(value * 10) / 10}
                  <span className="kl-prog-unit">{unit}</span>
                </div>
                <div className="kl-prog-sub">
                  {topSet}
                  {last.avgRpe !== null && ` · RPE ${last.avgRpe}`}
                </div>
                {track && <OverloadTrackBar track={track} />}
                <div className="kl-prog-foot">
                  <Sparkline values={values} />
                  <span className="kl-prog-date">
                    {formatShortDate(last.date)}
                    <span
                      className="material-symbols-outlined kl-prog-more"
                      aria-hidden
                    >
                      chevron_right
                    </span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <ExerciseDetailModal
          open
          onClose={() => setSelected(null)}
          exerciseId={selected.id}
          name={selected.name}
          bodyweight={selected.bodyweight}
          profile={profile}
        />
      )}
    </section>
  );
}
