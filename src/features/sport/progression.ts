import { allTemplateExerciseIds } from '@/data/exercises';
import { mondayOfISO, shiftISO } from '@/lib/date';
import type { StrengthSession, StrengthSet, TrainingProfile } from '@/types';

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

export interface ExerciseResolver {
  (exerciseId: string): { name: string; bodyweight: boolean } | null;
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

export type TrendKind = 'up' | 'flat' | 'down';

/** Nombre de séances lues pour la tendance de fond d'un exercice. */
export const TREND_POINTS = 6;
/** Fenêtre (en séances) et tolérance (±1,5 %) de la détection de stagnation. */
export const STAGNATION_WINDOW = 3;
const STAGNATION_TOLERANCE = 0.015;
/** En dessous de ±1,5 % sur la fenêtre de tendance, on considère l'exercice stable. */
const TREND_FLAT_PCT = 1.5;

export interface ProgressionSummary {
  points: ExercisePoint[];
  last: ExercisePoint | null;
  prev: ExercisePoint | null;
  /** Variation % du meilleur score entre les deux dernières séances. */
  deltaPct: number | null;
  /**
   * Tendance de fond : variation % du meilleur score, lissée par régression
   * linéaire sur les `TREND_POINTS` dernières séances. Moins bruitée que
   * `deltaPct`, qui ne compare que deux séances.
   */
  trendPct: number | null;
  trend: TrendKind | null;
  /** true si les `STAGNATION_WINDOW` dernières séances sont à ±1,5 % du même score. */
  stagnant: boolean;
  bestEver: number;
  /** true si la dernière séance établit un record. */
  isPR: boolean;
}

/**
 * Variation % entre la valeur prédite au début et à la fin de la fenêtre par
 * une régression linéaire sur l'index de séance. Avec deux points, égale la
 * variation brute ; au-delà, un écart isolé pèse moins qu'une vraie dérive.
 */
export function regressionTrendPct(values: readonly number[]): number | null {
  const n = values.length;
  if (n < 2) return null;
  const sx = (n * (n - 1)) / 2;
  const sxx = ((n - 1) * n * (2 * n - 1)) / 6;
  let sy = 0;
  let sxy = 0;
  values.forEach((y, x) => {
    sy += y;
    sxy += x * y;
  });
  const denom = n * sxx - sx * sx;
  const slope = denom !== 0 ? (n * sxy - sx * sy) / denom : 0;
  const intercept = (sy - slope * sx) / n;
  if (intercept <= 0) return null;
  const predLast = intercept + slope * (n - 1);
  return Math.round(((predLast - intercept) / intercept) * 1000) / 10;
}

function trendKindFor(trendPct: number | null): TrendKind | null {
  if (trendPct === null) return null;
  if (trendPct > TREND_FLAT_PCT) return 'up';
  if (trendPct < -TREND_FLAT_PCT) return 'down';
  return 'flat';
}

export function isStagnant(points: readonly ExercisePoint[]): boolean {
  if (points.length < STAGNATION_WINDOW) return false;
  const recent = points.slice(-STAGNATION_WINDOW);
  const first = recent[0].best;
  if (first <= 0) return false;
  return recent.every(
    (p) => Math.abs(p.best - first) / first < STAGNATION_TOLERANCE,
  );
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
  const trendPct = regressionTrendPct(
    points.slice(-TREND_POINTS).map((p) => p.best),
  );
  const stagnant = isStagnant(points);
  const isPR =
    last !== null &&
    points.length > 1 &&
    last.best >= bestEver &&
    points.slice(0, -1).every((p) => p.best < last.best);
  return {
    points,
    last,
    prev,
    deltaPct,
    trendPct,
    // La régression lit 6 séances : un exercice qui a progressé puis s'est
    // figé sur les 3 dernières est en palier aujourd'hui, pas « en hausse ».
    trend: stagnant ? 'flat' : trendKindFor(trendPct),
    stagnant,
    bestEver,
    isPR,
  };
}

/**
 * Ids de tous les exercices à suivre : ceux planifiés dans les séances types
 * du profil, unis à ceux réellement déjà loggés (séances libres incluses).
 */
export function trackedExerciseIds(
  profile: Pick<TrainingProfile, 'sessionTemplates'>,
  sessions: StrengthSession[],
): string[] {
  const ids = new Set(allTemplateExerciseIds(profile));
  for (const s of sessions) {
    for (const e of s.exercises) ids.add(e.exerciseId);
  }
  return [...ids];
}

/** Nombre de séances (dates uniques) sur les 7 derniers jours, aujourd'hui inclus. */
export function weekSessionCount(
  dates: readonly string[],
  todayIso: string,
): number {
  const startIso = shiftISO(todayIso, -6);
  const unique = new Set(dates.filter((d) => d >= startIso && d <= todayIso));
  return unique.size;
}

/**
 * Semaines calendaires consécutives (lundi → dimanche) où l'objectif de
 * séances a été tenu, en remontant depuis aujourd'hui. La semaine en cours
 * compte si elle est déjà atteinte ; sinon elle est ignorée (elle n'est pas
 * finie) et la série se lit depuis la semaine précédente.
 */
export function weeklyGoalStreak(
  dates: readonly string[],
  target: number,
  todayIso: string,
): number {
  if (target <= 0) return 0;
  const byWeek = new Map<string, Set<string>>();
  for (const d of dates) {
    if (d > todayIso) continue;
    const monday = mondayOfISO(d);
    const set = byWeek.get(monday) ?? new Set<string>();
    set.add(d);
    byWeek.set(monday, set);
  }
  const hit = (monday: string) => (byWeek.get(monday)?.size ?? 0) >= target;

  let monday = mondayOfISO(todayIso);
  let streak = hit(monday) ? 1 : 0;
  monday = shiftISO(monday, -7);
  while (hit(monday)) {
    streak += 1;
    monday = shiftISO(monday, -7);
  }
  return streak;
}
