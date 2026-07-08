export type TrainingStyle =
  | 'hypertrophy'
  | 'strength'
  | 'powerlifting'
  | 'endurance'
  | 'streetworkout'
  | 'streetlifting'
  | 'crosstraining'
  | 'general';

export interface CustomExercise {
  id: string;
  name: string;
  /** true = exercice au poids du corps (la charge saisie = lest ajouté). */
  bodyweight: boolean;
}

/** Un exercice tel que planifié dans une séance type : cible fixée à l'avance. */
export interface PlannedExercise {
  exerciseId: string;
  /** Nombre de séries visées. */
  sets: number;
  repsMin: number;
  repsMax: number;
  /**
   * Poids de départ recommandé par l'analyse IA post-séance pour la
   * prochaine occurrence de cette séance type. Reste valable tant qu'aucune
   * séance réelle plus récente que `aiTargetSourceSessionId` n'a eu lieu
   * pour cet exercice — after quoi la prescription algorithmique
   * (`suggestNext`) reprend la main normalement.
   */
  aiTargetWeight?: number;
  aiTargetSourceSessionId?: number;
}

/** Une séance nommée par l'utilisateur (ex. "Upper A") avec ses exercices cibles. */
export interface SessionTemplate {
  id: string;
  name: string;
  exercises: PlannedExercise[];
}

export interface TrainingProfile {
  style: TrainingStyle;
  /** Nombre de séances visées par semaine (1..7). */
  sessionsPerWeek: number;
  /** Séances définies par l'utilisateur (nom + exercices/séries/reps cibles). */
  sessionTemplates: SessionTemplate[];
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
  /** Nom de la séance (celui de la séance type suivie, ou libre). */
  label: string;
  /** Id de la séance type suivie, absent pour une séance libre. */
  templateId?: string;
  exercises: SessionExercise[];
  /** Ressenti global de la séance (1 = épuisé … 5 = excellent). */
  feel?: number;
  dur?: number;
  notes?: string;
}
