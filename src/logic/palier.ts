export const MIN_PALIER_DAYS = 3;
export const IDEAL_PALIER_DAYS = 5;

export interface PalierData {
  kcal: number;
  startDate: string; // YYYY-MM-DD
}

/** Check if palier should reset (kcal changed) */
export function shouldResetPalier(
  currentPalier: PalierData | null,
  currentKcal: number
): boolean {
  if (!currentPalier) return true;
  return currentPalier.kcal !== currentKcal;
}

/** Create a new palier for today */
export function createPalier(kcal: number): PalierData {
  return {
    kcal,
    startDate: new Date().toISOString().slice(0, 10),
  };
}

/** Days elapsed since palier started */
export function palierDays(startDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const s = new Date(startDate);
  s.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((today.getTime() - s.getTime()) / 86400000));
}
