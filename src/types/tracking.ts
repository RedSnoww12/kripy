import type { Phase } from './user';

export interface WeightEntry {
  date: string;
  w: number;
  tgKcal?: number;
  phase?: Phase;
}

export interface MuscleVolume {
  name: string;
  sets: number;
}

export interface Workout {
  id: number;
  date: string;
  type: string;
  dur: number;
  muscles?: MuscleVolume[];
  cal?: number;
  notes?: string;
}

export type SportCategory = 'muscu' | 'cardio' | 'sport' | 'combat';

export type Split = 'Upper' | 'Lower' | 'Push' | 'Pull' | 'Legs' | 'Full Body';

export type StepsByDate = Record<string, number>;
export type WaterByDate = Record<string, number>;
