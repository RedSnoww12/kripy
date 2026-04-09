export type TrendDirection =
  | "down_fast"
  | "down"
  | "stable"
  | "up"
  | "up_fast"
  | "observing";

export type Confidence = "high" | "medium" | "low" | "pending";

export interface TrendResult {
  dir: TrendDirection;
  rate: number; // kg/week
  confidence: Confidence;
  sampleSize: number;
  r2: number;
  daysOnPalier: number;
  daysNeeded: number;
  idealDays: number;
  palierKcal: number;
}

export interface WeightEntry {
  date: string; // YYYY-MM-DD
  w: number; // kg
}

const MIN_DAYS = 3;
const IDEAL_DAYS = 5;

/** Days elapsed since a date (0 = same day) */
export function palierDays(startDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const s = new Date(startDate);
  s.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((today.getTime() - s.getTime()) / 86400000));
}

/** Linear regression: y = slope*x + intercept */
function linearRegression(points: { x: number; y: number }[]): {
  slope: number;
  intercept: number;
  r2: number;
} {
  const n = points.length;
  const sx = points.reduce((s, pt) => s + pt.x, 0);
  const sy = points.reduce((s, pt) => s + pt.y, 0);
  const sxx = points.reduce((s, pt) => s + pt.x * pt.x, 0);
  const sxy = points.reduce((s, pt) => s + pt.x * pt.y, 0);
  const denom = n * sxx - sx * sx;
  const slope = denom !== 0 ? (n * sxy - sx * sy) / denom : 0;
  const intercept = (sy - slope * sx) / n;
  const meanY = sy / n;
  const ssTot = points.reduce(
    (s, pt) => s + (pt.y - meanY) * (pt.y - meanY),
    0
  );
  const ssRes = points.reduce((s, pt) => {
    const pred = slope * pt.x + intercept;
    return s + (pt.y - pred) * (pt.y - pred);
  }, 0);
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
  return { slope, intercept, r2 };
}

/**
 * Trend analysis restricted to current palier.
 * Requires >=3 weigh-ins AND >=3 days on palier.
 */
export function analyzeTrend(
  weights: WeightEntry[],
  palierStartDate: string,
  palierKcal: number
): TrendResult | null {
  if (weights.length < 1) return null;

  const onPalier = weights.filter((x) => x.date >= palierStartDate);
  const days = palierDays(palierStartDate);

  if (onPalier.length < 3 || days < MIN_DAYS) {
    return {
      dir: "observing",
      rate: 0,
      confidence: "pending",
      sampleSize: onPalier.length,
      r2: 0,
      daysOnPalier: days,
      daysNeeded: MIN_DAYS,
      idealDays: IDEAL_DAYS,
      palierKcal,
    };
  }

  const t0 = new Date(onPalier[0].date).getTime();
  const pts = onPalier.map((pt) => ({
    x: (new Date(pt.date).getTime() - t0) / 86400000,
    y: pt.w,
  }));

  const { slope, r2 } = linearRegression(pts);
  const rate = +(slope * 7).toFixed(2); // kg/week

  // Confidence scoring
  const conf: Confidence =
    days >= IDEAL_DAYS && onPalier.length >= 5 && r2 >= 0.5
      ? "high"
      : days >= IDEAL_DAYS
        ? "medium"
        : "low";

  // Direction classification
  let dir: TrendDirection;
  if (rate <= -0.5) dir = "down_fast";
  else if (rate <= -0.15) dir = "down";
  else if (rate < 0.15) dir = "stable";
  else if (rate < 0.5) dir = "up";
  else dir = "up_fast";

  return {
    dir,
    rate,
    confidence: conf,
    sampleSize: onPalier.length,
    r2: +r2.toFixed(2),
    daysOnPalier: days,
    daysNeeded: MIN_DAYS,
    idealDays: IDEAL_DAYS,
    palierKcal,
  };
}
