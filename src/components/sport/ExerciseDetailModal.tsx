import { useMemo } from 'react';
import Modal from '@/components/ui/Modal';
import { repRangeFor } from '@/data/exercises';
import {
  formatSuggestion,
  overloadTrack,
  suggestNext,
  targetScore,
} from '@/features/sport/nextSession';
import { summarizeExercise } from '@/features/sport/progression';
import { formatShortDate } from '@/lib/date';
import { useSportStore } from '@/store/useSportStore';
import OverloadTrackBar from './OverloadTrackBar';
import type { StrengthSet, TrainingProfile } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  exerciseId: string;
  name: string;
  bodyweight: boolean;
  profile: TrainingProfile;
}

const CHART_W = 300;
const CHART_H = 130;
const PAD_X = 6;
const PAD_TOP = 14;
const PAD_BOTTOM = 18;
const MAX_POINTS = 12;
const MAX_HISTORY_ROWS = 5;

function formatSet(s: StrengthSet, bodyweight: boolean): string {
  const load = bodyweight ? (s.w > 0 ? `+${s.w}` : 'PDC') : String(s.w);
  return `${load}×${s.r}`;
}

export default function ExerciseDetailModal({
  open,
  onClose,
  exerciseId,
  name,
  bodyweight,
  profile,
}: Props) {
  const sessions = useSportStore((s) => s.sessions);

  const data = useMemo(() => {
    const summary = summarizeExercise(sessions, exerciseId, bodyweight);
    const last = summary.last;
    if (!last) return null;
    const next = suggestNext(profile, sessions, exerciseId, bodyweight);
    const pure = bodyweight && last.topW <= 0;
    const track = next
      ? overloadTrack(last, next, repRangeFor(profile, exerciseId), bodyweight)
      : null;
    const target = next ? targetScore(next, bodyweight, pure) : null;

    const points = summary.points.slice(-MAX_POINTS);
    const values = points.map((p) => p.best);
    const domainValues = target !== null ? [...values, target] : values;
    const min = Math.min(...domainValues);
    const max = Math.max(...domainValues);
    const span = max - min || 1;
    const innerH = CHART_H - PAD_TOP - PAD_BOTTOM;
    const stepX =
      points.length > 1 ? (CHART_W - PAD_X * 2) / (points.length - 1) : 0;
    const yFor = (v: number) => PAD_TOP + innerH - ((v - min) / span) * innerH;
    const coords = points.map((p, i) => ({
      x: PAD_X + i * stepX,
      y: yFor(p.best),
      point: p,
    }));

    const history = summary.points
      .slice(-MAX_HISTORY_ROWS)
      .reverse()
      .map((p) => {
        const session = sessions.find((s) => s.id === p.sessionId);
        const sets =
          session?.exercises.find((e) => e.exerciseId === exerciseId)?.sets ??
          [];
        return { point: p, sets };
      });

    return {
      last,
      next,
      pure,
      track,
      target,
      points,
      coords,
      yFor,
      history,
      unit: pure ? 'reps' : 'kg e1RM',
    };
  }, [sessions, exerciseId, bodyweight, profile]);

  return (
    <Modal open={open} onClose={onClose}>
      <h3>{name}</h3>

      {!data ? (
        <div className="kl-detail-empty">
          Enregistre une première séance avec cet exercice pour voir ta
          progression.
        </div>
      ) : (
        <div className="kl-detail">
          <div className="kl-detail-hero">
            <div className="kl-detail-side">
              <div className="kl-detail-side-lbl">ACTUEL</div>
              <div className="kl-detail-side-val">
                {data.pure
                  ? `${data.last.topReps} reps`
                  : `${formatSet(
                      { w: data.last.topW, r: data.last.topReps },
                      bodyweight,
                    ).replace('×', ' kg × ')}`}
              </div>
              {data.last.avgRpe !== null && (
                <div className="kl-detail-side-sub">RPE {data.last.avgRpe}</div>
              )}
            </div>
            <span
              className="material-symbols-outlined kl-detail-arrow"
              aria-hidden
            >
              arrow_forward
            </span>
            <div className="kl-detail-side kl-detail-side-target">
              <div className="kl-detail-side-lbl">OBJECTIF</div>
              <div className="kl-detail-side-val">
                {data.next ? formatSuggestion(data.next, bodyweight) : '—'}
              </div>
              {data.next && (
                <div className="kl-detail-side-sub">
                  {data.next.sets} série{data.next.sets > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
          {data.next && <div className="kl-detail-why">{data.next.why}</div>}

          {data.track && (
            <div className="kl-detail-track">
              <div className="kl-detail-lbl">CYCLE DE PROGRESSION</div>
              <OverloadTrackBar track={data.track} size="lg" />
            </div>
          )}

          {data.coords.length >= 2 && (
            <div className="kl-detail-chart-wrap">
              <div className="kl-detail-lbl">
                PROGRESSION · {data.unit.toUpperCase()}
              </div>
              <svg
                className="kl-detail-chart"
                viewBox={`0 0 ${CHART_W} ${CHART_H}`}
                aria-hidden
              >
                {data.target !== null && (
                  <>
                    <line
                      className="kl-detail-target-line"
                      x1={PAD_X}
                      x2={CHART_W - PAD_X}
                      y1={data.yFor(data.target)}
                      y2={data.yFor(data.target)}
                    />
                    <text
                      className="kl-detail-target-txt"
                      x={CHART_W - PAD_X}
                      y={data.yFor(data.target) - 4}
                      textAnchor="end"
                    >
                      cible {String(data.target).replace('.', ',')}
                    </text>
                  </>
                )}
                <polyline
                  className="kl-detail-line"
                  points={data.coords
                    .map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`)
                    .join(' ')}
                />
                {data.coords.map((c, i) => (
                  <circle
                    key={c.point.sessionId}
                    className={`kl-detail-dot ${
                      i === data.coords.length - 1 ? 'last' : ''
                    }`}
                    cx={c.x}
                    cy={c.y}
                    r={i === data.coords.length - 1 ? 4 : 2.5}
                  />
                ))}
                <text
                  className="kl-detail-axis"
                  x={PAD_X}
                  y={CHART_H - 4}
                  textAnchor="start"
                >
                  {formatShortDate(data.points[0].date)}
                </text>
                <text
                  className="kl-detail-axis"
                  x={CHART_W - PAD_X}
                  y={CHART_H - 4}
                  textAnchor="end"
                >
                  {formatShortDate(data.points[data.points.length - 1].date)}
                </text>
              </svg>
            </div>
          )}

          <div className="kl-detail-lbl">DERNIÈRES SÉANCES</div>
          <div className="kl-detail-history">
            {data.history.map(({ point, sets }) => (
              <div key={point.sessionId} className="kl-detail-row">
                <span className="kl-detail-row-date">
                  {formatShortDate(point.date)}
                </span>
                <span className="kl-detail-row-sets">
                  {sets.map((s) => formatSet(s, bodyweight)).join(' · ')}
                </span>
                {point.avgRpe !== null && (
                  <span className="kl-detail-row-rpe">RPE {point.avgRpe}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="acts kl-detail-acts">
        <button type="button" className="btn btn-o" onClick={onClose}>
          Fermer
        </button>
      </div>
    </Modal>
  );
}
