import { describe, expect, it } from 'vitest';
import { checkMealPlausibility } from './mealCheck';
import { applyMealMargin } from './mealMargin';
import type { AiMealResult } from './types';

const meal: AiMealResult = {
  nom: 'Pâtes carbo',
  kcal: 700,
  prot: 30,
  gluc: 80,
  lip: 28,
  fib: 4,
  details: 'Pâtes 250g, lardons, crème.',
};

describe('applyMealMargin', () => {
  it('majore kcal et macros du même pourcentage', () => {
    const adjusted = applyMealMargin(meal, 10);
    expect(adjusted.kcal).toBe(770);
    expect(adjusted.prot).toBe(33);
    expect(adjusted.gluc).toBe(88);
    expect(adjusted.lip).toBe(31);
    expect(adjusted.fib).toBe(4);
  });

  it('mentionne la marge dans les détails', () => {
    expect(applyMealMargin(meal, 15).details).toContain('+15 %');
  });

  it('préserve la cohérence Atwater (aucun avertissement induit)', () => {
    expect(checkMealPlausibility(meal)).toEqual([]);
    expect(checkMealPlausibility(applyMealMargin(meal, 15))).toEqual([]);
  });

  it('renvoie le résultat inchangé pour une marge nulle ou invalide', () => {
    expect(applyMealMargin(meal, 0)).toBe(meal);
    expect(applyMealMargin(meal, -5)).toBe(meal);
    expect(applyMealMargin(meal, NaN)).toBe(meal);
  });

  it('ajoute la mention même sans détails existants', () => {
    const bare = { ...meal, details: undefined };
    expect(applyMealMargin(bare, 5).details).toBe(
      'Marge de sécurité +5 % incluse (repas non maîtrisé).',
    );
  });
});
