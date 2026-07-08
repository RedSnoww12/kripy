import { describe, expect, it } from 'vitest';
import type { SessionTemplate, StrengthSession } from '@/types';
import { buildSessionAdjustContext } from './sessionAdjustContext';

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

function session(
  id: number,
  date: string,
  exercises: StrengthSession['exercises'],
  extra?: Partial<StrengthSession>,
): StrengthSession {
  return {
    id,
    date,
    label: 'Upper A',
    templateId: 'upper',
    exercises,
    ...extra,
  };
}

describe('buildSessionAdjustContext', () => {
  it('inclut la cible actuelle, le réalisé de la séance et un court historique', () => {
    const prior = session(1, '2026-01-07', [
      { exerciseId: 'dips', sets: [{ w: 10, r: 8, rpe: 8 }] },
    ]);
    const finished = session(
      2,
      '2026-01-10',
      [{ exerciseId: 'dips', sets: [{ w: 12.5, r: 9, rpe: 8.5 }] }],
      { feel: 4, dur: 58, notes: 'bonne séance' },
    );
    const ctx = buildSessionAdjustContext(
      finished,
      template,
      [prior, finished],
      resolve,
    );
    expect(ctx.seance).toMatchObject({
      nom: 'Upper A',
      ressenti: 4,
      dureeMin: 58,
      notes: 'bonne séance',
    });
    const exos = ctx.exercices as Array<Record<string, unknown>>;
    const dips = exos.find((e) => e.nom === 'Dips')!;
    expect(dips.cibleActuelle).toEqual({ sets: 4, repsMin: 8, repsMax: 10 });
    expect(dips.realiseCetteSeance).toEqual(['12.5kg×9@RPE8.5']);
    expect(dips.historiquePrecedent).toEqual([
      { date: '2026-01-07', meilleurSet: '10kg×8', rpeMoyen: 8 },
    ]);
  });

  it('marque à null les exercices planifiés mais non faits cette séance', () => {
    const finished = session(1, '2026-01-10', [
      { exerciseId: 'dips', sets: [{ w: 10, r: 9, rpe: 8 }] },
    ]);
    const ctx = buildSessionAdjustContext(
      finished,
      template,
      [finished],
      resolve,
    );
    const exos = ctx.exercices as Array<Record<string, unknown>>;
    const bench = exos.find((e) => e.nom === 'Développé couché')!;
    expect(bench.realiseCetteSeance).toBeNull();
  });

  it('ignore un exercice planifié dont le résolveur ne connaît plus la définition', () => {
    const unknownTemplate: SessionTemplate = {
      id: 'ghost',
      name: 'Séance fantôme',
      exercises: [{ exerciseId: 'inconnu', sets: 3, repsMin: 8, repsMax: 10 }],
    };
    const finished = session(1, '2026-01-10', []);
    const ctx = buildSessionAdjustContext(
      finished,
      unknownTemplate,
      [finished],
      resolve,
    );
    expect(ctx.exercices).toEqual([]);
  });
});
