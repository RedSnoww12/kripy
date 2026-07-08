export type TrainingStyle =
  | 'hypertrophy'
  | 'strength'
  | 'powerlifting'
  | 'endurance'
  | 'streetworkout'
  | 'streetlifting'
  | 'crosstraining'
  | 'general';

export type SplitType = 'ppl' | 'upper_lower' | 'fullbody' | 'free';

export interface CustomExercise {
  id: string;
  name: string;
  /** true = exercice au poids du corps (la charge saisie = lest ajouté). */
  bodyweight: boolean;
}

export interface TrainingProfile {
  style: TrainingStyle;
  split: SplitType;
  /** Nombre de séances visées par semaine (1..7). */
  sessionsPerWeek: number;
  /** Ids d'exercices suivis pour la surcharge progressive. */
  trackedExercises: string[];
  customExercises: CustomExercise[];
}

export interface StrengthSet {
  /** Charge en kg. Pour un exercice PDC : lest ajouté (0 = poids du corps). */
  w: number;
  /** Répétitions. */
  r: number;
  /** RPE ressenti après la série (6..10). */
  rpe?: number;
}

export interface SessionExercise {
  exerciseId: string;
  sets: StrengthSet[];
}

export interface StrengthSession {
  id: number;
  date: string;
  /** Jour du split : Push, Pull, Legs, Upper, Lower, Full Body… */
  label: string;
  exercises: SessionExercise[];
  /** Ressenti global de la séance (1 = épuisé … 5 = excellent). */
  feel?: number;
  dur?: number;
  notes?: string;
}
