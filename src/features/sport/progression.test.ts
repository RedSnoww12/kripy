import { describe, expect, it } from 'vitest';
import type { StrengthSession, TrainingProfile } from '@/types';
import {
  epley1RM,
  exerciseHistory,
  setScore,
  summarizeExercise,
  trackedExerciseIds,
  weekSessionCount,
} from './progression';

function session(
  id: number,
  date: string,
  sets: { w: number; r: number; rpe?: number }[],
  exerciseId = 'bench',
): StrengthSession {
  return {
    id,
    date,
    label: 'Push',
    exercises: [{ exerciseId, sets }],
  };
}

describe('epley1RM', () => {
  it('returns the weight itself for a single rep', () => {
    expect(epley1RM(100, 1)).toBe(100);
  });

  it('estimates 1RM with the Epley formula', () => {
    expect(epley1RM(100, 5)).toBeCloseTo(116.7, 1);
  });

  it('returns 0 for zero weight or reps', () => {
    expect(epley1RM(0, 10)).toBe(0);
    expect(epley1RM(80, 0)).toBe(0);
  });
});

describe('setScore', () => {
  it('uses reps for pure bodyweight sets', () => {
    expect(setScore({ w: 0, r: 12 }, true)).toBe(12);
  });

  it('uses e1RM for weighted bodyweight sets', () => {
    expect(setScore({ w: 20, r: 5 }, true)).toBeCloseTo(23.3, 1);
  });

  it('uses e1RM for barbell sets', () => {
    expect(setScore({ w: 100, r: 5 }, false)).toBeCloseTo(116.7, 1);
  });
});

describe('exerciseHistory', () => {
  it('returns one point per session containing the exercise', () => {
    const sessions = [
      session(1, '2026-01-01', [{ w: 80, r: 5 }]),
      session(2, '2026-01-03', [{ w: 0, r: 0 }], 'squat'),
      session(3, '2026-01-05', [
        { w: 80, r: 6, rpe: 8 },
        { w: 85, r: 4, rpe: 9 },
      ]),
    ];
    const points = exerciseHistory(sessions, 'bench', false);
    expect(points).toHaveLength(2);
    expect(points[0].date).toBe('2026-01-01');
    expect(points[1].topW).toBe(85);
    expect(points[1].avgRpe).toBe(8.5);
    expect(points[1].setCount).toBe(2);
  });

  it('sorts sessions chronologically', () => {
    const sessions = [
      session(2, '2026-01-05', [{ w: 90, r: 5 }]),
      session(1, '2026-01-01', [{ w: 80, r: 5 }]),
    ];
    const points = exerciseHistory(sessions, 'bench', false);
    expect(points[0].topW).toBe(80);
    expect(points[1].topW).toBe(90);
  });

  it('computes volume as reps for pure bodyweight work', () => {
    const sessions = [
      session(1, '2026-01-01', [
        { w: 0, r: 10 },
        { w: 0, r: 8 },
      ]),
    ];
    const points = exerciseHistory(sessions, 'bench', true);
    expect(points[0].volume).toBe(18);
    expect(points[0].best).toBe(10);
  });
});

describe('summarizeExercise', () => {
  it('flags a PR when the last session beats every previous one', () => {
    const sessions = [
      session(1, '2026-01-01', [{ w: 80, r: 5 }]),
      session(2, '2026-01-04', [{ w: 85, r: 5 }]),
    ];
    const s = summarizeExercise(sessions, 'bench', false);
    expect(s.isPR).toBe(true);
    expect(s.deltaPct).toBeCloseTo(6.3, 1);
  });

  it('does not flag PR on a first session', () => {
    const sessions = [session(1, '2026-01-01', [{ w: 80, r: 5 }])];
    const s = summarizeExercise(sessions, 'bench', false);
    expect(s.isPR).toBe(false);
    expect(s.deltaPct).toBeNull();
  });

  it('reports negative delta on regression', () => {
    const sessions = [
      session(1, '2026-01-01', [{ w: 100, r: 5 }]),
      session(2, '2026-01-04', [{ w: 90, r: 5 }]),
    ];
    const s = summarizeExercise(sessions, 'bench', false);
    expect(s.isPR).toBe(false);
    expect(s.deltaPct).toBeLessThan(0);
    expect(s.bestEver).toBeCloseTo(116.7, 1);
  });
});

describe('trackedExerciseIds', () => {
  const profile: Pick<TrainingProfile, 'sessionTemplates'> = {
    sessionTemplates: [
      {
        id: 'upper',
        name: 'Upper A',
        exercises: [{ exerciseId: 'dips', sets: 4, repsMin: 8, repsMax: 10 }],
      },
    ],
  };

  it('inclut les exercices planifiés même sans historique', () => {
    expect(trackedExerciseIds(profile, [])).toEqual(['dips']);
  });

  it('ajoute les exercices loggés en séance libre', () => {
    const sessions = [session(1, '2026-01-10', [{ w: 20, r: 8 }], 'curl')];
    expect(trackedExerciseIds(profile, sessions).sort()).toEqual([
      'curl',
      'dips',
    ]);
  });

  it('ne duplique pas un exercice à la fois planifié et loggé', () => {
    const sessions = [session(1, '2026-01-10', [{ w: 0, r: 10 }], 'dips')];
    expect(trackedExerciseIds(profile, sessions)).toEqual(['dips']);
  });
});

describe('weekSessionCount', () => {
  it('counts unique dates within the trailing 7 days', () => {
    const dates = [
      '2026-01-01',
      '2026-01-08',
      '2026-01-08',
      '2026-01-10',
      '2026-01-14',
    ];
    expect(weekSessionCount(dates, '2026-01-14')).toBe(3);
  });

  it('returns 0 with no recent sessions', () => {
    expect(weekSessionCount(['2025-12-01'], '2026-01-14')).toBe(0);
  });
});
