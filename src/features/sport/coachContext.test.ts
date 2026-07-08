import { describe, expect, it } from 'vitest';
import type { StrengthSession, TrainingProfile } from '@/types';
import { buildCoachContext } from './coachContext';

const resolve = (id: string) =>
  id === 'dips'
    ? { name: 'Dips', bodyweight: true }
    : id === 'bench'
      ? { name: 'Développé couché', bodyweight: false }
      : null;

const profile: TrainingProfile = {
  style: 'hypertrophy',
  sessionsPerWeek: 3,
  sessionTemplates: [
    {
      id: 'upper',
      name: 'Upper A',
      exercises: [
        { exerciseId: 'dips', sets: 4, repsMin: 8, repsMax: 10 },
        { exerciseId: 'bench', sets: 3, repsMin: 6, repsMax: 8 },
      ],
    },
  ],
  customExercises: [],
};

function session(
  id: number,
  date: string,
  templateId: string,
  label: string,
  exercises: StrengthSession['exercises'],
  feel?: number,
): StrengthSession {
  return { id, date, label, templateId, exercises, feel };
}

describe('buildCoachContext', () => {
  it('inclut le programme avec cible planifiée et dernière réalisation par exercice', () => {
    const sessions = [
      session(1, '2026-01-10', 'upper', 'Upper A', [
        { exerciseId: 'dips', sets: [{ w: 10, r: 9, rpe: 8 }] },
      ]),
    ];
    const ctx = buildCoachContext(profile, sessions, resolve, '2026-01-14');
    const programme = ctx.programme as Array<Record<string, unknown>>;
    expect(programme).toHaveLength(1);
    expect(programme[0]).toMatchObject({
      nom: 'Upper A',
      derniereRealisation: '2026-01-10',
    });
    const exos = programme[0].exercices as Array<Record<string, unknown>>;
    expect(exos[0]).toMatchObject({
      nom: 'Dips',
      seriesCibles: 4,
      repsCibles: '8-10',
      seriesReellesDerniereSeance: ['10kg×9@RPE8'],
    });
    // Développé couché planifié mais pas fait lors de la dernière séance
    expect(exos[1]).toMatchObject({
      nom: 'Développé couché',
      seriesReellesDerniereSeance: null,
    });
  });

  it('ne référence aucune séance sans historique', () => {
    const ctx = buildCoachContext(profile, [], resolve, '2026-01-14');
    const programme = ctx.programme as Array<Record<string, unknown>>;
    expect(programme[0].derniereRealisation).toBeNull();
    const exos = programme[0].exercices as Array<Record<string, unknown>>;
    expect(exos[0].seriesReellesDerniereSeance).toBeNull();
  });

  it('ne met plus le nom du split dans profil (remplacé par programme)', () => {
    const ctx = buildCoachContext(profile, [], resolve, '2026-01-14');
    const profil = ctx.profil as Record<string, unknown>;
    expect(profil.seancesTypes).toBeUndefined();
    expect(profil.repsCibles).toBe('6-12');
  });

  it('formate un set au poids du corps strict sans "kg"', () => {
    const sessions = [
      session(1, '2026-01-10', 'upper', 'Upper A', [
        { exerciseId: 'dips', sets: [{ w: 0, r: 12 }] },
      ]),
    ];
    const ctx = buildCoachContext(profile, sessions, resolve, '2026-01-14');
    const programme = ctx.programme as Array<Record<string, unknown>>;
    const exos = programme[0].exercices as Array<Record<string, unknown>>;
    expect(exos[0].seriesReellesDerniereSeance).toEqual(['12reps']);
  });
});
