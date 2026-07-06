import { describe, expect, it } from 'vitest';
import type { StrengthSession, TrainingProfile } from '@/types';
import type { ExercisePoint } from './progression';
import {
  formatSuggestion,
  overloadTrack,
  suggestNext,
  targetScore,
  type NextSuggestion,
} from './nextSession';

const profile: TrainingProfile = {
  style: 'hypertrophy', // fourchette 6-12
  split: 'ppl',
  sessionsPerWeek: 3,
  trackedExercises: ['bench', 'pullup'],
  customExercises: [],
};

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

describe('suggestNext — exercices chargés', () => {
  it('renvoie null sans historique', () => {
    expect(suggestNext(profile, [], 'bench', false)).toBeNull();
  });

  it('monte la charge quand le haut de fourchette est atteint', () => {
    const sessions = [session(1, '2026-01-10', [{ w: 80, r: 12, rpe: 8 }])];
    const s = suggestNext(profile, sessions, 'bench', false);
    expect(s?.kind).toBe('up');
    expect(s?.w).toBe(82.5);
    expect(s?.repsMin).toBe(6);
  });

  it('monte la charge quand le RPE est bas', () => {
    const sessions = [session(1, '2026-01-10', [{ w: 80, r: 8, rpe: 7 }])];
    const s = suggestNext(profile, sessions, 'bench', false);
    expect(s?.kind).toBe('up');
    expect(s?.w).toBe(82.5);
    expect(s?.repsMin).toBe(8);
  });

  it('vise plus de reps à charge égale en milieu de fourchette', () => {
    const sessions = [session(1, '2026-01-10', [{ w: 80, r: 8, rpe: 8.5 }])];
    const s = suggestNext(profile, sessions, 'bench', false);
    expect(s?.kind).toBe('reps');
    expect(s?.w).toBe(80);
    expect(s?.repsMin).toBe(9);
    expect(s?.repsMax).toBe(10);
  });

  it('propose un deload après un RPE maximal sans progression', () => {
    const sessions = [
      session(1, '2026-01-07', [{ w: 80, r: 8, rpe: 9 }]),
      session(2, '2026-01-10', [{ w: 80, r: 8, rpe: 10 }]),
    ];
    const s = suggestNext(profile, sessions, 'bench', false);
    expect(s?.kind).toBe('deload');
    expect(s?.w).toBe(72.5);
  });

  it('consolide la charge après un RPE maximal malgré la progression', () => {
    const sessions = [
      session(1, '2026-01-07', [{ w: 77.5, r: 8, rpe: 8.5 }]),
      session(2, '2026-01-10', [{ w: 80, r: 8, rpe: 9.5 }]),
    ];
    const s = suggestNext(profile, sessions, 'bench', false);
    expect(s?.kind).toBe('keep');
    expect(s?.w).toBe(80);
  });

  it('reprend le nombre de séries de la dernière séance', () => {
    const sessions = [
      session(1, '2026-01-10', [
        { w: 80, r: 8, rpe: 8.5 },
        { w: 80, r: 8, rpe: 8.5 },
        { w: 80, r: 7, rpe: 9 },
        { w: 80, r: 6, rpe: 9 },
      ]),
    ];
    const s = suggestNext(profile, sessions, 'bench', false);
    expect(s?.sets).toBe(4);
  });
});

describe('suggestNext — poids du corps', () => {
  it('ajoute des reps sous le haut de fourchette', () => {
    const sessions = [
      session(1, '2026-01-10', [{ w: 0, r: 8, rpe: 8 }], 'pullup'),
    ];
    const s = suggestNext(profile, sessions, 'pullup', true);
    expect(s?.kind).toBe('reps');
    expect(s?.repsMin).toBe(9);
  });

  it('propose de passer au lest en haut de fourchette', () => {
    const sessions = [
      session(1, '2026-01-10', [{ w: 0, r: 12, rpe: 8 }], 'pullup'),
    ];
    const s = suggestNext(profile, sessions, 'pullup', true);
    expect(s?.kind).toBe('up');
    expect(s?.w).toBe(2.5);
  });

  it('suit la progression de charge une fois lesté', () => {
    const sessions = [
      session(1, '2026-01-10', [{ w: 10, r: 12, rpe: 8 }], 'pullup'),
    ];
    const s = suggestNext(profile, sessions, 'pullup', true);
    expect(s?.kind).toBe('up');
    expect(s?.w).toBe(12.5);
  });
});

function point(topW: number, topReps: number): ExercisePoint {
  return {
    date: '2026-01-10',
    sessionId: 1,
    best: topW > 0 ? topW * (1 + topReps / 30) : topReps,
    topW,
    topReps,
    volume: topW * topReps,
    avgRpe: 8,
    setCount: 3,
  };
}

function sugg(partial: Partial<NextSuggestion>): NextSuggestion {
  return {
    kind: 'reps',
    w: 80,
    repsMin: 9,
    repsMax: 10,
    sets: 3,
    why: '',
    ...partial,
  };
}

describe('overloadTrack', () => {
  it('situe les reps actuelles dans la fourchette avec la prochaine charge', () => {
    const t = overloadTrack(
      point(80, 8),
      sugg({ kind: 'up', w: 82.5, repsMin: 6, repsMax: 8 }),
      [6, 12],
      false,
    );
    expect(t).toMatchObject({
      lo: 6,
      hi: 12,
      reps: 8,
      current: '80 kg',
      next: '82,5 kg',
      kind: 'up',
    });
  });

  it('décrit un gain de reps à charge constante', () => {
    const t = overloadTrack(point(80, 8), sugg({}), [6, 12], false);
    expect(t.next).toBe('+1-2 reps');
  });

  it('décrit le passage au lest depuis le poids du corps', () => {
    const t = overloadTrack(
      point(0, 12),
      sugg({ kind: 'up', w: 2.5, repsMin: 6, repsMax: 8 }),
      [6, 12],
      true,
    );
    expect(t.current).toBe('PDC');
    expect(t.next).toBe('lest +2,5 kg');
  });

  it('décrit un deload', () => {
    const t = overloadTrack(
      point(80, 8),
      sugg({ kind: 'deload', w: 72.5 }),
      [6, 12],
      false,
    );
    expect(t.next).toBe('72,5 kg deload');
  });
});

describe('targetScore', () => {
  it('renvoie le e1RM cible pour un exercice chargé', () => {
    expect(
      targetScore(sugg({ w: 82.5, repsMin: 6 }), false, false),
    ).toBeCloseTo(99, 0);
  });

  it('renvoie les reps cibles en poids du corps strict', () => {
    expect(targetScore(sugg({ w: 0, repsMin: 13 }), true, true)).toBe(13);
  });

  it('renvoie null quand les échelles changent (PDC → lest)', () => {
    expect(targetScore(sugg({ kind: 'up', w: 2.5 }), true, true)).toBeNull();
  });
});

describe('formatSuggestion', () => {
  it('formate un exercice chargé', () => {
    expect(
      formatSuggestion(
        { kind: 'up', w: 82.5, repsMin: 6, repsMax: 8, sets: 3, why: '' },
        false,
      ),
    ).toBe('82,5 kg × 6-8');
  });

  it('formate un lest et des reps PDC', () => {
    expect(
      formatSuggestion(
        { kind: 'up', w: 5, repsMin: 5, repsMax: 5, sets: 3, why: '' },
        true,
      ),
    ).toBe('+5 kg × 5');
    expect(
      formatSuggestion(
        { kind: 'reps', w: 0, repsMin: 12, repsMax: 13, sets: 3, why: '' },
        true,
      ),
    ).toBe('12-13 reps');
  });
});
