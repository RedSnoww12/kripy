import type { Phase, TrendResult, WeightEntry } from '@/types';
import { phaseSegmentsFor } from './phaseSegments';
import { computeVariance } from './weightAnalysis';

export type AdvisorAction =
  | 'continue'
  | 'switch_to_reverse'
  | 'switch_to_remontee'
  | 'switch_to_deficit'
  | 'switch_to_maintain'
  | 'push_palier'
  | 'wait';

export type AdvisorTone = 'info' | 'success' | 'warn' | 'danger';

export type FatigueLevel = 'low' | 'medium' | 'high';

export interface AdvisorOption {
  label: string;
  action: AdvisorAction;
  targetPhase: Phase | null;
  tone: AdvisorTone;
  kcalDelta?: number;
  untilDay?: number;
}

export interface PhaseAdvice {
  action: AdvisorAction;
  targetPhase: Phase | null;
  tone: AdvisorTone;
  headline: string;
  reason: string;
  bmrRatio: number;
  bmrGapKcal: number;
  paliersInPhase: number;
  initialKcal: number;
  fatigue: FatigueLevel;
  options: AdvisorOption[];
  suppressAnalysis: boolean;
}

interface AdvisorDeps {
  phase: Phase;
  currentKcal: number;
  bmr: number;
  weights: WeightEntry[];
  trend: TrendResult | null;
  goalWeight: number;
  currentWeight: number;
}

const GOAL_TOLERANCE_KG = 0.5;
const DECISION_IDEAL_DAYS = 5;
const DECISION_EXTENDED_DAYS = 7;
const HIGH_VARIANCE_KG = 0.6;

interface PhaseHistory {
  paliers: number;
  initialKcal: number;
  currentKcal: number;
}

function historyForPhase(
  weights: readonly WeightEntry[],
  phase: Phase,
  fallbackKcal: number,
): PhaseHistory {
  const segments = phaseSegmentsFor(weights, phase);
  const segment = segments[segments.length - 1];

  if (!segment) {
    return { paliers: 1, initialKcal: fallbackKcal, currentKcal: fallbackKcal };
  }

  const seen: number[] = [];
  for (const e of segment.entries) {
    const k = typeof e.tgKcal === 'number' ? e.tgKcal : null;
    if (k === null) continue;
    if (seen[seen.length - 1] !== k) seen.push(k);
  }

  if (!seen.length) {
    return { paliers: 1, initialKcal: fallbackKcal, currentKcal: fallbackKcal };
  }

  return {
    paliers: seen.length,
    initialKcal: seen[0],
    currentKcal: seen[seen.length - 1],
  };
}

function fatigueFromBmr(bmrRatio: number, paliers: number): FatigueLevel {
  if (bmrRatio <= 1.05 || paliers >= 4) return 'high';
  if (bmrRatio <= 1.15 || paliers >= 3) return 'medium';
  return 'low';
}

