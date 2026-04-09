/** Food data: [kcal, prot, gluc, lip, fib] per 100g */
export type FoodData = [number, number, number, number, number];

export interface NutrientResult {
  kcal: number;
  prot: number;
  gluc: number;
  lip: number;
  fib: number;
}

/** Calculate nutrients for a given quantity of food */
export function calculateNutrients(
  foodData: FoodData,
  quantityGrams: number
): NutrientResult {
  const multiplier = quantityGrams / 100;
  return {
    kcal: Math.round(foodData[0] * multiplier * 10) / 10,
    prot: Math.round(foodData[1] * multiplier * 10) / 10,
    gluc: Math.round(foodData[2] * multiplier * 10) / 10,
    lip: Math.round(foodData[3] * multiplier * 10) / 10,
    fib: Math.round((foodData[4] || 0) * multiplier * 10) / 10,
  };
}

/** Normalize string for food search (remove accents, lowercase) */
export function normalizeSearch(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
