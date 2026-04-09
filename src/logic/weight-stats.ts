import type { WeightEntry } from "./trend";

export interface WeightStats {
  current: number;
  start: number;
  min: number;
  max: number;
  bmi: string;
  avg7: number;
  avg30: number;
  rate: number; // kg/week
  estDays: number | null;
  total: number; // total change since start
  regularity: number; // % of last 14 days with a weigh-in
  count: number;
}

export function calculateWeightStats(
  weights: WeightEntry[],
  heightCm: number,
  goalWeight: number
): WeightStats | null {
  if (!weights.length) return null;

  const cur = weights[weights.length - 1].w;
  const start = weights[0].w;
  const mn = Math.min(...weights.map((x) => x.w));
  const mx = Math.max(...weights.map((x) => x.w));

  const hm = heightCm / 100;
  const bmi = hm > 0 ? (cur / (hm * hm)).toFixed(1) : "--";

  const now = new Date();

  // 7-day average
  const d7 = new Date(now);
  d7.setDate(d7.getDate() - 7);
  const d7Str = d7.toISOString().slice(0, 10);
  const w7 = weights.filter((x) => x.date >= d7Str);
  const avg7 = w7.length
    ? +(w7.reduce((s, x) => s + x.w, 0) / w7.length).toFixed(1)
    : cur;

  // 30-day average
  const d30 = new Date(now);
  d30.setDate(d30.getDate() - 30);
  const d30Str = d30.toISOString().slice(0, 10);
  const w30 = weights.filter((x) => x.date >= d30Str);
  const avg30 = w30.length
    ? +(w30.reduce((s, x) => s + x.w, 0) / w30.length).toFixed(1)
    : cur;

  // Weekly rate (kg/week)
  let rate = 0;
  if (w7.length >= 2) {
    rate = +(
      ((w7[w7.length - 1].w - w7[0].w) / (w7.length - 1)) *
      7
    ).toFixed(2);
  } else if (weights.length >= 2) {
    const days = Math.max(
      1,
      (new Date(weights[weights.length - 1].date).getTime() -
        new Date(weights[0].date).getTime()) /
        86400000
    );
    rate = +(((cur - start) / days) * 7).toFixed(2);
  }

  // Estimated days to goal
  let estDays: number | null = null;
  if (
    rate !== 0 &&
    ((cur > goalWeight && rate < 0) || (cur < goalWeight && rate > 0))
  ) {
    estDays = Math.ceil((Math.abs(cur - goalWeight) / Math.abs(rate)) * 7);
  }

  // Regularity (% of last 14 days with a weigh-in)
  const d14 = new Date(now);
  d14.setDate(d14.getDate() - 14);
  const d14Str = d14.toISOString().slice(0, 10);
  const w14 = weights.filter((x) => x.date >= d14Str);
  const regularity = Math.round((w14.length / 14) * 100);

  return {
    current: cur,
    start,
    min: mn,
    max: mx,
    bmi,
    avg7,
    avg30,
    rate,
    estDays,
    total: +(cur - start).toFixed(1),
    regularity,
    count: weights.length,
  };
}
