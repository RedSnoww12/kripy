import { describe, expect, it } from 'vitest';
import type { StrengthSession, TrainingProfile } from '@/types';
import {
  epley1RM,
  exerciseHistory,
  isStagnant,
  regressionTrendPct,
  setScore,
  summarizeExercise,
  trackedExerciseIds,
  weekSessionCount,
  weeklyGoalStreak,
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

describe('weekSessionCount — bornes de la fenêtre', () => {
  it('exclut une séance datée d’exactement 7 jours (fenêtre de 7 jours, pas 8)', () => {
    expect(weekSessionCount(['2026-01-07'], '2026-01-14')).toBe(0);
    expect(weekSessionCount(['2026-01-08'], '2026-01-14')).toBe(1);
  });
});

describe('regressionTrendPct / tendance', () => {
  it('égale la variation brute avec deux points', () => {
    expect(regressionTrendPct([100, 105])).toBe(5);
  });

  it('lisse un écart isolé au milieu d’une série stable', () => {
    const pct = regressionTrendPct([100, 100, 110, 100, 100])!;
    expect(Math.abs(pct)).toBeLessThan(1.5);
  });

  it('renvoie null avec moins de deux points', () => {
    expect(regressionTrendPct([100])).toBeNull();
  });

  it('classe la tendance en up / flat / down', () => {
    const up = summarizeExercise(
      [
        session(1, '2026-01-01', [{ w: 80, r: 8 }]),
        session(2, '2026-01-04', [{ w: 82.5, r: 8 }]),
        session(3, '2026-01-07', [{ w: 85, r: 8 }]),
      ],
      'bench',
      false,
    );
    expect(up.trend).toBe('up');
    expect(up.trendPct).toBeGreaterThan(1.5);

    const flat = summarizeExercise(
      [
        session(1, '2026-01-01', [{ w: 80, r: 8 }]),
        session(2, '2026-01-04', [{ w: 80, r: 8 }]),
        session(3, '2026-01-07', [{ w: 80, r: 8 }]),
      ],
      'bench',
      false,
    );
    expect(flat.trend).toBe('flat');
    expect(flat.stagnant).toBe(true);

    const down = summarizeExercise(
      [
        session(1, '2026-01-01', [{ w: 90, r: 8 }]),
        session(2, '2026-01-04', [{ w: 85, r: 8 }]),
      ],
      'bench',
      false,
    );
    expect(down.trend).toBe('down');
  });
});

describe('summarizeExercise — palier prioritaire sur la tendance', () => {
  it('classe « flat » un exercice qui a progressé puis stagne 3 séances', () => {
    const s = summarizeExercise(
      [
        session(1, '2026-01-01', [{ w: 70, r: 8 }]),
        session(2, '2026-01-04', [{ w: 75, r: 8 }]),
        session(3, '2026-01-07', [{ w: 80, r: 8 }]),
        session(4, '2026-01-10', [{ w: 80, r: 8 }]),
        session(5, '2026-01-13', [{ w: 80, r: 8 }]),
      ],
      'bench',
      false,
    );
    expect(s.trendPct).toBeGreaterThan(1.5);
    expect(s.stagnant).toBe(true);
    expect(s.trend).toBe('flat');
  });
});

describe('isStagnant', () => {
  it('demande trois séances à ±1,5 % du même score', () => {
    const pts = exerciseHistory(
      [
        session(1, '2026-01-01', [{ w: 80, r: 8 }]),
        session(2, '2026-01-04', [{ w: 80, r: 8 }]),
        session(3, '2026-01-07', [{ w: 81, r: 8 }]),
      ],
      'bench',
      false,
    );
    expect(isStagnant(pts)).toBe(true);
    expect(isStagnant(pts.slice(-2))).toBe(false);
  });
});

describe('weeklyGoalStreak', () => {
  // 2026-01-14 est un mercredi : semaine en cours = 12/01 → 18/01.
  it('compte les semaines calendaires consécutives à l’objectif', () => {
    const dates = [
      // Semaine 29/12 → 04/01 : 3 séances.
      '2025-12-29',
      '2025-12-31',
      '2026-01-02',
      // Semaine 05/01 → 11/01 : 3 séances.
      '2026-01-05',
      '2026-01-07',
      '2026-01-09',
      // Semaine en cours : 1 séance, pas encore atteinte → ignorée.
      '2026-01-13',
    ];
    expect(weeklyGoalStreak(dates, 3, '2026-01-14')).toBe(2);
  });

  it('inclut la semaine en cours dès qu’elle est atteinte', () => {
    const dates = [
      '2026-01-05',
      '2026-01-07',
      '2026-01-09',
      '2026-01-12',
      '2026-01-13',
      '2026-01-14',
    ];
    expect(weeklyGoalStreak(dates, 3, '2026-01-14')).toBe(2);
  });

  it('s’arrête à la première semaine manquée', () => {
    const dates = ['2025-12-29', '2025-12-31', '2026-01-02', '2026-01-07'];
    expect(weeklyGoalStreak(dates, 3, '2026-01-14')).toBe(0);
  });

  it('renvoie 0 sans objectif', () => {
    expect(weeklyGoalStreak(['2026-01-13'], 0, '2026-01-14')).toBe(0);
  });
});
