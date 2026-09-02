import { describe, expect, it } from 'vitest';
import type { StrengthSession, TrainingProfile } from '@/types';
import { buildCoachReport, coachTips } from './coach';

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

describe('coachTips — priorisation et regroupement', () => {
  const multiProfile: TrainingProfile = {
    style: 'hypertrophy',
    sessionsPerWeek: 3,
    sessionTemplates: [
      {
        id: 'full',
        name: 'Full',
        exercises: [
          { exerciseId: 'bench', sets: 3, repsMin: 6, repsMax: 12 },
          { exerciseId: 'squat', sets: 3, repsMin: 6, repsMax: 12 },
          { exerciseId: 'row', sets: 3, repsMin: 6, repsMax: 12 },
        ],
      },
    ],
    customExercises: [],
  };
  const resolveMulti = (id: string) => {
    if (id === 'bench') return { name: 'Développé couché', bodyweight: false };
    if (id === 'squat') return { name: 'Squat', bodyweight: false };
    if (id === 'row') return { name: 'Rowing', bodyweight: false };
    return null;
  };
  function full(
    id: number,
    date: string,
    loads: Record<string, { w: number; r: number; rpe?: number }[]>,
  ): StrengthSession {
    return {
      id,
      date,
      label: 'Full',
      templateId: 'full',
      exercises: Object.entries(loads).map(([exerciseId, sets]) => ({
        exerciseId,
        sets,
      })),
    };
  }

  it('regroupe les exercices en progression en un seul conseil', () => {
    const sessions = [
      full(1, '2026-01-10', {
        bench: [{ w: 80, r: 8, rpe: 8.5 }],
        squat: [{ w: 100, r: 8, rpe: 8.5 }],
        row: [{ w: 60, r: 8, rpe: 8.5 }],
      }),
      full(2, '2026-01-13', {
        bench: [{ w: 80, r: 9, rpe: 8.5 }],
        squat: [{ w: 100, r: 9, rpe: 8.5 }],
        row: [{ w: 60, r: 9, rpe: 8.5 }],
      }),
    ];
    // Trois records le même jour : une seule carte « pr » les regroupe.
    const tips = coachTips(multiProfile, sessions, resolveMulti, TODAY);
    const prs = tips.filter((t) => t.kind === 'pr');
    expect(prs).toHaveLength(1);
    expect(prs[0].exerciseName).toBeUndefined();
    expect(prs[0].msg).toContain('3 records');
    expect(prs[0].msg).toContain('Squat');

    // Sans record (retour à un niveau déjà atteint), les « keep » fusionnent.
    const sessions2 = [
      ...sessions,
      full(3, '2026-01-15', {
        bench: [{ w: 80, r: 7, rpe: 8.5 }],
        squat: [{ w: 100, r: 7, rpe: 8.5 }],
        row: [{ w: 60, r: 7, rpe: 8.5 }],
      }),
      full(4, '2026-01-17', {
        bench: [{ w: 80, r: 8, rpe: 8.5 }],
        squat: [{ w: 100, r: 8, rpe: 8.5 }],
        row: [{ w: 60, r: 8, rpe: 8.5 }],
      }),
    ];
    const tips2 = coachTips(
      multiProfile,
      sessions2,
      resolveMulti,
      '2026-01-18',
    );
    const keeps = tips2.filter(
      (t) => t.kind === 'keep' && t.axis === 'performance',
    );
    expect(keeps).toHaveLength(1);
    expect(keeps[0].exerciseName).toBeUndefined();
    expect(keeps[0].msg).toContain('Squat');
    expect(keeps[0].msg).toContain('Rowing');
  });

  it('regroupe trois deloads ou plus en une semaine légère globale', () => {
    const maxed = (id: number, date: string, w: number) =>
      full(id, date, {
        bench: [{ w, r: 8, rpe: 10 }],
        squat: [{ w: w + 20, r: 8, rpe: 10 }],
        row: [{ w: w - 20, r: 8, rpe: 9.5 }],
      });
    const sessions = [maxed(1, '2026-01-10', 80), maxed(2, '2026-01-13', 80)];
    const tips = coachTips(multiProfile, sessions, resolveMulti, TODAY);
    const deloads = tips.filter((t) => t.kind === 'deload');
    expect(deloads).toHaveLength(1);
    expect(deloads[0].exerciseName).toBeUndefined();
    expect(deloads[0].axis).toBe('recovery');
    expect(deloads[0].msg).toContain('3 exercices');
    expect(tips[0]).toBe(deloads[0]);
  });

  it('trie les conseils du plus urgent au plus informatif', () => {
    const sessions = [
      full(1, '2026-01-10', { bench: [{ w: 80, r: 8, rpe: 9 }] }),
      full(2, '2026-01-13', { bench: [{ w: 80, r: 8, rpe: 10 }] }),
    ];
    const tips = coachTips(multiProfile, sessions, resolveMulti, TODAY);
    expect(tips[0].kind).toBe('deload');
    expect(tips[0].priority).toBe(0);
    for (let i = 1; i < tips.length; i++) {
      expect(tips[i].priority).toBeGreaterThanOrEqual(tips[i - 1].priority);
    }
  });

  it('signale un pic de volume par rapport aux semaines précédentes', () => {
    const light = (id: number, date: string) =>
      full(id, date, {
        bench: Array.from({ length: 6 }, () => ({ w: 80, r: 8 })),
      });
    const sessions = [
      light(1, '2025-12-27'),
      light(2, '2026-01-03'),
      full(3, '2026-01-12', {
        bench: Array.from({ length: 8 }, () => ({ w: 80, r: 8 })),
        squat: Array.from({ length: 8 }, () => ({ w: 100, r: 8 })),
      }),
      full(4, '2026-01-13', {
        bench: Array.from({ length: 4 }, () => ({ w: 80, r: 8 })),
      }),
    ];
    const tips = coachTips(multiProfile, sessions, resolveMulti, TODAY);
    const spike = tips.find((t) => t.axis === 'volume' && t.kind === 'warn');
    expect(spike?.msg).toContain('Volume +');
  });

  it('signale une dérive du RPE moyen sans progression', () => {
    const sessions = [
      full(1, '2026-01-06', {
        bench: [
          { w: 80, r: 8, rpe: 7.5 },
          { w: 80, r: 8, rpe: 8 },
        ],
      }),
      full(2, '2026-01-09', {
        bench: [
          { w: 80, r: 8, rpe: 8.5 },
          { w: 80, r: 8, rpe: 8.5 },
        ],
      }),
      full(3, '2026-01-13', {
        bench: [
          { w: 80, r: 8, rpe: 9 },
          { w: 80, r: 8, rpe: 9 },
        ],
      }),
    ];
    const tips = coachTips(multiProfile, sessions, resolveMulti, TODAY);
    const creep = tips.find(
      (t) => t.axis === 'intensity' && t.exerciseName === undefined,
    );
    expect(creep?.kind).toBe('deload');
    expect(creep?.msg).toContain('RPE moyen');
  });

  it('transforme un groupe musculaire sous sa cible en action', () => {
    const profileWithTargets: TrainingProfile = {
      ...multiProfile,
      muscleTargets: { Dos: 'priority', Pecs: 'maintenance' },
    };
    const resolveMuscle = (id: string) =>
      id === 'bench'
        ? 'Pecs'
        : id === 'row'
          ? 'Dos'
          : id === 'squat'
            ? 'Jambes'
            : null;
    const sessions = [
      full(1, '2026-01-12', {
        bench: Array.from({ length: 4 }, () => ({ w: 80, r: 8 })),
        row: Array.from({ length: 3 }, () => ({ w: 60, r: 8 })),
      }),
    ];
    const tips = coachTips(profileWithTargets, sessions, resolveMulti, TODAY, {
      resolveMuscle,
    });
    const dos = tips.find((t) => t.exerciseName === 'Dos');
    expect(dos?.axis).toBe('volume');
    expect(dos?.priority).toBe(0);
    expect(dos?.msg).toContain('3/12-20');
    // Pecs 4/3-5 : dans la cible, aucun conseil.
    expect(tips.some((t) => t.exerciseName === 'Pecs')).toBe(false);
  });

  it('ne signale pas le volume par muscle sans séance sur 7 jours', () => {
    const profileWithTargets: TrainingProfile = {
      ...multiProfile,
      muscleTargets: { Dos: 'priority' },
    };
    const sessions = [full(1, '2025-12-01', { row: [{ w: 60, r: 8 }] })];
    const tips = coachTips(profileWithTargets, sessions, resolveMulti, TODAY, {
      resolveMuscle: () => 'Dos',
    });
    expect(tips.some((t) => t.axis === 'volume')).toBe(false);
  });
});

describe('buildCoachReport', () => {
  it('renvoie le verdict, les conseils triés et les fenêtres de charge', () => {
    const sessions = [
      session(1, '2026-01-06', [{ w: 80, r: 8, rpe: 8 }]),
      session(2, '2026-01-09', [{ w: 82.5, r: 8, rpe: 8 }]),
      session(3, '2026-01-13', [{ w: 85, r: 8, rpe: 8 }]),
    ];
    const report = buildCoachReport(
      profile,
      sessions,
      resolve,
      () => 'Pecs',
      TODAY,
    );
    expect(report.windows).toHaveLength(8);
    expect(report.status.kind).toBe('progressing');
    expect(report.tips.some((t) => t.kind === 'pr')).toBe(true);
  });
});
