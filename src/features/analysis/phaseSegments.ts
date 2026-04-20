import type { Phase, WeightEntry } from '@/types';

export interface PhaseSegment {
  phase: Phase;
  startDate: string;
  endDate: string;
  entries: WeightEntry[];
}

function sortByDate(weights: readonly WeightEntry[]): WeightEntry[] {
  return [...weights].sort((a, b) => a.date.localeCompare(b.date));
}

export function phaseSegmentsFor(
  weights: readonly WeightEntry[],
  phase: Phase,
): PhaseSegment[] {
  const sorted = sortByDate(weights);
  const segments: PhaseSegment[] = [];
  let current: WeightEntry[] | null = null;
  let effectivePhase: Phase | undefined = undefined;

  for (const e of sorted) {
    if (typeof e.phase === 'string') {
      effectivePhase = e.phase;
    }
    const matches =
      effectivePhase === undefined || effectivePhase === phase;

    if (matches) {
      if (!current) {
        current = [];
        segments.push({
          phase,
          startDate: e.date,
          endDate: e.date,
          entries: current,
        });
      }
      current.push(e);
      segments[segments.length - 1].endDate = e.date;
    } else {
      current = null;
    }
  }

  return segments;
}

export function currentPhaseSegment(
  weights: readonly WeightEntry[],
  phase: Phase,
): PhaseSegment | null {
  const segments = phaseSegmentsFor(weights, phase);
  if (!segments.length) return null;
  return segments[segments.length - 1];
}
