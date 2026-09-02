import { tierMeta } from '@/data/exercises';
import { shiftISO } from '@/lib/date';
import type { MuscleTier, StrengthSession, TrainingProfile } from '@/types';

/** Fenêtre de comptage par défaut : la semaine glissante de la méthode. */
export const VOLUME_WINDOW_DAYS = 7;

/**
 * Plafond réaliste de séries de travail par séance. Sert uniquement à
 * détecter un programme dont les objectifs cumulés ne rentrent pas dans le
 * nombre de séances prévues — pas à brider quoi que ce soit.
 */
const MAX_SETS_PER_SESSION = 22;

export type VolumeStatus = 'under' | 'in' | 'over' | 'none';

export interface MuscleVolumeRow {
  muscle: string;
  /** Séries effectives loguées sur la fenêtre. */
  sets: number;
  /** Nombre de séances distinctes ayant travaillé ce muscle (fréquence). */
  sessions: number;
  /** Objectif fixé par l'utilisateur, null si aucun. */
  tier: MuscleTier | null;
  /** Fourchette cible [min, max], null sans objectif. */
  range: [number, number] | null;
  status: VolumeStatus;
}

export interface MuscleVolumeReport {
  rows: MuscleVolumeRow[];
  /** Total des séries effectives, tous groupes confondus. */
  totalSets: number;
  windowDays: number;
  /**
   * Somme des minimums visés. Comparée à la capacité des séances prévues,
   * elle révèle un programme mathématiquement intenable.
   */
  targetMinSets: number;
  /** Capacité estimée : séances hebdo × plafond de séries par séance. */
  capacitySets: number;
  /** true si les objectifs cumulés dépassent cette capacité. */
  overCapacity: boolean;
}

function windowStart(todayIso: string, days: number): string {
  return shiftISO(todayIso, -(days - 1));
}

function statusFor(sets: number, range: [number, number] | null): VolumeStatus {
  if (!range) return 'none';
  if (sets < range[0]) return 'under';
  if (sets > range[1]) return 'over';
  return 'in';
}

/**
 * Compte les séries effectives par groupe musculaire sur la semaine glissante
 * et les confronte aux objectifs de l'utilisateur.
 *
 * Une série loguée compte une fois, pour le muscle principal de son exercice.
 * Pas de répartition sur les muscles secondaires : la méthode raisonne en
 * séries par groupe, et ventiler un développé couché entre pecs, épaules et
 * triceps demanderait des coefficients arbitraires que rien ne justifierait.
 *
 * Les groupes affichés sont ceux qui ont soit un objectif fixé, soit des
 * séries réellement faites — inutile de lister un muscle que l'utilisateur
 * n'entraîne pas et ne cherche pas à entraîner.
 */
export function buildMuscleVolume(
  profile: TrainingProfile,
  sessions: readonly StrengthSession[],
  resolveMuscle: (exerciseId: string) => string | null,
  todayIso: string,
  windowDays: number = VOLUME_WINDOW_DAYS,
): MuscleVolumeReport {
  const start = windowStart(todayIso, windowDays);
  const targets = profile.muscleTargets ?? {};

  const setsByMuscle = new Map<string, number>();
  const sessionsByMuscle = new Map<string, Set<number>>();

  for (const session of sessions) {
    if (session.date < start || session.date > todayIso) continue;
    for (const entry of session.exercises) {
      const muscle = resolveMuscle(entry.exerciseId);
      if (!muscle || entry.sets.length === 0) continue;
      setsByMuscle.set(
        muscle,
        (setsByMuscle.get(muscle) ?? 0) + entry.sets.length,
      );
      const seen = sessionsByMuscle.get(muscle) ?? new Set<number>();
      seen.add(session.id);
      sessionsByMuscle.set(muscle, seen);
    }
  }

  const muscles = [
    ...new Set([...Object.keys(targets), ...setsByMuscle.keys()]),
  ];

  const rows: MuscleVolumeRow[] = muscles
    .map((muscle): MuscleVolumeRow => {
      const tier = targets[muscle] ?? null;
      const range = tier ? tierMeta(tier).range : null;
      const sets = setsByMuscle.get(muscle) ?? 0;
      return {
        muscle,
        sets,
        sessions: sessionsByMuscle.get(muscle)?.size ?? 0,
        tier,
        range,
        status: statusFor(sets, range),
      };
    })
    // Les manques d'abord : c'est ce sur quoi il faut agir cette semaine.
    .sort((a, b) => {
      const rank: Record<VolumeStatus, number> = {
        under: 0,
        over: 1,
        in: 2,
        none: 3,
      };
      if (rank[a.status] !== rank[b.status]) {
        return rank[a.status] - rank[b.status];
      }
      return b.sets - a.sets;
    });

  const targetMinSets = rows.reduce(
    (sum, r) => sum + (r.range ? r.range[0] : 0),
    0,
  );
  const capacitySets = profile.sessionsPerWeek * MAX_SETS_PER_SESSION;

  return {
    rows,
    totalSets: [...setsByMuscle.values()].reduce((s, n) => s + n, 0),
    windowDays,
    targetMinSets,
    capacitySets,
    overCapacity: targetMinSets > capacitySets,
  };
}
