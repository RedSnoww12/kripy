import type { AiMealResult } from './types';

const ATWATER_TOLERANCE = 0.15;

/**
 * Vérifie la cohérence d'une estimation de repas (calcul Atwater, valeurs
 * aberrantes) avant de la proposer à l'utilisateur. Ne bloque jamais l'ajout
 * au journal — sert uniquement à afficher un avertissement pour inviter à
 * relire les chiffres avant de valider.
 */
export function checkMealPlausibility(result: AiMealResult): string[] {
  const { kcal, prot, gluc, lip } = result;
  const warnings: string[] = [];

  if ([kcal, prot, gluc, lip].some((v) => v < 0)) {
    warnings.push('Une valeur négative a été détectée.');
    return warnings;
  }

  if (kcal <= 0) {
    warnings.push('Les calories sont nulles.');
    return warnings;
  }

  const computed = prot * 4 + gluc * 4 + lip * 9;
  if (computed === 0) {
    warnings.push(
      'Les macros sont toutes nulles alors que des calories sont indiquées.',
    );
    return warnings;
  }

  const deviation = Math.abs(kcal - computed) / kcal;
  if (deviation > ATWATER_TOLERANCE) {
    const pct = Math.round(deviation * 100);
    warnings.push(
      `Les macros (${Math.round(computed)} kcal calculées) ne correspondent pas aux ${Math.round(kcal)} kcal indiquées (écart ${pct} %). Vérifie les valeurs avant d'ajouter.`,
    );
  }

  return warnings;
}
