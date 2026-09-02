import { styleMeta } from '@/data/exercises';
import type { StrengthSession, TrainingProfile } from '@/types';
import {
  exerciseHistory,
  summarizeExercise,
  trackedExerciseIds,
  weekSessionCount,
  type ExerciseResolver,
} from './progression';
import { assessTraining } from './trainingStatus';
import { buildLoadWindows } from './weeklyLoad';

const POINTS_PER_EXERCISE = 6;
/** Fenêtres de charge hebdo transmises au coach IA (~1 mois). */
const LOAD_WINDOWS_FOR_AI = 4;

function formatSet(w: number, r: number, rpe?: number): string {
  const load = w > 0 ? `${w}kg×${r}` : `${r}reps`;
  return rpe ? `${load}@RPE${rpe}` : load;
}

/**
 * Pour chaque séance type du programme, retrouve sa dernière réalisation
 * effective et compare, exercice par exercice, la cible planifiée (séries ×
 * reps) au réalisé (séries loguées, charge, reps). C'est ce qui permet au
 * coach IA de juger l'adhérence au programme, pas seulement la progression
 * brute par exercice.
 */
function buildProgramme(
  profile: TrainingProfile,
  sessions: StrengthSession[],
  resolve: ExerciseResolver,
) {
  return profile.sessionTemplates.map((t) => {
    const last = [...sessions].reverse().find((s) => s.templateId === t.id);
    return {
      nom: t.name,
      derniereRealisation: last?.date ?? null,
      ressentiDerniereSeance: last?.feel ?? null,
      exercices: t.exercises.map((pe) => {
        const def = resolve(pe.exerciseId);
        const actual = last?.exercises.find(
          (e) => e.exerciseId === pe.exerciseId,
        );
        return {
          nom: def?.name ?? pe.exerciseId,
          prioritaire: pe.priority === true,
          seriesCibles: pe.sets,
          repsCibles: `${pe.repsMin}-${pe.repsMax}`,
          seriesReellesDerniereSeance:
            actual?.sets.map((s) => formatSet(s.w, s.r, s.rpe)) ?? null,
        };
      }),
    };
  });
}

/**
 * Construit le résumé compact (sérialisable en JSON) envoyé au coach IA :
 * profil, programme enregistré (séances types + adhérence), progression des
 * exercices suivis.
 */
export function buildCoachContext(
  profile: TrainingProfile,
  sessions: StrengthSession[],
  resolve: ExerciseResolver,
  todayIso: string,
  extras?: { objectifNutrition?: string; poids?: number },
): Record<string, unknown> {
  const style = styleMeta(profile.style);
  const programme = buildProgramme(profile, sessions, resolve);

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

  // Charge hebdo (volume / intensité / records) et verdict local : l'IA
  // raisonne sur les mêmes chiffres que le coach intégré, et peut les
  // nuancer plutôt que de repartir de zéro.
  const windows = buildLoadWindows(sessions, resolve, todayIso);
  const chargeHebdo = windows
    .filter((w) => w.index < LOAD_WINDOWS_FOR_AI)
    .map((w) => ({
      fenetre: `${w.start} → ${w.end}`,
      seances: w.sessions,
      series: w.sets,
      seriesDures: w.hardSets,
      tonnageKg: w.tonnage,
      rpeMoyen: w.avgRpe,
      records: w.prCount,
    }));
  const status = assessTraining({
    windows,
    exercises: trackedExerciseIds(profile, sessions).flatMap((id) => {
      const def = resolve(id);
      if (!def) return [];
      const summary = summarizeExercise(sessions, id, def.bodyweight);
      if (summary.points.length === 0) return [];
      return [
        {
          name: def.name,
          trend: summary.trend,
          stagnant: summary.stagnant,
          isPR: summary.isPR,
        },
      ];
    }),
    sessionsPerWeek: profile.sessionsPerWeek,
    recentFeels: recents
      .slice(-3)
      .map((r) => r.ressenti)
      .filter((f): f is number => typeof f === 'number'),
  });

  return {
    profil: {
      style: style.label,
      repsCibles: `${style.repRange[0]}-${style.repRange[1]}`,
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
    programme,
    chargeHebdo,
    verdictLocal: { statut: status.kind, titre: status.title },
    seancesRecentes: recents,
    exercices,
    date: todayIso,
  };
}
