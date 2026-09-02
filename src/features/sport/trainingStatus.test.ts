import { describe, expect, it } from 'vitest';
import { assessTraining, type ExerciseTrendInput } from './trainingStatus';
import type { LoadWindow } from './weeklyLoad';

function win(index: number, patch: Partial<LoadWindow> = {}): LoadWindow {
  return {
    index,
    start: `2026-03-${String(20 - index * 7 - 6).padStart(2, '0')}`,
    end: `2026-03-${String(20 - index * 7).padStart(2, '0')}`,
    sessions: 3,
    sets: 30,
    hardSets: 12,
    ratedSets: 30,
    reps: 240,
    tonnage: 12_000,
    avgRpe: 8,
    durationMin: 180,
    exercises: 6,
    prCount: 0,
    ...patch,
  };
}

function exo(
  name: string,
  trend: ExerciseTrendInput['trend'],
  extra: Partial<ExerciseTrendInput> = {},
): ExerciseTrendInput {
  return { name, trend, stagnant: false, isPR: false, ...extra };
}

const base = { sessionsPerWeek: 3, recentFeels: [3, 4] };

describe('assessTraining', () => {
  it('refuse de juger avec moins de 3 séances ou une seule semaine active', () => {
    const status = assessTraining({
      ...base,
      windows: [
        win(1, { sessions: 0, sets: 0 }),
        win(0, { sessions: 2, sets: 10 }),
      ],
      exercises: [],
    });
    expect(status.kind).toBe('insufficient');
    expect(status.axes).toHaveLength(3);
    expect(status.axes[0].value).toBe('10');
  });

  it('signale la fatigue quand le RPE moyen dérive sans progression', () => {
    const status = assessTraining({
      ...base,
      windows: [win(1, { avgRpe: 8 }), win(0, { avgRpe: 8.8 })],
      exercises: [exo('Squat', 'flat'), exo('Bench', 'down')],
    });
    expect(status.kind).toBe('fatigue');
    expect(status.axes[1].deltaLabel).toBe('+0,8');
  });

  it('ne parle pas de fatigue si le RPE monte mais que ça progresse', () => {
    const status = assessTraining({
      ...base,
      windows: [win(1, { avgRpe: 8 }), win(0, { avgRpe: 8.8, prCount: 1 })],
      exercises: [exo('Squat', 'up', { isPR: true })],
    });
    expect(status.kind).toBe('progressing');
  });

  it('signale la fatigue sur ressenti bas répété', () => {
    const status = assessTraining({
      ...base,
      recentFeels: [2, 1],
      windows: [win(1), win(0)],
      exercises: [exo('Squat', 'up')],
    });
    expect(status.kind).toBe('fatigue');
  });

  it('détecte un pic de volume vs la moyenne des semaines précédentes', () => {
    const status = assessTraining({
      ...base,
      windows: [
        win(2, { sets: 20 }),
        win(1, { sets: 20 }),
        win(0, { sets: 32 }),
      ],
      exercises: [exo('Squat', 'flat')],
    });
    expect(status.kind).toBe('spike');
    expect(status.axes[0].tone).toBe('warn');
    expect(status.axes[0].deltaLabel).toBe('+60 %');
  });

  it('détecte une semaine trop légère quand l’objectif de séances n’est pas tenu', () => {
    const status = assessTraining({
      ...base,
      windows: [win(1, { sets: 30 }), win(0, { sets: 12, sessions: 1 })],
      exercises: [exo('Squat', 'flat')],
    });
    expect(status.kind).toBe('low_volume');
  });

  it('accepte une semaine légère si toutes les séances prévues sont faites', () => {
    const status = assessTraining({
      ...base,
      windows: [win(1, { sets: 30 }), win(0, { sets: 15, sessions: 3 })],
      exercises: [exo('Squat', 'flat'), exo('Bench', 'flat')],
    });
    expect(status.kind).not.toBe('low_volume');
  });

  it('conclut à la progression quand plus d’exercices montent que baissent', () => {
    const status = assessTraining({
      ...base,
      windows: [win(1), win(0)],
      exercises: [exo('Squat', 'up'), exo('Bench', 'up'), exo('Row', 'down')],
    });
    expect(status.kind).toBe('progressing');
    expect(status.axes[2].value).toBe('2/3');
    expect(status.axes[2].tone).toBe('good');
  });

  it('conclut à un palier quand la majorité stagne et rien ne monte', () => {
    const status = assessTraining({
      ...base,
      windows: [win(1), win(0)],
      exercises: [
        exo('Squat', 'flat', { stagnant: true }),
        exo('Bench', 'flat', { stagnant: true }),
        exo('Row', 'flat'),
      ],
    });
    expect(status.kind).toBe('stalled');
  });

  it('sinon, stable', () => {
    const status = assessTraining({
      ...base,
      windows: [win(1), win(0)],
      exercises: [exo('Squat', 'flat'), exo('Bench', 'up'), exo('Row', 'down')],
    });
    expect(status.kind).toBe('steady');
  });

  it('ne compte pas « en hausse » un exercice figé sur ses 3 dernières séances', () => {
    const status = assessTraining({
      ...base,
      windows: [win(1, { avgRpe: 9.5 }), win(0, { avgRpe: 9.7 })],
      exercises: [
        exo('Squat', 'up', { stagnant: true }),
        exo('Bench', 'up', { stagnant: true }),
      ],
    });
    expect(status.kind).toBe('fatigue');
    expect(status.axes[2].value).toBe('0/2');
  });

  it('deux exercices en hausse sur dix ne masquent pas une semaine à l’échec', () => {
    const status = assessTraining({
      ...base,
      windows: [win(1, { avgRpe: 9.6 }), win(0, { avgRpe: 9.9 })],
      exercises: [
        exo('A', 'up'),
        exo('B', 'up'),
        ...['C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].map((n) =>
          exo(n, 'flat', { stagnant: true }),
        ),
      ],
    });
    expect(status.kind).toBe('fatigue');
  });

  it('juge l’intensité très élevée sans progression comme de la fatigue', () => {
    const status = assessTraining({
      ...base,
      windows: [win(1, { avgRpe: 9.1 }), win(0, { avgRpe: 9.2 })],
      exercises: [exo('Squat', 'flat'), exo('Bench', 'flat')],
    });
    expect(status.kind).toBe('fatigue');
    expect(status.axes[1].tone).toBe('warn');
  });

  it('décrit l’axe volume en reps pour du poids du corps strict', () => {
    const status = assessTraining({
      ...base,
      windows: [win(1, { tonnage: 0 }), win(0, { tonnage: 0, reps: 180 })],
      exercises: [exo('Tractions', 'up')],
    });
    expect(status.axes[0].hint).toContain('180 reps');
  });
});
