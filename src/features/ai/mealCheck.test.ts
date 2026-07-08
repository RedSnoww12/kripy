import { describe, expect, it } from 'vitest';
import { checkMealPlausibility } from './mealCheck';
import type { AiMealResult } from './types';

function meal(partial: Partial<AiMealResult>): AiMealResult {
  return {
    nom: 'Repas',
    kcal: 0,
    prot: 0,
    gluc: 0,
    lip: 0,
    fib: 0,
    ...partial,
  };
}

describe('checkMealPlausibility', () => {
  it("n'émet aucun avertissement pour un repas cohérent avec Atwater", () => {
    // 40*4 + 70*4 + 18*9 = 602 kcal, proche des 610 déclarées (~1.3%)
    const warnings = checkMealPlausibility(
      meal({ kcal: 610, prot: 40, gluc: 70, lip: 18 }),
    );
    expect(warnings).toEqual([]);
  });

  it('tolère un léger écart Atwater (arrondis)', () => {
    const warnings = checkMealPlausibility(
      meal({ kcal: 650, prot: 40, gluc: 70, lip: 18 }),
    );
    expect(warnings).toEqual([]);
  });

  it('signale un écart Atwater important', () => {
    // macros ≈ 200 kcal mais kcal annoncées = 800 (écart 75%)
    const warnings = checkMealPlausibility(
      meal({ kcal: 800, prot: 10, gluc: 20, lip: 4 }),
    );
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('écart');
  });

  it('signale des calories nulles', () => {
    const warnings = checkMealPlausibility(meal({ kcal: 0, prot: 10 }));
    expect(warnings[0]).toContain('nulles');
  });

  it('signale des macros toutes nulles malgré des calories renseignées', () => {
    const warnings = checkMealPlausibility(meal({ kcal: 500 }));
    expect(warnings[0]).toContain('toutes nulles');
  });

  it('signale une valeur négative', () => {
    const warnings = checkMealPlausibility(
      meal({ kcal: 500, prot: -5, gluc: 50, lip: 10 }),
    );
    expect(warnings[0]).toContain('négative');
  });
});
