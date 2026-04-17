import { ACTIVITY_MULTIPLIERS, PHASE_MULTIPLIERS } from '@/data/constants';
import type { ActivityLevel, Phase, Targets } from '@/types';

export interface TdeeInput {
  weight: number;
  heightCm: number;
  stepsGoal: number;
  activity: ActivityLevel;
  phase: Phase;
}

export interface TdeeResult {
  bmr: number;
  activityMultiplier: number;
  tdeeBase: number;
  stepBonus: number;
  tdeeRaw: number;
  phaseMultiplier: number;
  tdee: number;
  targets: Targets;
}

const STEP_BASELINE = 5000;
const STEP_KCAL_PER_STEP = 0.04;

export function computeBmr(weight: number, heightCm: number): number {
  return 10 * weight + 6.25 * heightCm - 5 * 30 - 5;
}

export function computeTdee(input: TdeeInput): TdeeResult {
  const bmr = computeBmr(input.weight, input.heightCm);
  const activityMultiplier = ACTIVITY_MULTIPLIERS[input.activity];
  const tdeeBase = Math.round(bmr * activityMultiplier);
  const stepBonus = Math.round(
    Math.max(0, (input.stepsGoal - STEP_BASELINE) * STEP_KCAL_PER_STEP),
  );
  const tdeeRaw = tdeeBase + stepBonus;
  const phaseMultiplier = PHASE_MULTIPLIERS[input.phase];
  const tdee = Math.round(tdeeRaw * phaseMultiplier);

  const prot = Math.round(input.weight * 2);
  const lip = Math.round(input.weight);
  const gluc = Math.max(0, Math.round((tdee - prot * 4 - lip * 9) / 4));
  const fib = Math.round((14 * tdee) / 1000);

  return {
    bmr: Math.round(bmr),
    activityMultiplier,
    tdeeBase,
    stepBonus,
    tdeeRaw,
    phaseMultiplier,
    tdee,
    targets: { kcal: tdee, prot, gluc, lip, fib },
  };
}
