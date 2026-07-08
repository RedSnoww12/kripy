import type { StrengthSession, StrengthSet } from '@/types';

/**
 * 1RM estimé (formule d'Epley). Retourne 0 si la charge est nulle :
 * un set au poids du corps pur se mesure en répétitions, pas en 1RM.
 */
export function epley1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

/** Score de performance d'un set : e1RM si chargé, sinon nombre de reps. */
export function setScore(set: StrengthSet, bodyweight: boolean): number {
  if (bodyweight && set.w <= 0) return set.r;
  return epley1RM(set.w, set.r);
}

export interface ExercisePoint {
  date: string;
  sessionId: number;
  /** Meilleur score de la séance (e1RM, ou reps max si PDC sans lest). */
  best: number;
  /** Charge du meilleur set. */
  topW: number;
  /** Reps du meilleur set. */
  topReps: number;
  /** Volume total : Σ charge×reps (ou Σ reps pour du PDC pur). */
  volume: number;
  avgRpe: number | null;
  setCount: number;
}

export function exerciseHistory(
  sessions: StrengthSession[],
  exerciseId: string,
  bodyweight: boolean,
): ExercisePoint[] {
  const points: ExercisePoint[] = [];
  const sorted = [...sessions].sort(
    (a, b) => a.date.localeCompare(b.date) || a.id - b.id,
  );
  for (const session of sorted) {
    const entry = session.exercises.find((e) => e.exerciseId === exerciseId);
    if (!entry || entry.sets.length === 0) continue;

    let best = 0;
    let topW = 0;
    let topReps = 0;
    let volume = 0;
    let rpeSum = 0;
    let rpeCount = 0;

    for (const s of entry.sets) {
      const score = setScore(s, bodyweight);
      if (score > best) {
        best = score;
        topW = s.w;
        topReps = s.r;
      }
      volume += bodyweight && s.w <= 0 ? s.r : s.w * s.r;
      if (s.rpe && s.rpe > 0) {
        rpeSum += s.rpe;
        rpeCount += 1;
      }
    }

    points.push({
      date: session.date,
      sessionId: session.id,
      best: Math.round(best * 10) / 10,
      topW,
      topReps,
      volume: Math.round(volume),
      avgRpe: rpeCount > 0 ? Math.round((rpeSum / rpeCount) * 10) / 10 : null,
      setCount: entry.sets.length,
    });
  }
  return points;
}

export interface ProgressionSummary {
  points: ExercisePoint[];
  last: ExercisePoint | null;
  prev: ExercisePoint | null;
  /** Variation % du meilleur score entre les deux dernières séances. */
  deltaPct: number | null;
  bestEver: number;
  /** true si la dernière séance établit un record. */
  isPR: boolean;
}

export function summarizeExercise(
  sessions: StrengthSession[],
  exerciseId: string,
  bodyweight: boolean,
): ProgressionSummary {
  const points = exerciseHistory(sessions, exerciseId, bodyweight);
  const last = points.length > 0 ? points[points.length - 1] : null;
  const prev = points.length > 1 ? points[points.length - 2] : null;
  const bestEver = points.reduce((m, p) => Math.max(m, p.best), 0);
  const deltaPct =
    last && prev && prev.best > 0
      ? Math.round(((last.best - prev.best) / prev.best) * 1000) / 10
      : null;
  const isPR =
    last !== null &&
    points.length > 1 &&
    last.best >= bestEver &&
    points.slice(0, -1).every((p) => p.best < last.best);
  return { points, last, prev, deltaPct, bestEver, isPR };
}

/** Nombre de séances (dates uniques) sur les 7 derniers jours, aujourd'hui inclus. */
export function weekSessionCount(
  dates: readonly string[],
  todayIso: string,
): number {
  const start = new Date(todayIso + 'T00:00:00');
  start.setDate(start.getDate() - 6);
  const startIso = start.toISOString().slice(0, 10);
  const unique = new Set(dates.filter((d) => d >= startIso && d <= todayIso));
  return unique.size;
}
