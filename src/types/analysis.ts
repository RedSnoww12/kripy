import type { Phase } from './user';

export interface Palier {
  kcal: number;
  phase: Phase;
  startDate: string;
}

export interface PalierTimelinePoint {
  date: string;
  tgKcal: number;
}

export type TrendDirection =
  | 'observing'
  | 'down_fast'
  | 'down'
  | 'stable'
  | 'up'
  | 'up_fast';

export type TrendConfidence = 'high' | 'medium' | 'low' | 'pending';

export interface TrendResult {
  dir: TrendDirection;
  rate: number;
  confidence: TrendConfidence;
  window: number;
  sampleSize: number;
  r2: number;
  daysOnPalier: number;
  daysNeeded: number;
  idealDays: number;
  palierKcal: number;
  avgAct: number;
  avgTg: number;
  adherence: number | null;
  trackedDays: number;
}

export interface PhaseTrendResult {
  count: number;
  phase: Phase;
  rate?: number;
  r2?: number;
  startDate?: string;
  endDate?: string;
  totalChange?: number;
}

export interface WeightStats {
  cur: number;
  start: number;
  mn: number;
  mx: number;
  bmi: string;
  avg7: number;
  avg30: number;
  rate: number;
  estDays: number | null;
  total: number;
  reg: number;
  count: number;
}

export type RecommendAction = 'maintenir' | '+200' | '-200' | 'observer';
export type RecommendTone = 'info' | 'success' | 'warn' | 'danger';

export interface Recommendation {
  act: RecommendAction;
  msg: string;
  tp: RecommendTone;
  reason: string;
}

export interface LinRegResult {
  slope: number;
  intercept: number;
  r2: number;
  ssRes: number;
  n: number;
}

export interface LinRegPoint {
  x: number;
  y: number;
}
