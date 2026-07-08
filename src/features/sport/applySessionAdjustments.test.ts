import { describe, expect, it } from 'vitest';
import type { AiSessionAnalysisResult } from '@/features/ai/types';
import type { SessionTemplate, TrainingProfile } from '@/types';
import {
  applySessionAdjustments,
  buildAdjustmentPreview,
} from './applySessionAdjustments';

const resolve = (id: string) =>
  id === 'dips'
    ? { name: 'Dips', bodyweight: true }
    : id === 'bench'
      ? { name: 'Développé couché', bodyweight: false }
      : null;

const template: SessionTemplate = {
  id: 'upper',
  name: 'Upper A',
  exercises: [
    { exerciseId: 'dips', sets: 4, repsMin: 8, repsMax: 10 },
    { exerciseId: 'bench', sets: 3, repsMin: 6, repsMax: 8 },
  ],
};

const profile: TrainingProfile = {
  style: 'hypertrophy',
  sessionsPerWeek: 3,
  sessionTemplates: [
    template,
    {
      id: 'lower',
      name: 'Lower A',
      exercises: [{ exerciseId: 'squat', sets: 5, repsMin: 5, repsMax: 5 }],
    },
  ],
  customExercises: [],
};

describe('buildAdjustmentPreview', () => {
  it('associe les ajustements IA aux exercices planifiés par nom exact', () => {
    const result: AiSessionAnalysisResult = {
      resume: 'Bonne séance',
      ajustements: [
        {
          exercice: 'Dips',
          sets: 4,
          repsMin: 9,
          repsMax: 11,
          poids: 12.5,
          note: 'RPE bas, monte le lest',
        },
      ],
    };
    const rows = buildAdjustmentPreview(template, result, resolve);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      exerciseId: 'dips',
      name: 'Dips',
      before: { sets: 4, repsMin: 8, repsMax: 10 },
      after: { sets: 4, repsMin: 9, repsMax: 11, weight: 12.5 },
      note: 'RPE bas, monte le lest',
    });
  });

  it('ignore un ajustement dont le nom ne correspond à aucun exercice planifié', () => {
    const result: AiSessionAnalysisResult = {
      resume: '',
      ajustements: [
        {
          exercice: 'Exercice inventé',
          sets: 3,
          repsMin: 8,
          repsMax: 10,
          poids: 20,
          note: '',
        },
      ],
    };
    expect(buildAdjustmentPreview(template, result, resolve)).toEqual([]);
  });
});

describe('applySessionAdjustments', () => {
  it('met à jour uniquement les exercices ajustés de la séance type ciblée', () => {
    const rows = buildAdjustmentPreview(
      template,
      {
        resume: '',
        ajustements: [
          {
            exercice: 'Dips',
            sets: 4,
            repsMin: 9,
            repsMax: 11,
            poids: 12.5,
            note: 'note',
          },
        ],
      },
      resolve,
    );
    const updated = applySessionAdjustments(profile, 'upper', 42, rows);

    const upper = updated.sessionTemplates.find((t) => t.id === 'upper')!;
    const dips = upper.exercises.find((e) => e.exerciseId === 'dips')!;
    expect(dips).toMatchObject({
      sets: 4,
      repsMin: 9,
      repsMax: 11,
      aiTargetWeight: 12.5,
      aiTargetSourceSessionId: 42,
    });

    // Développé couché n'était pas dans les ajustements : inchangé
    const bench = upper.exercises.find((e) => e.exerciseId === 'bench')!;
    expect(bench).toEqual(template.exercises[1]);

    // La séance type Lower A n'est pas touchée
    const lower = updated.sessionTemplates.find((t) => t.id === 'lower')!;
    expect(lower).toEqual(profile.sessionTemplates[1]);
  });

  it("ne modifie rien si l'id de séance type est inconnu", () => {
    const updated = applySessionAdjustments(profile, 'inexistant', 1, [
      {
        exerciseId: 'dips',
        name: 'Dips',
        before: { sets: 4, repsMin: 8, repsMax: 10 },
        after: { sets: 5, repsMin: 8, repsMax: 10, weight: 10 },
        note: '',
      },
    ]);
    expect(updated).toEqual(profile);
  });
});
