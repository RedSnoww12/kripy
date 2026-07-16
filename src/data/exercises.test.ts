import { describe, expect, it } from 'vitest';
import type { TrainingProfile } from '@/types';
import {
  allTemplateExerciseIds,
  defaultPlannedExercise,
  repRangeFor,
  sortByPriority,
  targetSetsFor,
} from './exercises';

const profile: Pick<TrainingProfile, 'style' | 'sessionTemplates'> = {
  style: 'hypertrophy', // fourchette par défaut 6-12
  sessionTemplates: [
    {
      id: 'upper',
      name: 'Upper A',
      exercises: [
        { exerciseId: 'dips', sets: 4, repsMin: 8, repsMax: 10 },
        { exerciseId: 'pullup', sets: 3, repsMin: 6, repsMax: 8 },
      ],
    },
    {
      id: 'lower',
      name: 'Lower A',
      exercises: [{ exerciseId: 'squat', sets: 5, repsMin: 5, repsMax: 5 }],
    },
  ],
};

describe('repRangeFor', () => {
  it('renvoie la fourchette planifiée quand l’exercice a une séance type', () => {
    expect(repRangeFor(profile, 'dips')).toEqual([8, 10]);
    expect(repRangeFor(profile, 'squat')).toEqual([5, 5]);
  });

  it('retombe sur la fourchette du style si l’exercice n’est planifié nulle part', () => {
    expect(repRangeFor(profile, 'curl')).toEqual([6, 12]);
  });

  it('retombe sur le style quand aucune séance type n’existe', () => {
    expect(
      repRangeFor({ style: 'strength', sessionTemplates: [] }, 'bench'),
    ).toEqual([3, 6]);
  });
});

describe('targetSetsFor', () => {
  it('renvoie le nombre de séries planifié', () => {
    expect(targetSetsFor(profile, 'pullup')).toBe(3);
  });

  it('renvoie null si l’exercice n’est dans aucune séance type', () => {
    expect(targetSetsFor(profile, 'curl')).toBeNull();
  });
});

describe('allTemplateExerciseIds', () => {
  it('renvoie les ids uniques de tous les exercices planifiés', () => {
    const ids = allTemplateExerciseIds(profile);
    expect(ids.sort()).toEqual(['dips', 'pullup', 'squat']);
  });

  it('renvoie un tableau vide sans séance type', () => {
    expect(allTemplateExerciseIds({ sessionTemplates: [] })).toEqual([]);
  });
});

describe('defaultPlannedExercise', () => {
  it('utilise 3 séries et la fourchette du style par défaut', () => {
    expect(defaultPlannedExercise('bench', 'strength')).toEqual({
      exerciseId: 'bench',
      sets: 3,
      repsMin: 3,
      repsMax: 6,
    });
  });
});

describe('sortByPriority', () => {
  it('place les exercices prioritaires en premier', () => {
    const items = [
      { exerciseId: 'dips', priority: false },
      { exerciseId: 'pullup', priority: true },
      { exerciseId: 'squat', priority: false },
    ];
    expect(sortByPriority(items).map((e) => e.exerciseId)).toEqual([
      'pullup',
      'dips',
      'squat',
    ]);
  });

  it('conserve l’ordre relatif au sein de chaque groupe (tri stable)', () => {
    const items = [
      { exerciseId: 'a', priority: true },
      { exerciseId: 'b', priority: false },
      { exerciseId: 'c', priority: true },
      { exerciseId: 'd', priority: false },
    ];
    expect(sortByPriority(items).map((e) => e.exerciseId)).toEqual([
      'a',
      'c',
      'b',
      'd',
    ]);
  });

  it('ne modifie rien sans exercice prioritaire', () => {
    const items = [
      { exerciseId: 'a' },
      { exerciseId: 'b', priority: false },
      { exerciseId: 'c' },
    ];
    expect(sortByPriority(items).map((e) => e.exerciseId)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });
});
