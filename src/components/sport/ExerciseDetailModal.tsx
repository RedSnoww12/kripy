import { useMemo, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { repRangeFor } from '@/data/exercises';
import {
  formatSuggestion,
  overloadTrack,
  suggestNext,
  targetScore,
} from '@/features/sport/nextSession';
import {
  summarizeExercise,
  TREND_POINTS,
  type ExercisePoint,
  type TrendKind,
} from '@/features/sport/progression';
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

type Metric = 'best' | 'volume' | 'rpe';

const CHART_W = 300;
const CHART_H = 130;
const PAD_X = 6;
const PAD_TOP = 14;
const PAD_BOTTOM = 18;
const MAX_POINTS = 12;
const MAX_HISTORY_ROWS = 5;

const METRIC_LABEL: Record<Metric, string> = {
  best: 'Perf',
  volume: 'Volume',
  rpe: 'RPE',
};

const TREND_ICON: Record<TrendKind, string> = {
  up: 'north_east',
  flat: 'east',
  down: 'south_east',
};

function formatSet(s: StrengthSet, bodyweight: boolean): string {
  const load = bodyweight ? (s.w > 0 ? `+${s.w}` : 'PDC') : String(s.w);
  return `${load}×${s.r}`;
}

function fmtSigned(n: number): string {
  const v = String(Math.abs(n)).replace('.', ',');
  return n > 0 ? `+${v}` : n < 0 ? `−${v}` : v;
}

/** Place un libellé au-dessus du point, ou en dessous s'il touche le haut. */
function labelY(pointY: number): number {
  return pointY > PAD_TOP + 14 ? pointY - 8 : pointY + 15;
}

function metricOf(p: ExercisePoint, metric: Metric): number | null {
  if (metric === 'best') return p.best;
  if (metric === 'volume') return p.volume;
  return p.avgRpe;
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
  const [metric, setMetric] = useState<Metric>('best');

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
    const hasRpe = summary.points.some((p) => p.avgRpe !== null);

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
      summary,
      last,
      next,
      pure,
      track,
      target,
      hasRpe,
      history,
      unit: pure ? 'reps' : 'kg e1RM',
    };
  }, [sessions, exerciseId, bodyweight, profile]);

  const chart = useMemo(() => {
    if (!data) return null;
    const points = data.summary.points
      .slice(-MAX_POINTS)
      .filter((p) => metricOf(p, metric) !== null);
    if (points.length < 2) return null;
    const values = points.map((p) => metricOf(p, metric) as number);
    const target = metric === 'best' ? data.target : null;
    const domainValues = target !== null ? [...values, target] : values;
    const min = metric === 'rpe' ? 6 : Math.min(...domainValues);
    const max = metric === 'rpe' ? 10 : Math.max(...domainValues);
    const span = max - min || 1;
    const innerH = CHART_H - PAD_TOP - PAD_BOTTOM;
    const stepX = (CHART_W - PAD_X * 2) / (points.length - 1);
    const yFor = (v: number) => PAD_TOP + innerH - ((v - min) / span) * innerH;
    const coords = points.map((p, i) => ({
      x: PAD_X + i * stepX,
      y: yFor(metricOf(p, metric) as number),
      point: p,
    }));
    const label =
      metric === 'best'
        ? `PROGRESSION · ${data.unit.toUpperCase()}`
        : metric === 'volume'
          ? `VOLUME PAR SÉANCE · ${data.pure ? 'REPS' : 'KG'}`
          : 'RPE MOYEN PAR SÉANCE';
    return {
      points,
      coords,
      yFor,
      target,
      label,
      first: values[0],
      lastV: values[values.length - 1],
    };
  }, [data, metric]);

  const metrics: Metric[] = data?.hasRpe
    ? ['best', 'volume', 'rpe']
    : ['best', 'volume'];

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

          {data.summary.trend && data.summary.trendPct !== null && (
            <div className="kl-detail-trend">
              <span className={`kl-prog-trend ${data.summary.trend}`}>
                <span className="material-symbols-outlined" aria-hidden>
                  {TREND_ICON[data.summary.trend]}
                </span>
                {fmtSigned(data.summary.trendPct)}%
              </span>
              <span className="kl-detail-trend-txt">
                tendance sur{' '}
                {Math.min(TREND_POINTS, data.summary.points.length)} séances
                {data.summary.stagnant && ' · en palier'}
                {data.summary.bestEver > 0 &&
                  !data.pure &&
                  ` · record ${String(data.summary.bestEver).replace('.', ',')} kg e1RM`}
              </span>
            </div>
          )}

          {data.track && (
            <div className="kl-detail-track">
              <div className="kl-detail-lbl">CYCLE DE PROGRESSION</div>
              <OverloadTrackBar track={data.track} size="lg" />
            </div>
          )}

          {data.summary.points.length >= 2 && (
            <div className="kl-detail-chart-wrap">
              <div className="kl-detail-chart-head">
                <div className="kl-detail-lbl">
                  {chart ? chart.label : 'PROGRESSION'}
                </div>
                <div className="kl-load-tabs kl-detail-tabs" role="tablist">
                  {metrics.map((m) => (
                    <button
                      key={m}
                      type="button"
                      role="tab"
                      aria-selected={metric === m}
                      className={`kl-load-tab ${metric === m ? 'on' : ''}`}
                      onClick={() => setMetric(m)}
                    >
                      {METRIC_LABEL[m]}
                    </button>
                  ))}
                </div>
              </div>
              {!chart ? (
                <div className="kl-detail-empty">
                  Pas assez de séances avec cette donnée.
                </div>
              ) : (
                <svg
                  className={`kl-detail-chart metric-${metric}`}
                  viewBox={`0 0 ${CHART_W} ${CHART_H}`}
                  aria-hidden
                >
                  {chart.target !== null && (
                    <>
                      <line
                        className="kl-detail-target-line"
                        x1={PAD_X}
                        x2={CHART_W - PAD_X}
                        y1={chart.yFor(chart.target)}
                        y2={chart.yFor(chart.target)}
                      />
                      <text
                        className="kl-detail-target-txt"
                        x={CHART_W - PAD_X}
                        y={chart.yFor(chart.target) - 4}
                        textAnchor="end"
                      >
                        cible {String(chart.target).replace('.', ',')}
                      </text>
                    </>
                  )}
                  <polyline
                    className="kl-detail-line"
                    points={chart.coords
                      .map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`)
                      .join(' ')}
                  />
                  {chart.coords.map((c, i) => (
                    <circle
                      key={c.point.sessionId}
                      className={`kl-detail-dot ${
                        i === chart.coords.length - 1 ? 'last' : ''
                      }`}
                      cx={c.x}
                      cy={c.y}
                      r={i === chart.coords.length - 1 ? 4 : 2.5}
                    />
                  ))}
                  <text
                    className="kl-detail-axis"
                    x={PAD_X}
                    y={labelY(chart.coords[0].y)}
                    textAnchor="start"
                  >
                    {String(chart.first).replace('.', ',')}
                  </text>
                  <text
                    className="kl-detail-axis kl-detail-axis-last"
                    x={CHART_W - PAD_X}
                    y={labelY(chart.coords[chart.coords.length - 1].y)}
                    textAnchor="end"
                  >
                    {String(chart.lastV).replace('.', ',')}
                  </text>
                  <text
                    className="kl-detail-axis"
                    x={PAD_X}
                    y={CHART_H - 4}
                    textAnchor="start"
                  >
                    {formatShortDate(chart.points[0].date)}
                  </text>
                  <text
                    className="kl-detail-axis"
                    x={CHART_W - PAD_X}
                    y={CHART_H - 4}
                    textAnchor="end"
                  >
                    {formatShortDate(
                      chart.points[chart.points.length - 1].date,
                    )}
                  </text>
                </svg>
              )}
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
