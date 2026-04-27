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
