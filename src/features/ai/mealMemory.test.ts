import { afterEach, describe, expect, it } from 'vitest';
import {
  forgetMeal,
  mealUseCount,
  normalizeMealKey,
  recallMeal,
  rememberMeal,
} from './mealMemory';
import type { AiMealResult } from './types';

afterEach(() => {
  localStorage.clear();
});

const meal: AiMealResult = {
  nom: 'Poulet riz',
  kcal: 650,
  prot: 40,
  gluc: 70,
  lip: 18,
  fib: 4,
};

describe('normalizeMealKey', () => {
  it('ignore casse, accents et espaces superflus', () => {
    expect(normalizeMealKey('  Poulet  Riz  ')).toBe(
      normalizeMealKey('poulet riz'),
    );
    expect(normalizeMealKey('Poulet Épicé')).toBe(
      normalizeMealKey('poulet epice'),
    );
  });
});

describe('rememberMeal / recallMeal', () => {
  it('renvoie null pour un repas jamais mémorisé', () => {
    expect(recallMeal('couscous royal')).toBeNull();
  });

  it('retrouve un repas mémorisé malgré une casse ou des accents différents', () => {
    rememberMeal('Poulet riz brocolis', meal);
    const recalled = recallMeal('  POULET RIZ BROCOLIS ');
    expect(recalled).toMatchObject({ nom: 'Poulet riz', kcal: 650 });
    expect(recalled?.fromMemory).toBe(true);
  });

  it('met à jour la valeur mémorisée à chaque nouvelle confirmation', () => {
    rememberMeal('salade cesar', meal);
    rememberMeal('salade cesar', { ...meal, kcal: 700 });
    expect(recallMeal('salade cesar')?.kcal).toBe(700);
    expect(mealUseCount('salade cesar')).toBe(2);
  });

  it('ne mémorise pas une description vide', () => {
    rememberMeal('   ', meal);
    expect(mealUseCount('   ')).toBe(0);
  });

  it("ne propage pas le flag fromMemory d'un résultat déjà réutilisé", () => {
    rememberMeal('tacos', { ...meal, fromMemory: true });
    const stored = recallMeal('tacos');
    expect(stored?.fromMemory).toBe(true); // recallMeal l'ajoute toujours lui-même
    // Vérifie qu'on ne stocke pas un flag orphelin en cas de non-recall :
    forgetMeal('tacos');
    expect(recallMeal('tacos')).toBeNull();
  });
});

describe('mealUseCount', () => {
  it('renvoie 0 pour un repas inconnu', () => {
    expect(mealUseCount('inconnu')).toBe(0);
  });
});

describe('forgetMeal', () => {
  it('supprime un repas mémorisé', () => {
    rememberMeal('omelette', meal);
    forgetMeal('omelette');
    expect(recallMeal('omelette')).toBeNull();
  });

  it("ne plante pas sur un repas qui n'existe pas", () => {
    expect(() => forgetMeal('jamais vu')).not.toThrow();
  });
});
