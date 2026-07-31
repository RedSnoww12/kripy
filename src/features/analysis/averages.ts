import { dayTotals } from '@/features/nutrition/totals';
import type { LogByDate, WeightEntry } from '@/types';
import { palierTimeline } from './palier';
import { linReg } from './trend';

const MS_PER_DAY = 86_400_000;

/** Fenêtres proposées par défaut dans l'UI (jours). */
export const AVERAGE_WINDOWS = [3, 7, 14, 30] as const;

/** Bornes acceptées pour une fenêtre saisie librement. */
export const MIN_WINDOW_DAYS = 1;
export const MAX_WINDOW_DAYS = 365;

/**
 * Nombre minimum de pesées pour estimer un rythme de poids sur un palier.
 * En dessous, une « tendance » n'est que du bruit de fluctuation hydrique.
 */
const MIN_WEIGH_INS_FOR_RATE = 3;

function toISO(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / MS_PER_DAY);
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function round(value: number | null, digits: number): number | null {
  if (value === null) return null;
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

/** Moyennes d'une période fermée [startDate, endDate]. */
export interface PeriodAverages {
  /** Longueur de la fenêtre en jours calendaires. */
  days: number;
  startDate: string;
  endDate: string;
  /** Poids moyen des pesées de la période (kg), null si aucune pesée. */
  weightKg: number | null;
  /** Nombre de pesées ayant servi à la moyenne. */
  weighIns: number;
  /**
   * Moyennes nutritionnelles calculées sur les seuls jours réellement tracés
   * (un jour sans repas logué n'est pas une journée à 0 kcal, c'est une
   * absence de donnée : l'inclure ferait chuter artificiellement la moyenne).
   */
  kcal: number | null;
  prot: number | null;
  gluc: number | null;
  lip: number | null;
  /** Nombre de jours avec au moins un repas logué. */
  trackedDays: number;
}

/**
 * Moyennes sur les `days` jours calendaires se terminant à `endDate` inclus.
 */
export function buildPeriodAverages(
  weights: readonly WeightEntry[],
  log: LogByDate,
  endDate: string,
  days: number,
): PeriodAverages {
  const span = Math.max(1, Math.round(days));
  const endMs = Date.parse(endDate);
  const startDate = toISO(endMs - (span - 1) * MS_PER_DAY);

  const inWindow = weights.filter(
    (w) => w.date >= startDate && w.date <= endDate,
  );

  const kcals: number[] = [];
  const prots: number[] = [];
  const glucs: number[] = [];
  const lips: number[] = [];
  for (let i = 0; i < span; i++) {
    const date = toISO(endMs - i * MS_PER_DAY);
    const totals = dayTotals(log, date);
    if (totals.kcal <= 0) continue;
    kcals.push(totals.kcal);
    prots.push(totals.p);
    glucs.push(totals.g);
    lips.push(totals.l);
  }

  return {
    days: span,
    startDate,
    endDate,
    weightKg: round(mean(inWindow.map((w) => w.w)), 2),
    weighIns: inWindow.length,
    kcal: round(mean(kcals), 0),
    prot: round(mean(prots), 0),
    gluc: round(mean(glucs), 0),
    lip: round(mean(lips), 0),
    trackedDays: kcals.length,
  };
}

export interface AverageComparison {
  /** Les `days` derniers jours (fenêtre se terminant aujourd'hui). */
  current: PeriodAverages;
  /** Les `days` jours immédiatement antérieurs, même longueur. */
  previous: PeriodAverages;
  /** Écarts current − previous, null si l'une des deux valeurs manque. */
  deltaWeightKg: number | null;
  deltaKcal: number | null;
  deltaProt: number | null;
  /**
   * Écart de poids ramené à 7 jours (kg/semaine) : rend deux fenêtres de
   * longueurs différentes comparables entre elles.
   */
  weeklyRateKg: number | null;
}

/**
 * Compare la moyenne des `days` derniers jours à celle des `days` jours
 * précédents — la lecture la plus fiable d'une progression, les fluctuations
 * quotidiennes (eau, sel, transit) s'annulant dans la moyenne.
 */
export function compareWindows(
  weights: readonly WeightEntry[],
  log: LogByDate,
  today: string,
  days: number,
): AverageComparison {
  const span = Math.max(1, Math.round(days));
  const current = buildPeriodAverages(weights, log, today, span);
  const previousEnd = toISO(Date.parse(today) - span * MS_PER_DAY);
  const previous = buildPeriodAverages(weights, log, previousEnd, span);

  const deltaWeightKg =
    current.weightKg !== null && previous.weightKg !== null
      ? round(current.weightKg - previous.weightKg, 2)
      : null;

  return {
    current,
    previous,
    deltaWeightKg,
    deltaKcal:
      current.kcal !== null && previous.kcal !== null
        ? Math.round(current.kcal - previous.kcal)
        : null,
    deltaProt:
      current.prot !== null && previous.prot !== null
        ? Math.round(current.prot - previous.prot)
        : null,
    // Les deux fenêtres sont distantes de `span` jours (de centre à centre).
    weeklyRateKg:
      deltaWeightKg !== null ? round((deltaWeightKg * 7) / span, 2) : null,
  };
}

/** Moyennes agrégées sur tous les jours passés à une même cible calorique. */
export interface TargetGroupAverages {
  /** Cible calorique du palier (kcal/jour). */
  targetKcal: number;
  /** Nombre de jours calendaires passés à cette cible. */
  days: number;
  firstDate: string;
  lastDate: string;
  weightKg: number | null;
  weighIns: number;
  /** Moyenne réellement consommée : révèle l'adhérence à la cible. */
  kcal: number | null;
  prot: number | null;
  trackedDays: number;
  /**
   * Rythme de poids observé sur ce palier (kg/semaine, négatif = perte),
   * par régression linéaire sur les pesées du palier. Null si moins de
   * 3 pesées — en dessous, ce serait du bruit, pas une tendance.
   */
  weeklyRateKg: number | null;
}

/**
 * Regroupe l'historique par cible calorique et calcule, pour chaque palier,
 * les moyennes et le rythme de poids associé.
 *
 * C'est la comparaison qui répond à « qu'est-ce que ça donnait à 2900 kcal
 * par rapport à 2700 ? » : comparer des moyennes de poids brutes entre deux
 * périodes n'a pas de sens (le poids dépend d'où l'on en était), alors que le
 * rythme kg/semaine à chaque niveau calorique est directement actionnable.
 */
export function buildTargetGroups(
  weights: readonly WeightEntry[],
  log: LogByDate,
  currentKcal: number,
  today: string,
): TargetGroupAverages[] {
  const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length === 0) return [];

  // Timeline des changements de cible, calculée une fois (targetForDate la
  // recalculerait à chaque appel, soit un coût quadratique sur l'historique).
  const timeline = palierTimeline(sorted, currentKcal, today);
  if (timeline.length === 0) return [];

  const targetAt = (date: string): number => {
    let cur = timeline[0].tgKcal;
    for (const point of timeline) {
      if (point.date <= date) cur = point.tgKcal;
      else break;
    }
    return cur;
  };

  interface Bucket {
    targetKcal: number;
    dates: string[];
    weights: WeightEntry[];
    kcals: number[];
    prots: number[];
  }
  const buckets = new Map<number, Bucket>();

  const firstDate = sorted[0].date;
  const totalDays = Math.max(0, daysBetween(firstDate, today));
  const baseMs = Date.parse(firstDate);
  const weightsByDate = new Map<string, WeightEntry>();
  for (const w of sorted) weightsByDate.set(w.date, w);

  for (let i = 0; i <= totalDays; i++) {
    const date = toISO(baseMs + i * MS_PER_DAY);
    const target = targetAt(date);
    const bucket = buckets.get(target) ?? {
      targetKcal: target,
      dates: [],
      weights: [],
      kcals: [],
      prots: [],
    };
    bucket.dates.push(date);
    const w = weightsByDate.get(date);
    if (w) bucket.weights.push(w);
    const totals = dayTotals(log, date);
    if (totals.kcal > 0) {
      bucket.kcals.push(totals.kcal);
      bucket.prots.push(totals.p);
    }
    buckets.set(target, bucket);
  }

  return [...buckets.values()]
    .map((b): TargetGroupAverages => {
      let weeklyRateKg: number | null = null;
      if (b.weights.length >= MIN_WEIGH_INS_FOR_RATE) {
        const origin = Date.parse(b.weights[0].date);
        const { slope } = linReg(
          b.weights.map((w) => ({
            x: (Date.parse(w.date) - origin) / MS_PER_DAY,
            y: w.w,
          })),
        );
        weeklyRateKg = round(slope * 7, 2);
      }
      return {
        targetKcal: b.targetKcal,
        days: b.dates.length,
        firstDate: b.dates[0],
        lastDate: b.dates[b.dates.length - 1],
        weightKg: round(mean(b.weights.map((w) => w.w)), 2),
        weighIns: b.weights.length,
        kcal: round(mean(b.kcals), 0),
        prot: round(mean(b.prots), 0),
        trackedDays: b.kcals.length,
        weeklyRateKg,
      };
    })
    .sort((a, b) => b.targetKcal - a.targetKcal);
}
