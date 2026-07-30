export interface Macros {
  kcal: number;
  p: number;
  g: number;
  l: number;
  f?: number;
}

export interface FoodItem extends Macros {
  name: string;
}

export type FoodTuple = [
  kcal: number,
  p: number,
  g: number,
  l: number,
  f: number,
];
export type FoodsDict = Record<string, FoodTuple>;

export type MealSlot = 0 | 1 | 2 | 3;

export interface MealEntryUnit {
  label: string;
  count: number;
  grams: number;
}

export interface MealEntry extends Macros {
  id: number;
  food: string;
  qty: number;
  meal: MealSlot;
  unit?: MealEntryUnit;
}

export type DayLog = MealEntry[];
export type LogByDate = Record<string, DayLog>;

export interface Targets {
  kcal: number;
  prot: number;
  gluc: number;
  lip: number;
  fib: number;
}

export interface BudgetAdjustment {
  id: number;
  sourceDate: string;
  amount: number;
  days: number;
  startDate: string;
}

export type RecipesDict = Record<string, FoodTuple>;

export interface UnitPreset {
  label: string;
  grams: number;
}

export type RecipePortion = UnitPreset;

export type RecipePortionsDict = Record<string, RecipePortion[]>;

export interface RecipeBaseUnit {
  label: string;
}

export type RecipeUnitsDict = Record<string, RecipeBaseUnit>;

/**
 * Recette publiée par un utilisateur et visible par toute la communauté.
 * Stockée dans la collection Firestore `sharedRecipes` (une recette = un doc),
 * contrairement aux données personnelles qui vivent dans `users/{uid}`.
 */
export interface SharedRecipe {
  /** Id du document Firestore. */
  id: string;
  name: string;
  tuple: FoodTuple;
  /** Portions nommées (vide pour une recette à l'unité). */
  portions: RecipePortion[];
  /** Défini si la recette se compte à la pièce plutôt qu'aux 100g. */
  unit?: RecipeBaseUnit;
  authorUid: string;
  /** Prénom/pseudo de l'auteur, ou null s'il n'en a pas renseigné. */
  authorName: string | null;
  /** Millisecondes epoch (converti depuis le Timestamp Firestore). */
  createdAt: number;
}

export interface BarcodeEntry {
  name: string;
  kcal: number;
  p: number;
  g: number;
  l: number;
  f?: number;
}

export type BarcodesDict = Record<string, BarcodeEntry>;
