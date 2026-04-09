/** Kcal per gram for each macro */
export const P_KCAL = 4; // Protein
export const G_KCAL = 4; // Glucose/Carbs
export const L_KCAL = 9; // Lipids/Fat

export interface MacroPreset {
  p: number; // % protein
  g: number; // % carbs
  l: number; // % fat
}

export const MACRO_PRESETS: Record<string, MacroPreset> = {
  Equilibre: { p: 30, g: 40, l: 30 },
  "High Prot": { p: 40, g: 35, l: 25 },
  Keto: { p: 25, g: 5, l: 70 },
  "Low Fat": { p: 35, g: 50, l: 15 },
  Zone: { p: 30, g: 40, l: 30 },
};

/** Convert preset percentages to grams for a given calorie target */
export function presetToGrams(
  kcal: number,
  preset: MacroPreset
): { prot: number; gluc: number; lip: number } {
  return {
    prot: Math.round((kcal * (preset.p / 100)) / P_KCAL),
    gluc: Math.round((kcal * (preset.g / 100)) / G_KCAL),
    lip: Math.round((kcal * (preset.l / 100)) / L_KCAL),
  };
}

/** Calculate total kcal from macro grams */
export function macrosToKcal(prot: number, gluc: number, lip: number): number {
  return prot * P_KCAL + gluc * G_KCAL + lip * L_KCAL;
}
