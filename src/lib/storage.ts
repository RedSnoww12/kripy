export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveJSON<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
  notifyWrite();
}

export function removeKey(key: string): void {
  localStorage.removeItem(key);
  notifyWrite();
}

type WriteListener = () => void;
const listeners = new Set<WriteListener>();

export function onLocalWrite(listener: WriteListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyWrite(): void {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.warn('storage listener error', e);
    }
  });
}

export const STORAGE_KEYS = {
  log: 'nt_log',
  weights: 'nt_weights',
  workouts: 'nt_workouts',
  steps: 'nt_steps',
  water: 'nt_water',
  recipes: 'nt_recipes',
  recipePortions: 'nt_recipe_portions',
  recipeUnits: 'nt_recipe_units',
  favs: 'nt_favs',
  recent: 'nt_recent',
  targets: 'nt_targets',
  startWeight: 'nt_pw',
  height: 'nt_height',
  stepsGoal: 'nt_sg',
  phase: 'nt_phase',
  setup: 'nt_setup',
  theme: 'nt_theme',
  savedMeals: 'nt_savedmeals',
  palier: 'nt_palier',
  barcodes: 'nt_barcodes',
  activity: 'nt_activity',
  aiKey: 'nt_aikey',
  googleToken: 'nt_gtoken',
  tdeeConfirmed: 'nt_tdee_ok',
  name: 'nt_name',
  age: 'nt_age',
  goalWeight: 'nt_goal_w',
  sportSessions: 'nt_sport_freq',
  sex: 'nt_sex',
  weightSkipped: 'nt_weight_skipped',
} as const;

export const SYNC_KEYS: readonly string[] = [
  STORAGE_KEYS.log,
  STORAGE_KEYS.weights,
  STORAGE_KEYS.workouts,
  STORAGE_KEYS.steps,
  STORAGE_KEYS.water,
  STORAGE_KEYS.recipes,
  STORAGE_KEYS.recipePortions,
  STORAGE_KEYS.recipeUnits,
  STORAGE_KEYS.favs,
  STORAGE_KEYS.recent,
  STORAGE_KEYS.targets,
  STORAGE_KEYS.startWeight,
  STORAGE_KEYS.height,
  STORAGE_KEYS.stepsGoal,
  STORAGE_KEYS.phase,
  STORAGE_KEYS.setup,
  STORAGE_KEYS.theme,
  STORAGE_KEYS.savedMeals,
  STORAGE_KEYS.palier,
  STORAGE_KEYS.barcodes,
  STORAGE_KEYS.tdeeConfirmed,
  STORAGE_KEYS.name,
  STORAGE_KEYS.age,
  STORAGE_KEYS.goalWeight,
  STORAGE_KEYS.sportSessions,
  STORAGE_KEYS.sex,
  STORAGE_KEYS.weightSkipped,
];
