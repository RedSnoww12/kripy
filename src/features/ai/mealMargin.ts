import type { AiMealResult } from './types';

/**
 * Marges d'erreur proposées pour un repas dont on ne maîtrise pas la
 * préparation (restaurant, traiteur…) : les portions et les matières grasses
 * y sont systématiquement sous-estimées.
 */
export const MEAL_MARGIN_OPTIONS = [5, 10, 15] as const;

/**
 * Applique une marge de sécurité de `pct` % sur l'estimation. Toutes les
 * valeurs (kcal + macros) sont majorées du même facteur, ce qui préserve la
 * cohérence Atwater du résultat.
 */
export function applyMealMargin(
  result: AiMealResult,
  pct: number,
): AiMealResult {
  if (!Number.isFinite(pct) || pct <= 0) return result;
  const factor = 1 + pct / 100;
  const mention = `Marge de sécurité +${pct} % incluse (repas non maîtrisé).`;
  return {
    ...result,
    kcal: Math.round(result.kcal * factor),
    prot: Math.round(result.prot * factor),
    gluc: Math.round(result.gluc * factor),
    lip: Math.round(result.lip * factor),
    fib: Math.round(result.fib * factor),
    details: result.details ? `${result.details} ${mention}` : mention,
  };
}
