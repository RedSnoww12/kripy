import { describe, expect, it } from 'vitest';
import { currentPhaseSegment, phaseSegmentsFor } from './phaseSegments';
import type { WeightEntry } from '@/types';

describe('phaseSegmentsFor', () => {
  it('returns an empty list when no entries match the phase', () => {
    const w: WeightEntry[] = [
      { date: '2026-04-01', w: 78, phase: 'B' },
      { date: '2026-04-02', w: 77.8, phase: 'B' },
    ];
    expect(phaseSegmentsFor(w, 'F')).toEqual([]);
  });

  it('treats untagged entries as a single legacy segment', () => {
    const w: WeightEntry[] = [
      { date: '2026-04-01', w: 78 },
      { date: '2026-04-02', w: 77.8 },
    ];
    const segs = phaseSegmentsFor(w, 'F');
    expect(segs).toHaveLength(1);
    expect(segs[0].entries).toHaveLength(2);
  });

  it('splits phases on explicit transitions (F → B → F gives two F segments)', () => {
    const w: WeightEntry[] = [
      { date: '2026-03-01', w: 70, phase: 'F' },
      { date: '2026-03-05', w: 70.5, phase: 'F' },
      { date: '2026-03-10', w: 71, phase: 'F' },
      { date: '2026-03-12', w: 70.8, phase: 'B' },
      { date: '2026-03-20', w: 69, phase: 'B' },
      { date: '2026-04-01', w: 69.2, phase: 'F' },
      { date: '2026-04-05', w: 69.6, phase: 'F' },
    ];
    const segs = phaseSegmentsFor(w, 'F');
    expect(segs).toHaveLength(2);
    expect(segs[0].startDate).toBe('2026-03-01');
    expect(segs[0].endDate).toBe('2026-03-10');
    expect(segs[0].entries).toHaveLength(3);
    expect(segs[1].startDate).toBe('2026-04-01');
    expect(segs[1].endDate).toBe('2026-04-05');
    expect(segs[1].entries).toHaveLength(2);
  });

  it('does not leak entries across phase boundaries', () => {
    const w: WeightEntry[] = [
      { date: '2026-03-01', w: 70, phase: 'F' },
      { date: '2026-03-05', w: 71, phase: 'F' },
      { date: '2026-03-10', w: 69, phase: 'B' },
      { date: '2026-04-01', w: 69.5, phase: 'F' },
    ];
    const current = currentPhaseSegment(w, 'F');
    expect(current?.entries).toHaveLength(1);
    expect(current?.startDate).toBe('2026-04-01');
  });

  it('treats untagged entries as continuations of the prior tagged phase', () => {
    const w: WeightEntry[] = [
      { date: '2026-04-01', w: 69.5, phase: 'F' },
      { date: '2026-04-02', w: 69.6 },
      { date: '2026-04-03', w: 69.8, phase: 'F' },
    ];
    const current = currentPhaseSegment(w, 'F');
    expect(current?.entries).toHaveLength(3);
  });
});
