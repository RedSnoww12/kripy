export interface UnitPreset {
  label: string;
  grams: number;
}

export const UNIT_PRESETS: Record<string, UnitPreset[]> = {
  'Oeuf entier': [{ label: 'œuf', grams: 50 }],
  'Oeuf dur': [{ label: 'œuf', grams: 50 }],
  'Oeuf mollet': [{ label: 'œuf', grams: 50 }],
  'Oeuf poche': [{ label: 'œuf', grams: 50 }],
  'Oeuf brouille': [{ label: 'œuf', grams: 50 }],
  'Blanc oeuf': [{ label: 'blanc', grams: 33 }],
  'Jaune oeuf': [{ label: 'jaune', grams: 17 }],

  'Yaourt grec 0%': [{ label: 'pot', grams: 150 }],
  'Yaourt grec 2%': [{ label: 'pot', grams: 150 }],
  'Yaourt grec 10%': [{ label: 'pot', grams: 150 }],
  'Yaourt nature': [{ label: 'pot', grams: 125 }],
  'Yaourt nature 0%': [{ label: 'pot', grams: 125 }],
  'Yaourt sucre': [{ label: 'pot', grams: 125 }],
  'Yaourt fruits': [{ label: 'pot', grams: 125 }],
  'Yaourt aux cereales': [{ label: 'pot', grams: 125 }],

  'Pain complet': [{ label: 'tranche', grams: 30 }],
  'Pain blanc': [{ label: 'tranche', grams: 30 }],
  'Pain de mie': [{ label: 'tranche', grams: 25 }],
  'Pain de mie complet': [{ label: 'tranche', grams: 25 }],
  'Pain seigle': [{ label: 'tranche', grams: 30 }],

  Biscotte: [{ label: 'biscotte', grams: 8 }],
  Madeleine: [{ label: 'madeleine', grams: 25 }],

  Banane: [{ label: 'banane', grams: 120 }],
  'Banane plantain': [{ label: 'banane', grams: 150 }],
  Pomme: [{ label: 'pomme', grams: 150 }],
  'Pomme golden': [{ label: 'pomme', grams: 150 }],
  'Pomme granny': [{ label: 'pomme', grams: 150 }],
  'Pomme royal gala': [{ label: 'pomme', grams: 150 }],

  'Compote pomme': [{ label: 'gourde', grams: 90 }],
  'Compote poire': [{ label: 'gourde', grams: 90 }],
  'Compote pruneau': [{ label: 'gourde', grams: 90 }],
  'Compote sans sucre': [{ label: 'gourde', grams: 90 }],
};

export function getUnitPresets(foodName: string): UnitPreset[] {
  return UNIT_PRESETS[foodName] ?? [];
}
