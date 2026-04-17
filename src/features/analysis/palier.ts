import type { Palier, PalierTimelinePoint, Phase, WeightEntry } from '@/types';

export function createPalier(
  kcal: number,
  phase: Phase,
  today: string,
): Palier {
  return { kcal, phase, startDate: today };
}

export function computePalier(
  stored: Palier | null,
  currentKcal: number,
  currentPhase: Phase,
  weights: WeightEntry[],
  today: string,
): Palier {
  const base: Palier =
    stored &&
    stored.kcal === currentKcal &&
    stored.phase === currentPhase &&
    stored.startDate
      ? stored
      : createPalier(currentKcal, currentPhase, today);

  const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date));

  let earliest = base.startDate;
  for (let i = sorted.length - 1; i >= 0; i--) {
    const e = sorted[i];
    if (typeof e.tgKcal !== 'number' || typeof e.phase !== 'string') continue;
    if (e.tgKcal === base.kcal && e.phase === base.phase) {
      if (e.date < earliest) earliest = e.date;
    } else {
      break;
    }
  }

  return earliest === base.startDate ? base : { ...base, startDate: earliest };
}

export function extendPalierBackward(
  current: Palier,
  date: string,
  tgKcal: number,
  phase: Phase,
): Palier {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return current;
  if (tgKcal !== current.kcal) return current;
  if (phase !== current.phase) return current;
  if (date >= current.startDate) return current;
  return { ...current, startDate: date };
}

export function palierDays(palier: Palier, today: string): number {
  const t = Date.parse(today);
  const s = Date.parse(palier.startDate);
  if (Number.isNaN(t) || Number.isNaN(s)) return 0;
  return Math.max(0, Math.floor((t - s) / 86_400_000));
}

export function palierTimeline(
  weights: WeightEntry[],
  currentKcal: number,
  today: string,
): PalierTimelinePoint[] {
  const tl: PalierTimelinePoint[] = weights
    .filter((e) => typeof e.tgKcal === 'number' && (e.tgKcal ?? 0) > 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({ date: e.date, tgKcal: e.tgKcal as number }));

  if (!tl.length || tl[tl.length - 1].tgKcal !== currentKcal) {
    tl.push({ date: today, tgKcal: currentKcal });
  }
  return tl;
}

export function targetForDate(
  date: string,
  weights: WeightEntry[],
  currentKcal: number,
  today: string,
): number {
  const tl = palierTimeline(weights, currentKcal, today);
  if (!tl.length) return currentKcal;
  let cur = tl[0].tgKcal;
  for (const e of tl) {
    if (e.date <= date) cur = e.tgKcal;
    else break;
  }
  return cur;
}
