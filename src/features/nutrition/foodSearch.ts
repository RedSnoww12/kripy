import { FOODS } from '@/data/foods';
import type {
  BarcodesDict,
  FoodTuple,
  FoodsDict,
  MealEntry,
  MealEntryUnit,
  MealSlot,
  RecipesDict,
} from '@/types';

const SEARCH_LIMIT = 14;

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function barcodesToTuples(barcodes: BarcodesDict): FoodsDict {
  const out: FoodsDict = {};
  for (const entry of Object.values(barcodes)) {
    out[entry.name] = [entry.kcal, entry.p, entry.g, entry.l, entry.f ?? 0];
  }
  return out;
}

export function getAllFoods(
  recipes: RecipesDict,
  barcodes: BarcodesDict,
): FoodsDict {
  return {
    ...FOODS,
    ...recipes,
    ...barcodesToTuples(barcodes),
  };
}

export function searchFoods(
  query: string,
  recipes: RecipesDict,
  barcodes: BarcodesDict,
): { name: string; tuple: FoodTuple }[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const needle = normalize(trimmed);
  const foods = getAllFoods(recipes, barcodes);

  return Object.entries(foods)
    .filter(([name]) => normalize(name).includes(needle))
    .slice(0, SEARCH_LIMIT)
    .map(([name, tuple]) => ({ name, tuple }));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function computeMealEntry(
  food: string,
  tuple: FoodTuple,
  qty: number,
  slot: MealSlot,
  unit?: MealEntryUnit,
): MealEntry {
  const m = qty / 100;
  const [kcal, p, g, l, f] = tuple;
  return {
    id: Date.now(),
    food,
    qty: Math.round(qty),
    kcal: round1(kcal * m),
    p: round1(p * m),
    g: round1(g * m),
    l: round1(l * m),
    f: round1(f * m),
    meal: slot,
    ...(unit ? { unit } : {}),
  };
}

export function applyQtyChange(
  entry: MealEntry,
  tuple: FoodTuple,
  newQty: number,
  unit?: MealEntryUnit | null,
): MealEntry {
  const m = newQty / 100;
  const [kcal, p, g, l, f] = tuple;
  const next: MealEntry = {
    ...entry,
    qty: Math.round(newQty),
    kcal: round1(kcal * m),
    p: round1(p * m),
    g: round1(g * m),
    l: round1(l * m),
    f: round1(f * m),
  };
  if (unit === null) {
    delete next.unit;
  } else if (unit) {
    next.unit = unit;
  }
  return next;
}
