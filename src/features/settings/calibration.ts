import { PHASE_MULTIPLIERS } from '@/data/constants';
import { deriveActivityDetailed } from './activityFromInputs';
import type { Phase } from '@/types';

export interface CalibrationData {
  name: string;
  age: number;
  height: number;
  weight: number;
  steps: number;
  sport: number;
  phase: Phase;
  targetWeight: number;
}

export interface CalibrationResult {
  bmr: number;
  actFactor: number;
  tdee: number;
  kcal: number;
  prot: number;
  gluc: number;
  lip: number;
  fib: number;
  imc: string;
}

export function computeCalibration(data: CalibrationData): CalibrationResult {
  const bmr = Math.round(
    10 * data.weight + 6.25 * data.height - 5 * data.age + 5,
  );
  const { factor } = deriveActivityDetailed(data.steps, data.sport);
  const actFactor = factor;
  const tdee = Math.round(bmr * actFactor);
  const kcal = Math.round(tdee * PHASE_MULTIPLIERS[data.phase]);
  const prot = Math.round(data.weight * 2);
  const lip = Math.round(data.weight * 1);
  const gluc = Math.max(0, Math.round((kcal - prot * 4 - lip * 9) / 4));
  const fib = Math.round((14 * kcal) / 1000);
  const imc = (data.weight / (data.height / 100) ** 2).toFixed(1);
  return { bmr, actFactor, tdee, kcal, prot, gluc, lip, fib, imc };
}
