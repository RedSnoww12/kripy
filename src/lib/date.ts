export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatShortDate(isoDate: string): string {
  const [, m, d] = isoDate.split('-');
  return `${d}/${m}`;
}

export function addDaysISO(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export type MealSlotIndex = 0 | 1 | 2 | 3;

export function mealSlotForHour(hour: number): MealSlotIndex {
  if (hour >= 5 && hour < 11) return 0;
  if (hour >= 11 && hour < 15) return 1;
  if (hour >= 15 && hour < 18) return 3;
  return 2;
}

export function currentMealSlot(now: Date = new Date()): MealSlotIndex {
  return mealSlotForHour(now.getHours());
}

/**
 * Décale une date ISO (YYYY-MM-DD) d'un nombre de jours, en arithmétique
 * purement calendaire. Contrairement à `new Date(iso + 'T00:00:00')` suivi
 * de `toISOString()`, le résultat ne dépend pas du fuseau horaire du
 * navigateur : à Paris (UTC+1/+2) l'ancienne méthode reculait d'un jour de
 * trop et transformait une fenêtre « 7 jours » en 8.
 */
export function shiftISO(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Nombre de jours de `fromIso` à `toIso` (positif si `toIso` est après). */
export function daysBetweenISO(fromIso: string, toIso: string): number {
  const [y1, m1, d1] = fromIso.split('-').map(Number);
  const [y2, m2, d2] = toIso.split('-').map(Number);
  return Math.round(
    (Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000,
  );
}

/** Index du jour de la semaine, lundi = 0 … dimanche = 6. */
export function weekdayIndexISO(isoDate: string): number {
  const [y, m, d] = isoDate.split('-').map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

/** Lundi de la semaine calendaire contenant la date. */
export function mondayOfISO(isoDate: string): string {
  return shiftISO(isoDate, -weekdayIndexISO(isoDate));
}
