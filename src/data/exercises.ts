import type { CustomExercise, SplitType, TrainingStyle } from '@/types';

export interface ExerciseDef {
  id: string;
  name: string;
  muscle: string;
  /** true = poids du corps : la charge saisie représente le lest ajouté. */
  bodyweight: boolean;
}

export const EXERCISE_CATALOG: readonly ExerciseDef[] = [
  // Bas du corps
  { id: 'squat', name: 'Squat', muscle: 'Jambes', bodyweight: false },
  {
    id: 'front_squat',
    name: 'Front squat',
    muscle: 'Jambes',
    bodyweight: false,
  },
  { id: 'leg_press', name: 'Presse', muscle: 'Jambes', bodyweight: false },
  {
    id: 'deadlift',
    name: 'Soulevé de terre',
    muscle: 'Chaîne post.',
    bodyweight: false,
  },
  {
    id: 'rdl',
    name: 'SDT roumain',
    muscle: 'Chaîne post.',
    bodyweight: false,
  },
  {
    id: 'hip_thrust',
    name: 'Hip thrust',
    muscle: 'Chaîne post.',
    bodyweight: false,
  },
  { id: 'lunges', name: 'Fentes', muscle: 'Jambes', bodyweight: false },
  {
    id: 'leg_curl',
    name: 'Leg curl',
    muscle: 'Chaîne post.',
    bodyweight: false,
  },
  {
    id: 'leg_extension',
    name: 'Leg extension',
    muscle: 'Jambes',
    bodyweight: false,
  },
  { id: 'calf_raise', name: 'Mollets', muscle: 'Jambes', bodyweight: false },
  {
    id: 'pistol_squat',
    name: 'Pistol squat',
    muscle: 'Jambes',
    bodyweight: true,
  },
  // Poussée
  { id: 'bench', name: 'Développé couché', muscle: 'Pecs', bodyweight: false },
  {
    id: 'incline_bench',
    name: 'Développé incliné',
    muscle: 'Pecs',
    bodyweight: false,
  },
  {
    id: 'db_press',
    name: 'Développé haltères',
    muscle: 'Pecs',
    bodyweight: false,
  },
  { id: 'dips', name: 'Dips', muscle: 'Pecs', bodyweight: true },
  { id: 'pushups', name: 'Pompes', muscle: 'Pecs', bodyweight: true },
  {
    id: 'ohp',
    name: 'Développé militaire',
    muscle: 'Épaules',
    bodyweight: false,
  },
  {
    id: 'lateral_raise',
    name: 'Élévations latérales',
    muscle: 'Épaules',
    bodyweight: false,
  },
  {
    id: 'handstand_pushup',
    name: 'HSPU',
    muscle: 'Épaules',
    bodyweight: true,
  },
  // Tirage
  { id: 'pullup', name: 'Tractions', muscle: 'Dos', bodyweight: true },
  {
    id: 'chinup',
    name: 'Tractions supination',
    muscle: 'Dos',
    bodyweight: true,
  },
  { id: 'muscle_up', name: 'Muscle-up', muscle: 'Dos', bodyweight: true },
  { id: 'barbell_row', name: 'Rowing barre', muscle: 'Dos', bodyweight: false },
  { id: 'db_row', name: 'Rowing haltère', muscle: 'Dos', bodyweight: false },
  {
    id: 'lat_pulldown',
    name: 'Tirage vertical',
    muscle: 'Dos',
    bodyweight: false,
  },
  {
    id: 'cable_row',
    name: 'Tirage horizontal',
    muscle: 'Dos',
    bodyweight: false,
  },
  { id: 'face_pull', name: 'Face pull', muscle: 'Épaules', bodyweight: false },
  { id: 'shrugs', name: 'Shrugs', muscle: 'Dos', bodyweight: false },
  // Bras
  { id: 'curl', name: 'Curl biceps', muscle: 'Bras', bodyweight: false },
  {
    id: 'hammer_curl',
    name: 'Curl marteau',
    muscle: 'Bras',
    bodyweight: false,
  },
  {
    id: 'triceps_ext',
    name: 'Extension triceps',
    muscle: 'Bras',
    bodyweight: false,
  },
  {
    id: 'skullcrusher',
    name: 'Barre au front',
    muscle: 'Bras',
    bodyweight: false,
  },
  // Tronc
  { id: 'plank', name: 'Gainage', muscle: 'Tronc', bodyweight: true },
  {
    id: 'leg_raise',
    name: 'Relevés de jambes',
    muscle: 'Tronc',
    bodyweight: true,
  },
  { id: 'ab_wheel', name: 'Roue abdos', muscle: 'Tronc', bodyweight: true },
] as const;

