import type { DayLog, LogByDate, Macros, MealEntry } from '@/types';

const EMPTY: Macros = { kcal: 0, p: 0, g: 0, l: 0, f: 0 };

export function sumDayMacros(entries: DayLog | undefined): Macros {
  if (!entries || entries.length === 0) return { ...EMPTY };
  return entries.reduce<Macros>(
    (acc, item) => ({
      kcal: acc.kcal + (item.kcal ?? 0),
      p: acc.p + (item.p ?? 0),
      g: acc.g + (item.g ?? 0),
      l: acc.l + (item.l ?? 0),
      f: (acc.f ?? 0) + (item.f ?? 0),
    }),
    { ...EMPTY },
  );
}

export function dayTotals(log: LogByDate, date: string): Macros {
  return sumDayMacros(log[date]);
}

export function groupByMeal(entries: MealEntry[]): Record<number, MealEntry[]> {
  return entries.reduce<Record<number, MealEntry[]>>((acc, item) => {
    const slot = item.meal ?? 0;
    (acc[slot] ??= []).push(item);
    return acc;
  }, {});
}

export function computeStreak(log: LogByDate, today: string): number {
  let streak = 0;
  const d = new Date(today);
  for (let i = 0; i < 365; i++) {
    const iso = d.toISOString().slice(0, 10);
    const entries = log[iso];
    if (entries && entries.length > 0) {
      streak++;
    } else if (i > 0) {
      break;
    }
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
