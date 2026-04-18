import type { ActivityLevel } from '@/types';

export interface ActivityDerivation {
  stepFactor: number;
  sportFactor: number;
  factor: number;
  level: ActivityLevel;
}

export function deriveActivity(steps: number, sport: number): ActivityLevel {
  return deriveActivityDetailed(steps, sport).level;
}

export function deriveActivityDetailed(
  steps: number,
  sport: number,
): ActivityDerivation {
  const stepFactor =
    steps < 5000 ? 1.2 : steps < 8000 ? 1.35 : steps < 11000 ? 1.5 : 1.65;
  const sportFactor =
    sport === 0 ? 0 : sport <= 2 ? 0.05 : sport <= 4 ? 0.1 : 0.175;
  const factor = +(stepFactor + sportFactor).toFixed(2);
  const level: ActivityLevel =
    factor < 1.3
      ? 'sedentary'
      : factor < 1.5
        ? 'light'
        : factor < 1.7
          ? 'moderate'
          : factor < 1.9
            ? 'active'
            : 'very_active';
  return { stepFactor, sportFactor, factor, level };
}
