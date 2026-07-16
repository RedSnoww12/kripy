import { describe, expect, it } from 'vitest';
import type { StrengthSession, TrainingProfile } from '@/types';
import { coachTips } from './coach';

const TODAY = '2026-01-14';

const profile: TrainingProfile = {
  style: 'hypertrophy',
  sessionsPerWeek: 3,
  sessionTemplates: [
    {
      id: 'push',
      name: 'Push',
      exercises: [{ exerciseId: 'bench', sets: 3, repsMin: 6, repsMax: 12 }],
    },
  ],
  customExercises: [],
};

const resolve = (id: string) =>
  id === 'bench' ? { name: 'Développé couché', bodyweight: false } : null;

function session(
  id: number,
  date: string,
  sets: { w: number; r: number; rpe?: number }[],
  feel?: number,
): StrengthSession {
  return {
    id,
    date,
    label: 'Push',
    exercises: [{ exerciseId: 'bench', sets }],
    feel,
  };
}

describe('coachTips', () => {
  it('suggests adding load when RPE is low', () => {
    const sessions = [
      session(1, '2026-01-10', [{ w: 80, r: 8, rpe: 8 }]),
      session(2, '2026-01-13', [{ w: 80, r: 8, rpe: 7 }]),
    ];
    const tips = coachTips(profile, sessions, resolve, TODAY);
    const tip = tips.find((t) => t.exerciseName === 'Développé couché');
    expect(tip?.kind).toBe('up');
  });

  it('suggests a deload when RPE is maxed without progress', () => {
    const sessions = [
      session(1, '2026-01-10', [{ w: 80, r: 8, rpe: 9 }]),
      session(2, '2026-01-13', [{ w: 80, r: 8, rpe: 10 }]),
    ];
    const tips = coachTips(profile, sessions, resolve, TODAY);
    const tip = tips.find((t) => t.exerciseName === 'Développé couché');
    expect(tip?.kind).toBe('deload');
  });

  it('celebrates a PR', () => {
    const sessions = [
      session(1, '2026-01-10', [{ w: 80, r: 8, rpe: 8 }]),
      session(2, '2026-01-13', [{ w: 85, r: 8, rpe: 8.5 }]),
    ];
    const tips = coachTips(profile, sessions, resolve, TODAY);
    const tip = tips.find((t) => t.exerciseName === 'Développé couché');
    expect(tip?.kind).toBe('pr');
  });

  it('flags stagnation after three flat sessions', () => {
    const sessions = [
      session(1, '2026-01-08', [{ w: 80, r: 8, rpe: 8.5 }]),
      session(2, '2026-01-11', [{ w: 80, r: 8, rpe: 8.5 }]),
      session(3, '2026-01-13', [{ w: 80, r: 8, rpe: 8.5 }]),
    ];
    const tips = coachTips(profile, sessions, resolve, TODAY);
    const tip = tips.find((t) => t.exerciseName === 'Développé couché');
    expect(tip?.kind).toBe('info');
    expect(tip?.msg).toContain('sans progression');
  });

  it('reports weekly adherence progress', () => {
    const sessions = [session(1, '2026-01-13', [{ w: 80, r: 8 }])];
    const tips = coachTips(profile, sessions, resolve, TODAY);
    expect(tips.some((t) => t.msg.includes('1/3'))).toBe(true);
  });

  it('congratulates when the weekly target is hit', () => {
    const sessions = [
      session(1, '2026-01-09', [{ w: 80, r: 8 }]),
      session(2, '2026-01-11', [{ w: 80, r: 8 }]),
      session(3, '2026-01-13', [{ w: 82.5, r: 8 }]),
    ];
    const tips = coachTips(profile, sessions, resolve, TODAY);
    expect(tips.some((t) => t.msg.includes('3/3'))).toBe(true);
  });

  it('suggests recovery when feel is consistently low', () => {
    const sessions = [
      session(1, '2026-01-10', [{ w: 80, r: 8 }], 1),
      session(2, '2026-01-13', [{ w: 80, r: 8 }], 2),
    ];
    const tips = coachTips(profile, sessions, resolve, TODAY);
    expect(tips.some((t) => t.msg.includes('Ressenti'))).toBe(true);
  });

  it('returns no exercise tip with fewer than two data points', () => {
    const sessions = [session(1, '2026-01-13', [{ w: 80, r: 8 }])];
    const tips = coachTips(profile, sessions, resolve, TODAY);
    expect(tips.every((t) => t.exerciseName === undefined)).toBe(true);
  });
});

