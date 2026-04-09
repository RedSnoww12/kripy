import { PHASE_MULTIPLIERS, type PhaseId } from "./phases";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sédentaire",
  light: "Légèrement actif",
  moderate: "Modérément actif",
  active: "Actif",
  very_active: "Très actif",
};

/** Mifflin-St Jeor (male approximation, assumes ~30 years) */
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number = 30
): number {
  return 10 * weightKg + 6.25 * heightCm - 5 * age - 5;
}

/** Step bonus: each step above 5000 adds 0.04 kcal */
export function calculateStepBonus(steps: number): number {
  return Math.round(Math.max(0, (steps - 5000) * 0.04));
}

/** Full TDEE calculation with phase multiplier */
export function calculateTDEE(
  weightKg: number,
  heightCm: number,
  activityLevel: ActivityLevel,
  steps: number,
  phase: PhaseId,
  age: number = 30
): number {
  const bmr = calculateBMR(weightKg, heightCm, age);
  const actMult = ACTIVITY_MULTIPLIERS[activityLevel] ?? 1.55;
  const tdeeBase = Math.round(bmr * actMult);
  const stepBonus = calculateStepBonus(steps);
  const tdeeRaw = tdeeBase + stepBonus;
  const phaseMult = PHASE_MULTIPLIERS[phase];
  return Math.round(tdeeRaw * phaseMult);
}

/** Default macro split from TDEE */
export function calculateDefaultMacros(
  tdee: number,
  weightKg: number
): { prot: number; gluc: number; lip: number } {
  const prot = Math.round(weightKg * 2);
  const lip = Math.round(weightKg * 1);
  const gluc = Math.max(0, Math.round((tdee - prot * 4 - lip * 9) / 4));
  return { prot, gluc, lip };
}
