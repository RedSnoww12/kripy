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

export type RecipesDict = Record<string, FoodTuple>;

export interface UnitPreset {
  label: string;
  grams: number;
}

export type RecipePortion = UnitPreset;

export type RecipePortionsDict = Record<string, RecipePortion[]>;

export interface BarcodeEntry {
  name: string;
  kcal: number;
  p: number;
  g: number;
  l: number;
  f?: number;
}

export type BarcodesDict = Record<string, BarcodeEntry>;
