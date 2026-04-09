export interface DayTotals {
  kcal: number;
  prot: number;
  gluc: number;
  lip: number;
  fib: number;
}

export interface MealItemData {
  id: string;
  food: string;
  meal: number;
  qty: number;
  kcal: number;
  prot: number;
  gluc: number;
  lip: number;
  fib: number;
}

export interface TargetsData {
  kcal: number;
  prot: number;
  gluc: number;
  lip: number;
  fib: number;
}

export interface ProfileData {
  id: string;
  height: number;
  goalWeight: number;
  stepsGoal: number;
  activityLevel: string;
  phase: string;
  theme: string;
  setupDone: boolean;
}

export interface WeightData {
  id: string;
  date: string;
  weight: number;
}

export interface WorkoutData {
  id: string;
  date: string;
  type: string;
  duration: number;
  calories: number | null;
  notes: string | null;
  muscles: { name: string; sets: number }[];
}

export interface RecipeData {
  id: string;
  name: string;
  kcal: number;
  prot: number;
  gluc: number;
  lip: number;
  fib: number;
}
