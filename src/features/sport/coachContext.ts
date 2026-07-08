import { styleMeta } from '@/data/exercises';
import type { StrengthSession, TrainingProfile } from '@/types';
import type { ExerciseResolver } from './coach';
import {
  exerciseHistory,
  trackedExerciseIds,
  weekSessionCount,
} from './progression';

const POINTS_PER_EXERCISE = 6;

/**
 * Construit le résumé compact (sérialisable en JSON) envoyé au coach IA :
 * profil, adhérence hebdo et progression des exercices suivis.
 */
export function buildCoachContext(
  profile: TrainingProfile,
  sessions: StrengthSession[],
  resolve: ExerciseResolver,
  todayIso: string,
  extras?: { objectifNutrition?: string; poids?: number },
): Record<string, unknown> {
  const style = styleMeta(profile.style);

  const exercices = trackedExerciseIds(profile, sessions).flatMap((id) => {
    const def = resolve(id);
    if (!def) return [];
    const points = exerciseHistory(sessions, id, def.bodyweight).slice(
      -POINTS_PER_EXERCISE,
    );
    if (points.length === 0) return [];
    return [
      {
        nom: def.name,
        poidsDuCorps: def.bodyweight,
        historique: points.map((p) => ({
          date: p.date,
          topW: p.topW,
          topReps: p.topReps,
          e1RM: def.bodyweight && p.topW <= 0 ? null : p.best,
          volume: p.volume,
          series: p.setCount,
          rpeMoyen: p.avgRpe,
        })),
      },
    ];
  });

  const recents = sessions.slice(-8).map((s) => ({
    date: s.date,
    jour: s.label,
    ressenti: s.feel ?? null,
    duree: s.dur ?? null,
  }));

  return {
    profil: {
      style: style.label,
      repsCibles: `${style.repRange[0]}-${style.repRange[1]}`,
      seancesTypes: profile.sessionTemplates.map((t) => t.name),
      seancesParSemaineVisees: profile.sessionsPerWeek,
      seancesRealisees7j: weekSessionCount(
        sessions.map((s) => s.date),
        todayIso,
      ),
      ...(extras?.objectifNutrition
        ? { phaseNutrition: extras.objectifNutrition }
        : {}),
      ...(extras?.poids ? { poidsCorporelKg: extras.poids } : {}),
    },
    seancesRecentes: recents,
    exercices,
    date: todayIso,
  };
}
