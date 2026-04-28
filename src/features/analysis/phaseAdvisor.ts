import type { Phase, TrendResult, WeightEntry } from '@/types';
import { phaseSegmentsFor } from './phaseSegments';

export type AdvisorAction =
  | 'continue'
  | 'switch_to_reverse'
  | 'switch_to_remontee'
  | 'switch_to_deficit'
  | 'switch_to_maintain';

export type AdvisorTone = 'info' | 'success' | 'warn' | 'danger';

export type FatigueLevel = 'low' | 'medium' | 'high';

export interface AdvisorOption {
  label: string;
  action: AdvisorAction;
  targetPhase: Phase;
  tone: AdvisorTone;
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

    if (climbed && stable) {
      const goalReached =
        goalWeight > 0 && currentWeight <= goalWeight + GOAL_TOLERANCE_KG;

      if (goalReached) {
        return {
          ...baseAdvice,
          action: 'switch_to_maintain',
          targetPhase: 'A',
          tone: 'success',
          headline: 'Maintenance optimisée atteinte — passe en Maintien',
          reason: `Tu maintiens ton poids à ${currentKcal} kcal (vs ${history.initialKcal} au départ) et tu es sur ton objectif. Stabilise la nouvelle maintenance avec la phase A.`,
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

      return {
        ...baseAdvice,
        action: 'switch_to_deficit',
        targetPhase: 'B',
        tone: 'success',
        headline: `Maintenance optimisée à ${currentKcal} kcal — repars en déficit`,
        reason: `Tu es revenu de ${history.initialKcal} → ${currentKcal} kcal sans reprendre. Ta maintenance est reconstruite : repars en déficit pour atteindre ton objectif (${goalWeight} kg).`,
        options: [
          {
            label: 'Passer en Déficit',
            action: 'switch_to_deficit',
            targetPhase: 'B',
            tone: 'success',
          },
        ],
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

    if (stable && climbed) {
      if (goalReached) {
        return {
          ...baseAdvice,
          action: 'switch_to_maintain',
          targetPhase: 'A',
          tone: 'success',
          headline: 'Reverse stabilisé — passe en Maintien',
          reason: `Tu maintiens à ${currentKcal} kcal et tu es sur ton goal. Bascule en phase A pour la maintenance long terme.`,
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

      return {
        ...baseAdvice,
        action: 'switch_to_deficit',
        targetPhase: 'B',
        tone: 'info',
        headline: 'Reverse OK — repars en déficit pour viser ton goal',
        reason: `Maintenance rééduquée à ${currentKcal} kcal. Tu es à ${currentWeight.toFixed(
          1,
        )} kg pour un goal de ${goalWeight.toFixed(
          1,
        )} kg : repars sur un déficit propre.`,
        options: [
          {
            label: 'Passer en Déficit',
            action: 'switch_to_deficit',
            targetPhase: 'B',
            tone: 'info',
          },
          {
            label: 'Rester en Maintien',
            action: 'switch_to_maintain',
            targetPhase: 'A',
            tone: 'success',
          },
        ],
      };
    }

    return null;
  }

  return null;
}
