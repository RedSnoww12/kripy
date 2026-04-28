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

  const normalizedQuery = normalize(trimmed);
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  const foods = getAllFoods(recipes, barcodes);

  const scored: { name: string; tuple: FoodTuple; score: number }[] = [];
  for (const [name, tuple] of Object.entries(foods)) {
    const haystack = normalize(name);
    if (!tokens.every((t) => haystack.includes(t))) continue;

    let score = 0;
    if (haystack === normalizedQuery) score += 1000;
    else if (haystack.startsWith(normalizedQuery)) score += 500;
    else if (haystack.includes(normalizedQuery)) score += 200;
    for (const t of tokens) {
      if (haystack.startsWith(t)) score += 50;
      if (new RegExp(`\\b${t}`).test(haystack)) score += 20;
    }
    score -= haystack.length;

    scored.push({ name, tuple, score });
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, SEARCH_LIMIT)
    .map(({ name, tuple }) => ({ name, tuple }));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export type Basis =
  | { kind: 'per100g' }
  | { kind: 'perUnit'; label: string };

const PER_100G: Basis = { kind: 'per100g' };

export function computeMealEntry(
  food: string,
  tuple: FoodTuple,
  qty: number,
  slot: MealSlot,
  unit?: MealEntryUnit,
  basis: Basis = PER_100G,
): MealEntry {
  const [kcal, p, g, l, f] = tuple;
  const isPerUnit = basis.kind === 'perUnit';
  const m = isPerUnit ? qty : qty / 100;
  const effectiveUnit: MealEntryUnit | undefined = isPerUnit
    ? { label: basis.label, count: qty, grams: 0 }
    : unit;
  return {
    id: Date.now(),
    food,
    qty: isPerUnit ? 0 : Math.round(qty),
    kcal: round1(kcal * m),
    p: round1(p * m),
    g: round1(g * m),
    l: round1(l * m),
    f: round1(f * m),
    meal: slot,
    ...(effectiveUnit ? { unit: effectiveUnit } : {}),
  };
}

export function applyQtyChange(
  entry: MealEntry,
  tuple: FoodTuple,
  newQty: number,
  unit?: MealEntryUnit | null,
  basis: Basis = PER_100G,
): MealEntry {
  const [kcal, p, g, l, f] = tuple;
  const isPerUnit = basis.kind === 'perUnit';
  const m = isPerUnit ? newQty : newQty / 100;
  const next: MealEntry = {
    ...entry,
    qty: isPerUnit ? 0 : Math.round(newQty),
    kcal: round1(kcal * m),
    p: round1(p * m),
    g: round1(g * m),
    l: round1(l * m),
    f: round1(f * m),
  };
  if (isPerUnit) {
    next.unit = { label: basis.label, count: newQty, grams: 0 };
  } else if (unit === null) {
    delete next.unit;
  } else if (unit) {
    next.unit = unit;
  }
  return next;
}
