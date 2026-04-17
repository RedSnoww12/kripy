import type { ActivityLevel, Phase, Targets, UserProfile } from '@/types';

export const DEFAULT_TARGETS: Targets = {
  kcal: 2200,
  prot: 150,
  gluc: 250,
  lip: 75,
  fib: 30,
};

export const DEFAULT_PROFILE: UserProfile = {
  height: 175,
  startWeight: 75,
  phase: 'A',
  stepsGoal: 10000,
  activity: 'moderate',
  theme: 'dark',
};

export const PHASE_NAMES: Record<Phase, string> = {
  A: 'Pre-prep',
  B: 'Deficit',
  C: 'Reverse',
  D: 'PDM',
  E: 'Reset',
  F: 'Remonte',
};

export const PHASE_MULTIPLIERS: Record<Phase, number> = {
  A: 1.0,
  B: 0.85,
  C: 0.9,
  D: 1.075,
  E: 0.88,
  F: 0.92,
};

export const ACTIVITY_LEVELS: readonly { key: ActivityLevel; label: string }[] =
  [
    { key: 'sedentary', label: 'Sédentaire' },
    { key: 'light', label: 'Léger' },
    { key: 'moderate', label: 'Modéré' },
    { key: 'active', label: 'Actif' },
    { key: 'very_active', label: 'Athlète' },
  ] as const;

export const MEAL_LABELS = [
  'Petit-déj',
  'Déjeuner',
  'Dîner',
  'Collation',
] as const;

export const PHASE_COLORS: Record<Phase, string> = {
  A: '#6AEFAF',
  B: '#FF6B9D',
  C: '#9F9BFF',
  D: '#FFB347',
  E: '#6C5CE7',
  F: '#4DD0E1',
};

export function computeTargetsFromKcal(
  kcalTarget: number,
  weight: number,
): Targets {
  const prot = Math.round(weight * 2);
  const lip = Math.round(weight);
  const gluc = Math.max(0, Math.round((kcalTarget - prot * 4 - lip * 9) / 4));
  const fib = Math.round((14 * kcalTarget) / 1000);
  return { kcal: kcalTarget, prot, gluc, lip, fib };
}