describe('coachTips — adhérence aux exercices prioritaires', () => {
  const priorityProfile: TrainingProfile = {
    style: 'hypertrophy',
    sessionsPerWeek: 3,
    sessionTemplates: [
      {
        id: 'upper',
        name: 'Upper A',
        exercises: [
          {
            exerciseId: 'pullup',
            sets: 5,
            repsMin: 6,
            repsMax: 8,
            priority: true,
          },
          { exerciseId: 'bench', sets: 3, repsMin: 6, repsMax: 12 },
        ],
      },
    ],
    customExercises: [],
  };

  const resolvePriority = (id: string) => {
    if (id === 'pullup') return { name: 'Tractions', bodyweight: true };
    if (id === 'bench') return { name: 'Développé couché', bodyweight: false };
    return null;
  };

  function upperSession(
    id: number,
    date: string,
    pullupSets: number,
  ): StrengthSession {
    return {
      id,
      date,
      label: 'Upper A',
      templateId: 'upper',
      exercises: [
        {
          exerciseId: 'pullup',
          sets: Array.from({ length: pullupSets }, () => ({ w: 0, r: 6 })),
        },
        { exerciseId: 'bench', sets: [{ w: 80, r: 8 }] },
      ],
    };
  }

  it('signale un exercice prioritaire sous sa cible de séries à la dernière séance', () => {
    const sessions = [upperSession(1, '2026-01-13', 3)];
    const tips = coachTips(priorityProfile, sessions, resolvePriority, TODAY);
    const tip = tips.find((t) => t.kind === 'priority');
    expect(tip).toBeDefined();
    expect(tip?.exerciseName).toBe('Tractions');
    expect(tip?.msg).toContain('3/5');
    expect(tip?.msg).toContain('Upper A');
  });

  it('ne signale rien quand la cible prioritaire est atteinte', () => {
    const sessions = [upperSession(1, '2026-01-13', 5)];
    const tips = coachTips(priorityProfile, sessions, resolvePriority, TODAY);
    expect(tips.some((t) => t.kind === 'priority')).toBe(false);
  });

  it('signale un exercice prioritaire totalement absent de la dernière séance', () => {
    const sessions: StrengthSession[] = [
      {
        id: 1,
        date: '2026-01-13',
        label: 'Upper A',
        templateId: 'upper',
        exercises: [{ exerciseId: 'bench', sets: [{ w: 80, r: 8 }] }],
      },
    ];
    const tips = coachTips(priorityProfile, sessions, resolvePriority, TODAY);
    const tip = tips.find((t) => t.kind === 'priority');
    expect(tip).toBeDefined();
    expect(tip?.msg).toContain('pas fait');
  });

  it('ne signale rien pour les exercices non prioritaires sous leur cible', () => {
    const sessions: StrengthSession[] = [
      {
        id: 1,
        date: '2026-01-13',
        label: 'Upper A',
        templateId: 'upper',
        exercises: [
          {
            exerciseId: 'pullup',
            sets: Array.from({ length: 5 }, () => ({ w: 0, r: 6 })),
          },
          { exerciseId: 'bench', sets: [{ w: 80, r: 8 }] },
        ],
      },
    ];
    const tips = coachTips(priorityProfile, sessions, resolvePriority, TODAY);
    expect(tips.some((t) => t.kind === 'priority')).toBe(false);
  });

  it('ne signale rien sans historique pour cette séance type', () => {
    const tips = coachTips(priorityProfile, [], resolvePriority, TODAY);
    expect(tips.some((t) => t.kind === 'priority')).toBe(false);
  });
});