export function buildPhaseAdvice(deps: AdvisorDeps): PhaseAdvice | null {
  const { phase, currentKcal, bmr, weights, trend, goalWeight, currentWeight } =
    deps;

  if (bmr <= 0) return null;

  const history = historyForPhase(weights, phase, currentKcal);
  const bmrRatio = +(currentKcal / bmr).toFixed(2);
  const bmrGapKcal = Math.max(0, currentKcal - bmr);
  const fatigue = fatigueFromBmr(bmrRatio, history.paliers);

  const baseAdvice = {
    bmrRatio,
    bmrGapKcal,
    paliersInPhase: history.paliers,
    initialKcal: history.initialKcal,
    fatigue,
    suppressAnalysis: false,
  };

  if (phase === 'B') {
    const goalReached =
      goalWeight > 0 && currentWeight <= goalWeight + GOAL_TOLERANCE_KG;

    if (goalReached) {
      return {
        ...baseAdvice,
        action: 'switch_to_reverse',
        targetPhase: 'C',
        tone: 'success',
        headline: 'Objectif atteint — bascule en Reverse',
        reason: `Tu es à ${currentWeight.toFixed(
          1,
        )} kg pour un goal de ${goalWeight.toFixed(
          1,
        )} kg. Stoppe le déficit, passe en Reverse pour rééduquer ton métabolisme.`,
        options: [
          {
            label: 'Passer en Reverse',
            action: 'switch_to_reverse',
            targetPhase: 'C',
            tone: 'success',
          },
        ],
      };
    }

    if (fatigue === 'high') {
      return {
        ...baseAdvice,
        action: 'switch_to_remontee',
        targetPhase: 'F',
        tone: 'danger',
        headline: `Tu approches ton BMR (${currentKcal} / ${Math.round(
          bmr,
        )} kcal)`,
        reason: `${history.paliers} paliers tenus depuis ${history.initialKcal} kcal. Trop bas trop longtemps = fatigue accumulée. Si tu es satisfait → bascule en Reverse pour stabiliser. Sinon → passe en Remontée pour reconstruire une maintenance plus haute avant de repartir en déficit.`,
        options: [
          {
            label: 'Satisfait → Reverse',
            action: 'switch_to_reverse',
            targetPhase: 'C',
            tone: 'success',
          },
          {
            label: 'Pas encore → Remontée',
            action: 'switch_to_remontee',
            targetPhase: 'F',
            tone: 'warn',
          },
        ],
      };
    }

    if (fatigue === 'medium') {
      return {
        ...baseAdvice,
        action: 'continue',
        targetPhase: null,
        tone: 'warn',
        headline: `${history.paliers} paliers tenus — pense à programmer une sortie`,
        reason: `Tu es à ${Math.round(
          bmrRatio * 100,
        )}% de ton BMR (${currentKcal} vs ${Math.round(
          bmr,
        )} kcal). Encore 1-2 paliers possibles, puis envisage Reverse (si satisfait) ou Remontée (si pas encore).`,
        options: [
          {
            label: 'Satisfait → Reverse',
            action: 'switch_to_reverse',
            targetPhase: 'C',
            tone: 'success',
          },
          {
            label: 'Pas encore → Remontée',
            action: 'switch_to_remontee',
            targetPhase: 'F',
            tone: 'warn',
          },
        ],
      };
    }

    return null;
  }

  if (phase === 'F') {
    const climbed = history.paliers >= 2 && currentKcal > history.initialKcal;
    const stable = trend?.dir === 'stable';
    const stillLosing = trend?.dir === 'down' || trend?.dir === 'down_fast';
    const days = trend?.daysOnPalier ?? 0;
    const variance = computeVariance(weights);
    const lowConfidence = trend?.confidence === 'low';
    const noisy = lowConfidence || variance >= HIGH_VARIANCE_KG;

    if (climbed && stable) {
      const goalReached =
        goalWeight > 0 && currentWeight <= goalWeight + GOAL_TOLERANCE_KG;

      if (days < DECISION_IDEAL_DAYS) {
        return {
          ...baseAdvice,
          action: 'continue',
          targetPhase: null,
          tone: 'info',
          headline: `Plateau à J${days} — décision possible`,
          reason: `Maintenance reconstruite à ${currentKcal} kcal (vs ${history.initialKcal} au départ). Tu peux sortir en déficit dès maintenant ou attendre J${DECISION_IDEAL_DAYS} pour confirmer la stabilité.`,
          suppressAnalysis: true,
          options: [
            {
              label: 'Passer en Déficit',
              action: 'switch_to_deficit',
              targetPhase: 'B',
              tone: 'info',
            },
            {
              label: `Attendre J${DECISION_IDEAL_DAYS}`,
              action: 'wait',
              targetPhase: null,
              tone: 'success',
              untilDay: DECISION_IDEAL_DAYS,
            },
          ],
        };
      }

      if (days < DECISION_EXTENDED_DAYS && noisy) {
        const remain = DECISION_EXTENDED_DAYS - days;
        return {
          ...baseAdvice,
          action: 'wait',
          targetPhase: null,
          tone: 'warn',
          headline: `Plateau bruité à J${days} — patiente jusqu'à J${DECISION_EXTENDED_DAYS}`,
          reason: `Confiance ${trend?.confidence ?? 'low'}, fluctuation ${variance.toFixed(1)} kg sur 14j. Encore ${remain}j d'observation pour fiabiliser la décision.`,
          suppressAnalysis: true,
          options: [
            {
              label: `Attendre J${DECISION_EXTENDED_DAYS}`,
              action: 'wait',
              targetPhase: null,
              tone: 'info',
              untilDay: DECISION_EXTENDED_DAYS,
            },
          ],
        };
      }

      if (goalReached) {
        return {
          ...baseAdvice,
          action: 'switch_to_maintain',
          targetPhase: 'A',
          tone: 'success',
          headline: 'Maintenance optimisée atteinte — passe en Maintien',
          reason: `Tu maintiens ton poids à ${currentKcal} kcal (vs ${history.initialKcal} au départ) et tu es sur ton objectif. Stabilise la nouvelle maintenance avec la phase A.`,
          suppressAnalysis: true,
          options: [
            {
              label: 'Passer en Maintien',
              action: 'switch_to_maintain',
              targetPhase: 'A',
              tone: 'success',
            },
            {
              label: 'Repartir en Déficit',
              action: 'switch_to_deficit',
              targetPhase: 'B',
              tone: 'info',
            },
          ],
        };
      }

      const isExtended = days >= DECISION_EXTENDED_DAYS;
      const options: AdvisorOption[] = [
        {
          label: 'Passer en Déficit',
          action: 'switch_to_deficit',
          targetPhase: 'B',
          tone: 'success',
        },
        {
          label: 'Pousser le palier (+200)',
          action: 'push_palier',
          targetPhase: null,
          tone: 'info',
          kcalDelta: 200,
        },
      ];
      if (!isExtended) {
        options.push({
          label: `Attendre J${DECISION_EXTENDED_DAYS}`,
          action: 'wait',
          targetPhase: null,
          tone: 'success',
          untilDay: DECISION_EXTENDED_DAYS,
        });
      }

      return {
        ...baseAdvice,
        action: 'switch_to_deficit',
        targetPhase: 'B',
        tone: 'success',
        headline: isExtended
          ? `Maintenance confirmée à ${currentKcal} kcal`
          : `Maintenance optimisée à ${currentKcal} kcal`,
        reason: `Tu es revenu de ${history.initialKcal} → ${currentKcal} kcal sans reprendre. Repars en déficit pour viser ${goalWeight} kg, ou pousse au palier suivant${
          isExtended ? '' : ` — ou patiente jusqu'à J${DECISION_EXTENDED_DAYS}`
        }.`,
        suppressAnalysis: true,
        options,
      };
    }

    if (climbed && stillLosing) {
      return {
        ...baseAdvice,
        action: 'continue',
        targetPhase: null,
        tone: 'success',
        headline: 'Remontée efficace — continue à pousser',
        reason: `Tu remontes les kcal (${history.initialKcal} → ${currentKcal}) et tu perds toujours. Continue tant que la perte tient sans repasser sous ton ancien palier.`,
        options: [],
      };
    }

    return null;
  }

  if (phase === 'C') {
    const goalReached =
      goalWeight > 0 && currentWeight <= goalWeight + GOAL_TOLERANCE_KG;
    const stable = trend?.dir === 'stable';
    const climbed = history.paliers >= 2 && currentKcal > history.initialKcal;
    const days = trend?.daysOnPalier ?? 0;
    const variance = computeVariance(weights);
    const lowConfidence = trend?.confidence === 'low';
    const noisy = lowConfidence || variance >= HIGH_VARIANCE_KG;

    if (stable && climbed) {
      if (days < DECISION_IDEAL_DAYS) {
        return {
          ...baseAdvice,
          action: 'continue',
          targetPhase: null,
          tone: 'info',
          headline: `Reverse stable à J${days} — décision possible`,
          reason: `Maintenance rééduquée à ${currentKcal} kcal. Tu peux sortir en déficit dès maintenant ou attendre J${DECISION_IDEAL_DAYS} pour confirmer la stabilité.`,
          suppressAnalysis: true,
          options: [
            {
              label: 'Passer en Déficit',
              action: 'switch_to_deficit',
              targetPhase: 'B',
              tone: 'info',
            },
            {
              label: `Attendre J${DECISION_IDEAL_DAYS}`,
              action: 'wait',
              targetPhase: null,
              tone: 'success',
              untilDay: DECISION_IDEAL_DAYS,
            },
          ],
        };
      }

      if (days < DECISION_EXTENDED_DAYS && noisy) {
        const remain = DECISION_EXTENDED_DAYS - days;
        return {
          ...baseAdvice,
          action: 'wait',
          targetPhase: null,
          tone: 'warn',
          headline: `Reverse bruité à J${days} — patiente jusqu'à J${DECISION_EXTENDED_DAYS}`,
          reason: `Confiance ${trend?.confidence ?? 'low'}, fluctuation ${variance.toFixed(1)} kg sur 14j. Encore ${remain}j d'observation pour fiabiliser la décision.`,
          suppressAnalysis: true,
          options: [
            {
              label: `Attendre J${DECISION_EXTENDED_DAYS}`,
              action: 'wait',
              targetPhase: null,
              tone: 'info',
              untilDay: DECISION_EXTENDED_DAYS,
            },
          ],
        };
      }

      if (goalReached) {
        return {
          ...baseAdvice,
          action: 'switch_to_maintain',
          targetPhase: 'A',
          tone: 'success',
          headline: 'Reverse stabilisé — passe en Maintien',
          reason: `Tu maintiens à ${currentKcal} kcal et tu es sur ton goal. Bascule en phase A pour la maintenance long terme.`,
          suppressAnalysis: true,
          options: [
            {
              label: 'Passer en Maintien',
              action: 'switch_to_maintain',
              targetPhase: 'A',
              tone: 'success',
            },
          ],
        };
      }

      const isExtended = days >= DECISION_EXTENDED_DAYS;
      const options: AdvisorOption[] = [
        {
          label: 'Passer en Déficit',
          action: 'switch_to_deficit',
          targetPhase: 'B',
          tone: 'info',
        },
        {
          label: 'Pousser le palier (+200)',
          action: 'push_palier',
          targetPhase: null,
          tone: 'success',
          kcalDelta: 200,
        },
      ];
      if (!isExtended) {
        options.push({
          label: `Attendre J${DECISION_EXTENDED_DAYS}`,
          action: 'wait',
          targetPhase: null,
          tone: 'info',
          untilDay: DECISION_EXTENDED_DAYS,
        });
      }

      return {
        ...baseAdvice,
        action: 'switch_to_deficit',
        targetPhase: 'B',
        tone: 'info',
        headline: isExtended
          ? `Reverse confirmé à ${currentKcal} kcal`
          : 'Reverse OK — repars en déficit pour viser ton goal',
        reason: `Maintenance rééduquée à ${currentKcal} kcal. Tu es à ${currentWeight.toFixed(
          1,
        )} kg pour un goal de ${goalWeight.toFixed(
          1,
        )} kg : repars sur un déficit propre, pousse au palier suivant${
          isExtended ? '' : `, ou patiente jusqu'à J${DECISION_EXTENDED_DAYS}`
        }.`,
        suppressAnalysis: true,
        options,
      };
    }

    return null;
  }

  return null;
}
