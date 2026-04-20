import type { Phase, WeightEntry } from '@/types';
import { linReg, type LinRegPoint } from '../trend';
import { phaseSegmentsFor, type PhaseSegment } from '../phaseSegments';
import { CHART_TOKENS } from './chartDefaults';

const MS_PER_DAY = 86_400_000;

const SEGMENT_PALETTE = [
  CHART_TOKENS.tickMute,
  CHART_TOKENS.cyan,
  CHART_TOKENS.pink,
  CHART_TOKENS.purple,
  CHART_TOKENS.orange,
  CHART_TOKENS.primary,
];

export interface PhaseComparisonSeriesPoint {
  day: number;
  weight: number;
  delta: number;
}

export interface PhaseComparisonSeries {
  id: string;
  label: string;
  color: string;
  isCurrent: boolean;
  startDate: string;
  endDate: string;
  sampleCount: number;
  rate: number;
  totalChange: number;
  points: PhaseComparisonSeriesPoint[];
}

export interface PhaseComparisonResult {
  phase: Phase;
  maxDay: number;
  series: PhaseComparisonSeries[];
}

interface BuildArgs {
  weights: readonly WeightEntry[];
  phase: Phase;
}

function segmentToSeries(
  segment: PhaseSegment,
  index: number,
  total: number,
): PhaseComparisonSeries {
  const isCurrent = index === total - 1;
  const t0 = Date.parse(segment.startDate);
  const baseline = segment.entries[0]?.w ?? 0;
  const points: PhaseComparisonSeriesPoint[] = segment.entries.map((e) => ({
    day: Math.round((Date.parse(e.date) - t0) / MS_PER_DAY),
    weight: e.w,
    delta: +(e.w - baseline).toFixed(2),
  }));

  const regPts: LinRegPoint[] = points.map((p) => ({ x: p.day, y: p.weight }));
  const lr = points.length >= 2 ? linReg(regPts) : { slope: 0 };
  const last = segment.entries[segment.entries.length - 1];
  const first = segment.entries[0];
  const totalChange = last && first ? +(last.w - first.w).toFixed(1) : 0;

  const color = isCurrent
    ? CHART_TOKENS.yellow
    : SEGMENT_PALETTE[index % SEGMENT_PALETTE.length];

  return {
    id: `${segment.phase}-${segment.startDate}`,
    label: isCurrent
      ? `Phase ${segment.phase} actuelle`
      : `Phase ${segment.phase} · ${segment.startDate}`,
    color,
    isCurrent,
    startDate: segment.startDate,
    endDate: segment.endDate,
    sampleCount: segment.entries.length,
    rate: +((lr.slope ?? 0) * 7).toFixed(2),
    totalChange,
    points,
  };
}

export function buildPhaseComparisonData({
  weights,
  phase,
}: BuildArgs): PhaseComparisonResult | null {
  const segments = phaseSegmentsFor(weights, phase).filter(
    (s) => s.entries.length >= 2,
  );
  if (segments.length < 2) return null;

  const series = segments.map((seg, i) => segmentToSeries(seg, i, segments.length));
  const maxDay = series.reduce(
    (max, s) =>
      Math.max(max, s.points.reduce((m, p) => Math.max(m, p.day), 0)),
    0,
  );

  return { phase, maxDay, series };
}
