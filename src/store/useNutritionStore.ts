import { create } from 'zustand';
import { loadJSON, saveJSON, STORAGE_KEYS } from '@/lib/storage';
import type {
  BarcodesDict,
  LogByDate,
  MealEntry,
  RecipePortionsDict,
  RecipeUnitsDict,
  RecipesDict,
} from '@/types';

const RECENT_MAX = 10;
const FAV_MAX = 30;

interface NutritionState {
  log: LogByDate;
  recipes: RecipesDict;
  recipePortions: RecipePortionsDict;
  recipeUnits: RecipeUnitsDict;
  barcodes: BarcodesDict;
  favs: string[];
  recent: string[];
  savedMeals: MealEntry[][];

  addMealEntry: (date: string, entry: MealEntry) => void;
  updateMealEntry: (
    date: string,
    id: number,
    patch: Partial<MealEntry>,
  ) => void;
  removeMealEntry: (date: string, id: number) => void;
  setDayLog: (date: string, entries: MealEntry[]) => void;
  setRecipes: (recipes: RecipesDict) => void;
  setRecipePortions: (portions: RecipePortionsDict) => void;
  setRecipeUnits: (units: RecipeUnitsDict) => void;
  setBarcodes: (barcodes: BarcodesDict) => void;
  toggleFav: (food: string) => void;
  pushRecent: (food: string) => void;
  setSavedMeals: (meals: MealEntry[][]) => void;
  rehydrate: () => void;
}

function readAll() {
  return {
    log: loadJSON<LogByDate>(STORAGE_KEYS.log, {}),
    recipes: loadJSON<RecipesDict>(STORAGE_KEYS.recipes, {}),
    recipePortions: loadJSON<RecipePortionsDict>(
      STORAGE_KEYS.recipePortions,
      {},
    ),
    recipeUnits: loadJSON<RecipeUnitsDict>(STORAGE_KEYS.recipeUnits, {}),
    barcodes: loadJSON<BarcodesDict>(STORAGE_KEYS.barcodes, {}),
    favs: loadJSON<string[]>(STORAGE_KEYS.favs, []),
    recent: loadJSON<string[]>(STORAGE_KEYS.recent, []),
    savedMeals: loadJSON<MealEntry[][]>(STORAGE_KEYS.savedMeals, []),
  };
}

export const useNutritionStore = create<NutritionState>((set, get) => ({
  ...readAll(),

  addMealEntry: (date, entry) => {
    const log = { ...get().log };
    log[date] = [...(log[date] ?? []), entry];
    saveJSON(STORAGE_KEYS.log, log);
    set({ log });
  },

  updateMealEntry: (date, id, patch) => {
    const log = { ...get().log };
    const day = log[date];
    if (!day) return;
    const idx = day.findIndex((e) => e.id === id);
    if (idx < 0) return;
    const next = [...day];
    next[idx] = { ...next[idx], ...patch };
    log[date] = next;
    saveJSON(STORAGE_KEYS.log, log);
    set({ log });
  },

  removeMealEntry: (date, id) => {
    const log = { ...get().log };
    const day = (log[date] ?? []).filter((e) => e.id !== id);
    if (day.length === 0) delete log[date];
    else log[date] = day;
    saveJSON(STORAGE_KEYS.log, log);
    set({ log });
  },

  setDayLog: (date, entries) => {
    const log = { ...get().log };
    if (entries.length === 0) delete log[date];
    else log[date] = entries;
    saveJSON(STORAGE_KEYS.log, log);
    set({ log });
  },

  setRecipes: (recipes) => {
    saveJSON(STORAGE_KEYS.recipes, recipes);
    set({ recipes });
  },

  setRecipePortions: (recipePortions) => {
    saveJSON(STORAGE_KEYS.recipePortions, recipePortions);
    set({ recipePortions });
  },

  setRecipeUnits: (recipeUnits) => {
    saveJSON(STORAGE_KEYS.recipeUnits, recipeUnits);
    set({ recipeUnits });
  },

  setBarcodes: (barcodes) => {
    saveJSON(STORAGE_KEYS.barcodes, barcodes);
    set({ barcodes });
  },

  toggleFav: (food) => {
    const favs = get().favs;
    const exists = favs.includes(food);
    const next = exists
      ? favs.filter((f) => f !== food)
      : [food, ...favs].slice(0, FAV_MAX);
    saveJSON(STORAGE_KEYS.favs, next);
    set({ favs: next });
  },

  pushRecent: (food) => {
    const filtered = get().recent.filter((f) => f !== food);
    const next = [food, ...filtered].slice(0, RECENT_MAX);
    saveJSON(STORAGE_KEYS.recent, next);
    set({ recent: next });
  },

  setSavedMeals: (meals) => {
    saveJSON(STORAGE_KEYS.savedMeals, meals);
    set({ savedMeals: meals });
  },

  rehydrate: () => set(readAll()),
}));