export interface TrainingStyleMeta {
  key: TrainingStyle;
  label: string;
  icon: string;
  desc: string;
  /** Fourchette de répétitions cible [min, max]. */
  repRange: [number, number];
}

export const TRAINING_STYLES: readonly TrainingStyleMeta[] = [
  {
    key: 'hypertrophy',
    label: 'Hypertrophie',
    icon: 'exercise',
    desc: 'Volume et prise de muscle · 6-12 reps',
    repRange: [6, 12],
  },
  {
    key: 'strength',
    label: 'Force',
    icon: 'weight',
    desc: 'Charges lourdes · 3-6 reps',
    repRange: [3, 6],
  },
  {
    key: 'powerlifting',
    label: 'Powerlifting',
    icon: 'trophy',
    desc: 'SBD & maxi · 1-5 reps',
    repRange: [1, 5],
  },
  {
    key: 'endurance',
    label: 'Endurance',
    icon: 'directions_run',
    desc: 'Résistance musculaire · 12-20+ reps',
    repRange: [12, 20],
  },
  {
    key: 'streetworkout',
    label: 'Street workout',
    icon: 'sports_gymnastics',
    desc: 'Poids du corps & skills · 5-15 reps',
    repRange: [5, 15],
  },
  {
    key: 'streetlifting',
    label: 'Street lifting',
    icon: 'fitness_center',
    desc: 'Tractions/dips lestés · 3-8 reps',
    repRange: [3, 8],
  },
  {
    key: 'crosstraining',
    label: 'Cross training',
    icon: 'bolt',
    desc: 'Mixte force + cardio · 8-15 reps',
    repRange: [8, 15],
  },
  {
    key: 'general',
    label: 'Forme générale',
    icon: 'favorite',
    desc: 'Santé & tonus · 8-15 reps',
    repRange: [8, 15],
  },
] as const;

export interface SplitMeta {
  key: SplitType;
  label: string;
  desc: string;
  days: string[];
}

export const SPLIT_TYPES: readonly SplitMeta[] = [
  {
    key: 'ppl',
    label: 'PPL',
    desc: 'Push · Pull · Legs',
    days: ['Push', 'Pull', 'Legs'],
  },
  {
    key: 'upper_lower',
    label: 'Upper / Lower',
    desc: 'Haut · Bas du corps',
    days: ['Upper', 'Lower'],
  },
  {
    key: 'fullbody',
    label: 'Full Body',
    desc: 'Tout le corps à chaque séance',
    days: ['Full Body'],
  },
  {
    key: 'free',
    label: 'Libre',
    desc: 'Sans structure imposée',
    days: ['Séance A', 'Séance B', 'Séance C'],
  },
] as const;

export function styleMeta(style: TrainingStyle): TrainingStyleMeta {
  return TRAINING_STYLES.find((s) => s.key === style) ?? TRAINING_STYLES[0];
}

export function splitMeta(split: SplitType): SplitMeta {
  return SPLIT_TYPES.find((s) => s.key === split) ?? SPLIT_TYPES[0];
}

/**
 * Résout un id d'exercice (catalogue ou personnalisé) vers son nom et son
 * mode (chargé / poids du corps).
 */
export function makeExerciseResolver(
  custom: readonly CustomExercise[],
): (id: string) => { name: string; bodyweight: boolean } | null {
  return (id) => {
    const def = EXERCISE_CATALOG.find((e) => e.id === id);
    if (def) return { name: def.name, bodyweight: def.bodyweight };
    const c = custom.find((e) => e.id === id);
    if (c) return { name: c.name, bodyweight: c.bodyweight };
    return null;
  };
}
