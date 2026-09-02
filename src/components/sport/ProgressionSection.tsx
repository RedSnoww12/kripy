import { useMemo, useState } from 'react';
import { makeExerciseResolver, repRangeFor } from '@/data/exercises';
import { overloadTrack, suggestNext } from '@/features/sport/nextSession';
import {
  summarizeExercise,
  trackedExerciseIds,
  type TrendKind,
} from '@/features/sport/progression';
import { useSportStore } from '@/store/useSportStore';
import { formatShortDate } from '@/lib/date';
import ExerciseDetailModal from './ExerciseDetailModal';
import OverloadTrackBar from './OverloadTrackBar';
import type { TrainingProfile } from '@/types';

interface Props {
  profile: TrainingProfile;
}

type Filter = 'all' | 'up' | 'flat' | 'down';

const SPARK_W = 96;
const SPARK_H = 28;
const SPARK_POINTS = 10;

const FILTER_LABEL: Record<Filter, string> = {
  all: 'Tous',
  up: 'Progresse',
  flat: 'Stagne',
  down: 'Baisse',
};

const TREND_ICON: Record<TrendKind, string> = {
  up: 'north_east',
  flat: 'east',
  down: 'south_east',
};

function fmtSigned(n: number): string {
  const v = String(Math.abs(n)).replace('.', ',');
  return n > 0 ? `+${v}` : n < 0 ? `−${v}` : v;
}

/**
 * Sparkline centrée : l'échelle garde une marge autour de la plage réelle
 * pour qu'une variation de 0,5 kg ne ressemble pas à une envolée, et qu'une
 * série plate reste au milieu plutôt que collée en haut.
 */
function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  const pad = Math.max(span * 0.25, max * 0.04, 0.5);
  const lo = min - pad;
  const hi = max + pad;
  const step = SPARK_W / (values.length - 1);
  const pts = values
    .map((v, i) => {
      const x = i * step;
      const y = SPARK_H - 3 - ((v - lo) / (hi - lo)) * (SPARK_H - 6);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const last = pts.split(' ').pop()!.split(',');
  return (
    <svg
      className="kl-prog-spark"
      viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
      aria-hidden
    >
      <polyline points={pts} />
      <circle cx={last[0]} cy={last[1]} r={2.4} />
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
  const [filter, setFilter] = useState<Filter>('all');

  const resolve = useMemo(
    () => makeExerciseResolver(profile.customExercises),
    [profile.customExercises],
  );

  const rows = useMemo(
    () =>
      trackedExerciseIds(profile, sessions).flatMap((id) => {
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
                repRangeFor(profile, id),
                def.bodyweight,
              )
            : null;
        return [{ id, def, summary, track }];
      }),
    [profile, resolve, sessions],
  );

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: rows.length,
      up: 0,
      flat: 0,
      down: 0,
    };
    for (const r of rows) if (r.summary.trend) c[r.summary.trend] += 1;
    return c;
  }, [rows]);

  const shown =
    filter === 'all' ? rows : rows.filter((r) => r.summary.trend === filter);

  return (
    <section className="kl-prog">
      <div className="kl-sport-section-lbl kl-sport-section-inline">
        <span className="kl-sport-section-bar" aria-hidden />
        SURCHARGE PROGRESSIVE
        {rows.length > 0 && (
          <span className="kl-prog-summary">
            {counts.up}↗ {counts.flat}→ {counts.down}↘
          </span>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="kl-sport-history-empty">
          ▸ Enregistre ta première séance pour suivre ta progression
        </div>
      ) : (
        <>
          {rows.length > 2 && (
            <div className="kl-prog-filters" role="tablist">
              {(['all', 'up', 'flat', 'down'] as Filter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  role="tab"
                  aria-selected={filter === f}
                  className={`kl-prog-filter ${filter === f ? 'on' : ''} f-${f}`}
                  onClick={() => setFilter(f)}
                  disabled={f !== 'all' && counts[f] === 0}
                >
                  {FILTER_LABEL[f]}
                  <span className="kl-prog-filter-n">{counts[f]}</span>
                </button>
              ))}
            </div>
          )}

          {shown.length === 0 ? (
            <div className="kl-sport-history-empty">
              ▸ Aucun exercice dans cette catégorie
            </div>
          ) : (
            <div className="kl-prog-grid">
              {shown.map(({ id, def, summary, track }) => {
                const { last, trend, trendPct, isPR } = summary;
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
                    className={`kl-prog-card ${trend ? `trend-${trend}` : ''}`}
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
                      {!isPR && trend && trendPct !== null && (
                        <span
                          className={`kl-prog-trend ${trend}`}
                          title={`Tendance sur ${Math.min(6, summary.points.length)} séances`}
                        >
                          <span
                            className="material-symbols-outlined"
                            aria-hidden
                          >
                            {TREND_ICON[trend]}
                          </span>
                          {summary.stagnant
                            ? 'palier'
                            : `${fmtSigned(trendPct)}%`}
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
        </>
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
