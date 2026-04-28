import { describe, expect, it } from 'vitest';
import {
  applyQtyChange,
  computeMealEntry,
  getAllFoods,
  searchFoods,
} from './foodSearch';
import type { FoodTuple, MealEntry } from '@/types';

describe('foodSearch', () => {
  describe('searchFoods', () => {
    it('returns empty for empty query', () => {
      expect(searchFoods('', {}, {})).toEqual([]);
      expect(searchFoods('   ', {}, {})).toEqual([]);
    });

    it('finds foods case-insensitively', () => {
      const hits = searchFoods('poulet', {}, {});
      expect(hits.length).toBeGreaterThan(0);
      expect(hits.some((h) => h.name.toLowerCase().includes('poulet'))).toBe(
        true,
      );
    });

    it('is accent-insensitive (strips diacritics)', () => {
      const withoutAccent = searchFoods('epinards', {}, {});
      const withAccent = searchFoods('épinards', {}, {});
      expect(withoutAccent.length).toBeGreaterThan(0);
      expect(withoutAccent.length).toBe(withAccent.length);
    });

    it('caps results at 14', () => {
      const hits = searchFoods('a', {}, {});
      expect(hits.length).toBeLessThanOrEqual(14);
    });

    it('includes user recipes in results', () => {
      const recipes = { 'Curry maison': [280, 18, 30, 10, 4] as FoodTuple };
      const hits = searchFoods('curry maison', recipes, {});
      expect(hits.some((h) => h.name === 'Curry maison')).toBe(true);
    });

    it('includes scanned barcodes in results', () => {
      const barcodes = {
        '1234': { name: 'Skyr Auchan', kcal: 60, p: 10, g: 4, l: 0, f: 0 },
      };
      const hits = searchFoods('skyr auchan', {}, barcodes);
      expect(hits.some((h) => h.name === 'Skyr Auchan')).toBe(true);
    });
  });

  describe('getAllFoods', () => {
    it('merges FOODS + recipes + barcodes, recipes overriding FOODS', () => {
      const recipes = { Tofu: [100, 20, 5, 2, 2] as FoodTuple };
      const all = getAllFoods(recipes, {});
      expect(all.Tofu[0]).toBe(100);
    });
  });

  describe('computeMealEntry', () => {
    const tuple: FoodTuple = [200, 20, 30, 5, 3];

    it('scales macros to the requested quantity', () => {
      const e = computeMealEntry('Riz', tuple, 250, 0);
      expect(e.qty).toBe(250);
      expect(e.kcal).toBe(500);
      expect(e.p).toBe(50);
      expect(e.g).toBe(75);
      expect(e.l).toBe(12.5);
      expect(e.meal).toBe(0);
    });

    it('assigns a numeric id (timestamp)', () => {
      const e = computeMealEntry('Riz', tuple, 100, 1);
      expect(typeof e.id).toBe('number');
      expect(e.id).toBeGreaterThan(0);
    });

    it('preserves fiber field (f)', () => {
      const e = computeMealEntry('Riz', tuple, 100, 0);
      expect(e.f).toBe(3);
    });
  });

  describe('applyQtyChange', () => {
    const tuple: FoodTuple = [200, 20, 30, 5, 3];
    const entry: MealEntry = {
      id: 42,
      food: 'Riz',
      qty: 100,
      kcal: 200,
      p: 20,
      g: 30,
      l: 5,
      f: 3,
      meal: 1,
    };

    it('recomputes macros but keeps id/food/meal', () => {
      const next = applyQtyChange(entry, tuple, 150);
      expect(next.id).toBe(42);
      expect(next.food).toBe('Riz');
      expect(next.meal).toBe(1);
      expect(next.qty).toBe(150);
      expect(next.kcal).toBe(300);
      expect(next.p).toBe(30);
    });
  });

  describe('per-unit basis', () => {
    const burger: FoodTuple = [500, 25, 40, 25, 2];

    it('computeMealEntry scales by count when basis is perUnit', () => {
      const e = computeMealEntry('Burger maison', burger, 2, 1, undefined, {
        kind: 'perUnit',
        label: 'burger',
      });
      expect(e.qty).toBe(0);
      expect(e.kcal).toBe(1000);
      expect(e.p).toBe(50);
      expect(e.g).toBe(80);
      expect(e.l).toBe(50);
      expect(e.f).toBe(4);
      expect(e.unit).toEqual({ label: 'burger', count: 2, grams: 0 });
    });

    it('computeMealEntry handles fractional count', () => {
      const e = computeMealEntry('Burger maison', burger, 0.5, 0, undefined, {
        kind: 'perUnit',
        label: 'burger',
      });
      expect(e.kcal).toBe(250);
      expect(e.unit?.count).toBe(0.5);
    });

    it('applyQtyChange in perUnit mode rescales and stores unit', () => {
      const original: MealEntry = {
        id: 7,
        food: 'Burger maison',
        qty: 0,
        kcal: 500,
        p: 25,
        g: 40,
        l: 25,
        f: 2,
        meal: 2,
        unit: { label: 'burger', count: 1, grams: 0 },
      };
      const next = applyQtyChange(original, burger, 3, undefined, {
        kind: 'perUnit',
        label: 'burger',
      });
      expect(next.qty).toBe(0);
      expect(next.kcal).toBe(1500);
      expect(next.unit).toEqual({ label: 'burger', count: 3, grams: 0 });
      expect(next.meal).toBe(2);
    });

    it('default basis (per100g) preserves legacy behavior', () => {
      const e = computeMealEntry('Riz', [200, 20, 30, 5, 3], 100, 0);
      expect(e.qty).toBe(100);
      expect(e.kcal).toBe(200);
      expect(e.unit).toBeUndefined();
    });
  });
});
