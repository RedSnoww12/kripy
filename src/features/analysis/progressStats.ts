import { dayTotals } from '@/features/nutrition/totals';
import type { LogByDate, Targets, WeightEntry } from '@/types';

const MS_PER_DAY = 86_400_000;

/** Tolérance d'adhérence : ±100 kcal autour de la cible = journée tenue. */
const ADHERENCE_TOLERANCE_KCAL = 100;

export interface WeekRate {
  /** Date ISO du premier jour de la fenêtre. */
  startDate: string;
  /**
   * Variation ramenée à 7 jours, en kg (négatif = perte). Les pesées n'étant
   * pas toujours quotidiennes, une fenêtre peut couvrir 5 à 9 jours réels :
   * la normalisation garantit que toutes les semaines sont comparables entre
   * elles (sinon une fenêtre courte paraît systématiquement « plus facile »).
   */
  deltaKg: number;
  /** Nombre de jours réellement couverts par la fenêtre. */
  days: number;
}

export interface ProgressStats {
  /** Variation totale depuis la première pesée (kg, négatif = perte). */
  totalChangeKg: number;
  /** Nombre de jours écoulés depuis la première pesée. */
  daysTracked: number;
  /** Semaine glissante avec la plus forte perte (ou la plus faible prise). */
  bestWeek: WeekRate | null;
  /** Semaine glissante avec la plus forte prise (ou la plus faible perte). */
  worstWeek: WeekRate | null;
  /** Nombre de jours consécutifs pesés en terminant aujourd'hui. */
  weighInStreak: number;
  /** Part de jours pesés sur les 30 derniers jours (0-100). */
  weighInRate30: number;
  /** Part de jours tracés dont les kcal sont dans la tolérance (0-100), null si aucun jour tracé. */
  kcalAdherence14: number | null;
  /** Nombre de jours avec au moins un repas logué sur 14 jours. */
  trackedDays14: number;
  /** Variation de la moyenne de poids : 7 derniers jours vs 7 précédents (kg). */
  weekOverWeekKg: number | null;
  /** Plus longue série de jours tracés consécutifs (log alimentaire). */
  bestLogStreak: number;
}

function toISO(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string): number {
  const a = Date.parse(from);
  const b = Date.parse(to);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round((b - a) / MS_PER_DAY);
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

/**
 * Poids moyen sur une fenêtre de `days` jours se terminant `offsetDays` jours
 * avant `today`. Renvoie null si aucune pesée dans la fenêtre.
 */
function windowAverage(
  weights: readonly WeightEntry[],
  today: string,
  days: number,
  offsetDays: number,
): number | null {
  const end = Date.parse(today) - offsetDays * MS_PER_DAY;
  const start = end - (days - 1) * MS_PER_DAY;
  const startISO = toISO(start);
  const endISO = toISO(end);
  const inWindow = weights
    .filter((w) => w.date >= startISO && w.date <= endISO)
    .map((w) => w.w);
  return average(inWindow);
}

/**
 * Meilleure et pire semaine glissante : pour chaque pesée, on cherche la
 * pesée la plus proche 7 jours plus tôt (±2 jours de tolérance, les pesées
 * n'étant pas toujours quotidiennes) et on compare, en ramenant la variation
 * à un rythme sur 7 jours pour que les fenêtres soient comparables.
 */
function weekExtremes(weights: readonly WeightEntry[]): {
  best: WeekRate | null;
  worst: WeekRate | null;
} {
  const rates: WeekRate[] = [];
  for (let i = 0; i < weights.length; i++) {
    const end = weights[i];
    let match: WeightEntry | null = null;
    let bestGap = Infinity;
    let matchDays = 0;
    for (let j = 0; j < i; j++) {
      const days = daysBetween(weights[j].date, end.date);
      const gap = Math.abs(days - 7);
      if (gap <= 2 && gap < bestGap) {
        bestGap = gap;
        match = weights[j];
        matchDays = days;
      }
    }
    if (match && matchDays > 0) {
      rates.push({
        startDate: match.date,
        deltaKg: +(((end.w - match.w) * 7) / matchDays).toFixed(2),
        days: matchDays,
      });
    }
  }
  if (rates.length === 0) return { best: null, worst: null };
  const sorted = [...rates].sort((a, b) => a.deltaKg - b.deltaKg);
  return { best: sorted[0], worst: sorted[sorted.length - 1] };
}

function streakEndingToday(dates: Set<string>, today: string): number {
  let streak = 0;
  const base = Date.parse(today);
  for (let i = 0; i < 400; i++) {
    if (!dates.has(toISO(base - i * MS_PER_DAY))) break;
    streak++;
  }
  return streak;
}

function longestStreak(dates: readonly string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...new Set(dates)].sort();
  let best = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (daysBetween(sorted[i - 1], sorted[i]) === 1) current++;
    else current = 1;
    if (current > best) best = current;
  }
  return best;
}

interface BuildArgs {
  weights: readonly WeightEntry[];
  log: LogByDate;
  targets: Targets;
  today: string;
}

/**
 * Statistiques de progression complémentaires aux métriques instantanées
 * (poids actuel, IMC…) : elles mesurent la *dynamique* et la *régularité*,
 * c'est-à-dire ce qui prédit réellement l'atteinte de l'objectif.
 */
export function buildProgressStats({
  weights,
  log,
  targets,
  today,
}: BuildArgs): ProgressStats {
  const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date));

  const totalChangeKg =
    sorted.length >= 2
      ? +(sorted[sorted.length - 1].w - sorted[0].w).toFixed(1)
      : 0;
  const daysTracked =
    sorted.length > 0 ? daysBetween(sorted[0].date, today) : 0;

  const { best, worst } = weekExtremes(sorted);

  const weighDates = new Set(sorted.map((w) => w.date));
  const weighInStreak = streakEndingToday(weighDates, today);

  const base = Date.parse(today);
  let weighed30 = 0;
  for (let i = 0; i < 30; i++) {
    if (weighDates.has(toISO(base - i * MS_PER_DAY))) weighed30++;
  }
  const weighInRate30 = Math.round((weighed30 / 30) * 100);

  let tracked14 = 0;
  let onTarget14 = 0;
  for (let i = 0; i < 14; i++) {
    const date = toISO(base - i * MS_PER_DAY);
    const totals = dayTotals(log, date);
    if (totals.kcal <= 0) continue;
    tracked14++;
    if (Math.abs(totals.kcal - targets.kcal) <= ADHERENCE_TOLERANCE_KCAL) {
      onTarget14++;
    }
  }
  const kcalAdherence14 =
    tracked14 > 0 ? Math.round((onTarget14 / tracked14) * 100) : null;

  const thisWeek = windowAverage(sorted, today, 7, 0);
  const lastWeek = windowAverage(sorted, today, 7, 7);
  const weekOverWeekKg =
    thisWeek !== null && lastWeek !== null
      ? +(thisWeek - lastWeek).toFixed(2)
      : null;

  const loggedDates = Object.keys(log).filter(
    (d) => dayTotals(log, d).kcal > 0,
  );

  return {
    totalChangeKg,
    daysTracked,
    bestWeek: best,
    worstWeek: worst,
    weighInStreak,
    weighInRate30,
    kcalAdherence14,
    trackedDays14: tracked14,
    weekOverWeekKg,
    bestLogStreak: longestStreak(loggedDates),
  };
}
