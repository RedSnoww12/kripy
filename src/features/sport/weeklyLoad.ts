import { shiftISO } from '@/lib/date';
import type { StrengthSession } from '@/types';
import { setScore, type ExerciseResolver } from './progression';

/** Longueur d'une fenêtre de charge : la semaine glissante, comme partout ailleurs. */
export const LOAD_WINDOW_DAYS = 7;
/** Nombre de fenêtres tracées par défaut (~2 mois). */
export const LOAD_WINDOWS = 8;
/** Une série à RPE ≥ 8 compte comme « dure » (≤ 2 reps en réserve). */
export const HARD_SET_RPE = 8;

/**
 * Charge d'entraînement sur une fenêtre de 7 jours. Les fenêtres sont
 * glissantes et alignées sur aujourd'hui (J-6 → J, J-13 → J-7…), pas sur des
 * semaines calendaires : chaque fenêtre est donc toujours complète et les
 * comparaisons entre deux fenêtres sont à périmètre égal, même un lundi.
 */
export interface LoadWindow {
  /** 0 = les 7 derniers jours, 1 = les 7 jours d'avant, etc. */
  index: number;
  start: string;
  end: string;
  sessions: number;
  sets: number;
  /** Séries loguées avec un RPE ≥ HARD_SET_RPE. */
  hardSets: number;
  /** Séries dont le RPE est renseigné (dénominateur du ratio de séries dures). */
  ratedSets: number;
  reps: number;
  /** Σ charge × reps sur les séries chargées, en kg (0 pour du PDC strict). */
  tonnage: number;
  avgRpe: number | null;
  durationMin: number;
  /** Exercices distincts travaillés sur la fenêtre. */
  exercises: number;
  /**
   * Exercices dont le meilleur score de la fenêtre dépasse tout ce qui a été
   * fait avant la fenêtre. Un exercice découvert pendant la fenêtre ne compte
   * pas : il n'y a rien à battre.
   */
  prCount: number;
}

function emptyWindow(index: number, start: string, end: string): LoadWindow {
  return {
    index,
    start,
    end,
    sessions: 0,
    sets: 0,
    hardSets: 0,
    ratedSets: 0,
    reps: 0,
    tonnage: 0,
    avgRpe: null,
    durationMin: 0,
    exercises: 0,
    prCount: 0,
  };
}

/**
 * Agrège les séances de force en fenêtres de charge, de la plus ancienne à la
 * plus récente (ordre naturel d'un graphique). Les séances postérieures à
 * `todayIso` sont ignorées.
 */
export function buildLoadWindows(
  sessions: readonly StrengthSession[],
  resolve: ExerciseResolver,
  todayIso: string,
  count: number = LOAD_WINDOWS,
  days: number = LOAD_WINDOW_DAYS,
): LoadWindow[] {
  const sorted = [...sessions]
    .filter((s) => s.date <= todayIso)
    .sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);

  const windows: LoadWindow[] = [];
  for (let index = count - 1; index >= 0; index--) {
    const end = shiftISO(todayIso, -index * days);
    const start = shiftISO(end, -(days - 1));
    const win = emptyWindow(index, start, end);

    const priorBest = new Map<string, number>();
    const windowBest = new Map<string, number>();
    let rpeSum = 0;

    for (const session of sorted) {
      if (session.date > end) break;
      const inWindow = session.date >= start;
      if (inWindow) {
        win.sessions += 1;
        win.durationMin += session.dur ?? 0;
      }
      for (const entry of session.exercises) {
        if (entry.sets.length === 0) continue;
        const def = resolve(entry.exerciseId);
        const bodyweight = def?.bodyweight ?? false;
        const target = inWindow ? windowBest : priorBest;
        for (const set of entry.sets) {
          const score = setScore(set, bodyweight);
          if (score > (target.get(entry.exerciseId) ?? 0)) {
            target.set(entry.exerciseId, score);
          }
          if (!inWindow) continue;
          win.sets += 1;
          win.reps += set.r;
          if (set.w > 0) win.tonnage += set.w * set.r;
          if (set.rpe && set.rpe > 0) {
            win.ratedSets += 1;
            rpeSum += set.rpe;
            if (set.rpe >= HARD_SET_RPE) win.hardSets += 1;
          }
        }
      }
    }

    win.exercises = windowBest.size;
    win.tonnage = Math.round(win.tonnage);
    win.avgRpe =
      win.ratedSets > 0 ? Math.round((rpeSum / win.ratedSets) * 10) / 10 : null;
    for (const [id, best] of windowBest) {
      const prior = priorBest.get(id);
      if (prior !== undefined && best > prior) win.prCount += 1;
    }
    windows.push(win);
  }
  return windows;
}

/** Variation en % arrondie, null si la base est nulle. */
export function pctDelta(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Moyenne d'une métrique sur les fenêtres précédant la plus récente, en ne
 * retenant que celles où il y a eu au moins une séance : une semaine de
 * vacances ne doit pas faire passer la reprise pour un pic de charge.
 */
export function baselineOf(
  windows: readonly LoadWindow[],
  key: 'sets' | 'tonnage' | 'reps' | 'sessions' | 'hardSets',
  lookback = 3,
): number | null {
  const previous = windows
    .filter((w) => w.index >= 1 && w.index <= lookback && w.sessions > 0)
    .map((w) => w[key]);
  if (previous.length === 0) return null;
  return previous.reduce((s, v) => s + v, 0) / previous.length;
}

/** Fenêtre la plus récente (index 0), ou null si la liste est vide. */
export function currentWindow(
  windows: readonly LoadWindow[],
): LoadWindow | null {
  return windows.find((w) => w.index === 0) ?? null;
}

/** Fenêtre précédente (index 1), ou null. */
export function previousWindow(
  windows: readonly LoadWindow[],
): LoadWindow | null {
  return windows.find((w) => w.index === 1) ?? null;
}
