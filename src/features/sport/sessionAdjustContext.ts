import type { SessionTemplate, StrengthSession, StrengthSet } from '@/types';
import type { ExerciseResolver } from './coach';
import { exerciseHistory } from './progression';

const HISTORY_POINTS = 4;

function formatSet(s: StrengthSet): string {
  const load = s.w > 0 ? `${s.w}kg` : 'PDC';
  return s.rpe ? `${load}×${s.r}@RPE${s.rpe}` : `${load}×${s.r}`;
}

/**
 * Construit le résumé (sérialisable en JSON) envoyé à l'IA pour ajuster les
 * objectifs de LA séance qui vient d'être terminée : cible actuelle,
 * réalisé exact (série par série) et bref historique, par exercice planifié
 * de cette séance type.
 */
export function buildSessionAdjustContext(
  session: StrengthSession,
  template: SessionTemplate,
  allSessions: StrengthSession[],
  resolve: ExerciseResolver,
): Record<string, unknown> {
  const exercices = template.exercises.flatMap((pe) => {
    const def = resolve(pe.exerciseId);
    if (!def) return [];
    const done = session.exercises.find((e) => e.exerciseId === pe.exerciseId);
    const history = exerciseHistory(allSessions, pe.exerciseId, def.bodyweight)
      .filter((p) => p.sessionId !== session.id)
      .slice(-HISTORY_POINTS)
      .map((p) => ({
        date: p.date,
        meilleurSet:
          p.topW > 0 ? `${p.topW}kg×${p.topReps}` : `${p.topReps}reps`,
        rpeMoyen: p.avgRpe,
      }));

    return [
      {
        nom: def.name,
        poidsDuCorps: def.bodyweight,
        cibleActuelle: {
          sets: pe.sets,
          repsMin: pe.repsMin,
          repsMax: pe.repsMax,
        },
        realiseCetteSeance: done ? done.sets.map(formatSet) : null,
        historiquePrecedent: history,
      },
    ];
  });

  return {
    seance: {
      nom: template.name,
      ressenti: session.feel ?? null,
      dureeMin: session.dur ?? null,
      notes: session.notes ?? null,
    },
    exercices,
  };
}
