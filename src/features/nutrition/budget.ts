import { addDaysISO } from '@/lib/date';
import type { BudgetAdjustment } from '@/types';

export const SMOOTH_DAY_PRESETS = [2, 3, 5, 7] as const;
export const MIN_SMOOTH_DAYS = 1;
export const MAX_SMOOTH_DAYS = 30;
export const MIN_SURPLUS_KCAL = 20;
const PRUNE_KEEP_DAYS = 60;

function diffDays(fromISO: string, toISO: string): number {
  return Math.round((Date.parse(toISO) - Date.parse(fromISO)) / 86_400_000);
}

export function clampSmoothDays(days: number): number {
  if (!Number.isFinite(days)) return MIN_SMOOTH_DAYS;
  return Math.min(MAX_SMOOTH_DAYS, Math.max(MIN_SMOOTH_DAYS, Math.round(days)));
}

export function buildAdjustment(
  sourceDate: string,
  amount: number,
  days: number,
  id: number = Date.now(),
): BudgetAdjustment {
  return {
    id,
    sourceDate,
    amount: Math.max(0, Math.round(amount)),
    days: clampSmoothDays(days),
    startDate: addDaysISO(sourceDate, 1),
  };
}

export function adjustmentEndDate(adj: BudgetAdjustment): string {
  return addDaysISO(adj.startDate, adj.days - 1);
}

/**
 * Réduction (kcal) appliquée par un lissage à une date donnée.
 * Distribution exacte : la somme des réductions sur `days` vaut `amount`.
 */
export function dailyDelta(adj: BudgetAdjustment, date: string): number {
  const idx = diffDays(adj.startDate, date);
  if (idx < 0 || idx >= adj.days) return 0;
  const before = Math.round((adj.amount * idx) / adj.days);
  const upTo = Math.round((adj.amount * (idx + 1)) / adj.days);
  return upTo - before;
}

export function totalDailyDelta(
  adjustments: BudgetAdjustment[],
  date: string,
): number {
  return adjustments.reduce((sum, adj) => sum + dailyDelta(adj, date), 0);
}

export function effectiveKcalTarget(
  baseKcal: number,
  adjustments: BudgetAdjustment[],
  date: string,
): number {
  return Math.max(0, baseKcal - totalDailyDelta(adjustments, date));
}

export function activeAdjustments(
  adjustments: BudgetAdjustment[],
  date: string,
): BudgetAdjustment[] {
  return adjustments.filter((adj) => dailyDelta(adj, date) > 0);
}

/** Index 1-based du jour courant dans le lissage (pour afficher « J2/3 »). */
export function adjustmentDayIndex(
  adj: BudgetAdjustment,
  date: string,
): number {
  return diffDays(adj.startDate, date) + 1;
}

export function findBySourceDate(
  adjustments: BudgetAdjustment[],
  sourceDate: string,
): BudgetAdjustment | undefined {
  return adjustments.find((adj) => adj.sourceDate === sourceDate);
}

/** Garde l'historique récent (consultation des jours passés) et purge le reste. */
export function pruneAdjustments(
  adjustments: BudgetAdjustment[],
  today: string,
): BudgetAdjustment[] {
  const horizon = addDaysISO(today, -PRUNE_KEEP_DAYS);
  return adjustments.filter((adj) => adjustmentEndDate(adj) >= horizon);
}
