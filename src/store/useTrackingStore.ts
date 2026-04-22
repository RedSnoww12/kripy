import { create } from 'zustand';
import { loadJSON, saveJSON, STORAGE_KEYS } from '@/lib/storage';
import type { StepsByDate, WaterByDate, WeightEntry, Workout } from '@/types';

interface TrackingState {
  weights: WeightEntry[];
  workouts: Workout[];
  steps: StepsByDate;
  water: WaterByDate;
  weightSkipped: string[];

  addWeight: (entry: WeightEntry) => void;
  setWeights: (weights: WeightEntry[]) => void;
  addWorkout: (workout: Workout) => void;
  removeWorkout: (id: number) => void;
  setWorkouts: (workouts: Workout[]) => void;
  setStepsForDate: (date: string, value: number) => void;
  setWaterForDate: (date: string, value: number) => void;
  skipWeightForDate: (date: string) => void;
  unskipWeightForDate: (date: string) => void;
  rehydrate: () => void;
}

function readAll() {
  return {
    weights: loadJSON<WeightEntry[]>(STORAGE_KEYS.weights, []),
    workouts: loadJSON<Workout[]>(STORAGE_KEYS.workouts, []),
    steps: loadJSON<StepsByDate>(STORAGE_KEYS.steps, {}),
    water: loadJSON<WaterByDate>(STORAGE_KEYS.water, {}),
    weightSkipped: loadJSON<string[]>(STORAGE_KEYS.weightSkipped, []),
  };
}

export const useTrackingStore = create<TrackingState>((set, get) => ({
  ...readAll(),

  addWeight: (entry) => {
    const weights = [...get().weights, entry];
    saveJSON(STORAGE_KEYS.weights, weights);
    set({ weights });
  },
  setWeights: (weights) => {
    saveJSON(STORAGE_KEYS.weights, weights);
    set({ weights });
  },
  addWorkout: (workout) => {
    const workouts = [...get().workouts, workout];
    saveJSON(STORAGE_KEYS.workouts, workouts);
    set({ workouts });
  },
  removeWorkout: (id) => {
    const workouts = get().workouts.filter((w) => w.id !== id);
    saveJSON(STORAGE_KEYS.workouts, workouts);
    set({ workouts });
  },
  setWorkouts: (workouts) => {
    saveJSON(STORAGE_KEYS.workouts, workouts);
    set({ workouts });
  },
  setStepsForDate: (date, value) => {
    const steps = { ...get().steps, [date]: value };
    saveJSON(STORAGE_KEYS.steps, steps);
    set({ steps });
  },
  setWaterForDate: (date, value) => {
    const water = { ...get().water, [date]: value };
    saveJSON(STORAGE_KEYS.water, water);
    set({ water });
  },
  skipWeightForDate: (date) => {
    const current = get().weightSkipped;
    if (current.includes(date)) return;
    const weightSkipped = [...current, date];
    saveJSON(STORAGE_KEYS.weightSkipped, weightSkipped);
    set({ weightSkipped });
  },
  unskipWeightForDate: (date) => {
    const weightSkipped = get().weightSkipped.filter((d) => d !== date);
    saveJSON(STORAGE_KEYS.weightSkipped, weightSkipped);
    set({ weightSkipped });
  },
  rehydrate: () => set(readAll()),
}));
