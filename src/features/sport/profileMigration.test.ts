import { describe, expect, it } from 'vitest';
import { normalizeProfile } from './profileMigration';

describe('normalizeProfile', () => {
  it('migre un ancien profil (split + trackedExercises) vers une séance type', () => {
    const legacy = {
      style: 'streetlifting',
      split: 'ppl',
      sessionsPerWeek: 4,
      trackedExercises: ['pullup', 'dips', 'squat'],
      customExercises: [],
    };
    const p = normalizeProfile(legacy);
    expect(p).not.toBeNull();
    expect(p?.style).toBe('streetlifting');
    expect(p?.sessionsPerWeek).toBe(4);
    expect(p?.sessionTemplates).toHaveLength(1);
    expect(p?.sessionTemplates[0].name).toBe('Séance A');
    expect(p?.sessionTemplates[0].exercises.map((e) => e.exerciseId)).toEqual([
      'pullup',
      'dips',
      'squat',
    ]);
    // fourchette du style street lifting (3-8)
    expect(p?.sessionTemplates[0].exercises[0]).toMatchObject({
      sets: 3,
      repsMin: 3,
      repsMax: 8,
    });
  });

  it('conserve les exercices perso pendant la migration', () => {
    const legacy = {
      style: 'hypertrophy',
      split: 'free',
      sessionsPerWeek: 3,
      trackedExercises: ['custom_1'],
      customExercises: [{ id: 'custom_1', name: 'Planche', bodyweight: true }],
    };
    const p = normalizeProfile(legacy);
    expect(p?.customExercises).toEqual([
      { id: 'custom_1', name: 'Planche', bodyweight: true },
    ]);
    expect(p?.sessionTemplates[0].exercises[0].exerciseId).toBe('custom_1');
  });

  it('laisse passer un profil au format actuel sans le modifier', () => {
    const current = {
      style: 'strength',
      sessionsPerWeek: 2,
      sessionTemplates: [
        {
          id: 'upper',
          name: 'Upper A',
          exercises: [{ exerciseId: 'dips', sets: 4, repsMin: 8, repsMax: 10 }],
        },
      ],
      customExercises: [],
    };
    expect(normalizeProfile(current)).toEqual(current);
  });

  it('migre un ancien profil sans exercice vers zéro séance type', () => {
    const p = normalizeProfile({
      style: 'general',
      split: 'fullbody',
      sessionsPerWeek: 2,
      trackedExercises: [],
      customExercises: [],
    });
    expect(p?.sessionTemplates).toEqual([]);
  });

  it('répare les champs invalides ou manquants', () => {
    const p = normalizeProfile({
      style: 'nimporte-quoi',
      sessionsPerWeek: 99,
      sessionTemplates: [
        { id: 42, name: '', exercises: [{ exerciseId: 'squat' }, null, 'x'] },
        'garbage',
      ],
      customExercises: 'garbage',
    });
    expect(p?.style).toBe('hypertrophy');
    expect(p?.sessionsPerWeek).toBe(7);
    expect(p?.customExercises).toEqual([]);
    // l'entrée « garbage » est éliminée, le template partiel est réparé
    expect(p?.sessionTemplates).toHaveLength(1);
    expect(p?.sessionTemplates[0].name).toBe('Séance 1');
    expect(p?.sessionTemplates[0].exercises).toEqual([
      { exerciseId: 'squat', sets: 3, repsMin: 6, repsMax: 12 },
    ]);
  });

  it('renvoie null pour une donnée inexploitable', () => {
    expect(normalizeProfile(null)).toBeNull();
    expect(normalizeProfile(undefined)).toBeNull();
    expect(normalizeProfile('string')).toBeNull();
    expect(normalizeProfile(42)).toBeNull();
  });

  it('conserve le flag priority', () => {
    const current = {
      style: 'strength',
      sessionsPerWeek: 2,
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
            { exerciseId: 'dips', sets: 3, repsMin: 8, repsMax: 10 },
          ],
        },
      ],
      customExercises: [],
    };
    const p = normalizeProfile(current);
    expect(p?.sessionTemplates[0].exercises[0].priority).toBe(true);
    expect(p?.sessionTemplates[0].exercises[1].priority).toBeUndefined();
  });

  it('conserve aiTargetWeight/aiTargetSourceSessionId à travers la normalisation', () => {
    const current = {
      style: 'hypertrophy',
      sessionsPerWeek: 3,
      sessionTemplates: [
        {
          id: 'upper',
          name: 'Upper A',
          exercises: [
            {
              exerciseId: 'bench',
              sets: 4,
              repsMin: 6,
              repsMax: 10,
              aiTargetWeight: 82.5,
              aiTargetSourceSessionId: 12345,
            },
          ],
        },
      ],
      customExercises: [],
    };
    const p = normalizeProfile(current);
    expect(p?.sessionTemplates[0].exercises[0]).toMatchObject({
      aiTargetWeight: 82.5,
      aiTargetSourceSessionId: 12345,
    });
  });

  it("n'ajoute pas aiTargetSourceSessionId sans aiTargetWeight valide", () => {
    const current = {
      style: 'hypertrophy',
      sessionsPerWeek: 3,
      sessionTemplates: [
        {
          id: 'upper',
          name: 'Upper A',
          exercises: [
            {
              exerciseId: 'bench',
              sets: 4,
              repsMin: 6,
              repsMax: 10,
              aiTargetSourceSessionId: 12345,
            },
          ],
        },
      ],
      customExercises: [],
    };
    const p = normalizeProfile(current);
    expect(
      p?.sessionTemplates[0].exercises[0].aiTargetSourceSessionId,
    ).toBeUndefined();
  });
});
