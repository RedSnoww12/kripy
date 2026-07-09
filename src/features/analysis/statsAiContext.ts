import { PHASE_NAMES } from '@/data/constants';
import type { PhaseAdvice } from './phaseAdvisor';
import type {
  LogByDate,
  Phase,
  Recommendation,
  Targets,
  TrendResult,
  WeightEntry,
  WeightStats,
} from '@/types';
import { buildCalorieBalance } from './charts/kcalBalanceData';
import { buildMacroDonut } from './charts/macroAverages';

const WEIGHT_WINDOW_DAYS = 30;
const INTAKE_WINDOW_DAYS = 14;

interface StatsAiDeps {
  weights: readonly WeightEntry[];
  log: LogByDate;
  phase: Phase;
  targets: Targets;
  /** Poids visé par l'utilisateur (réglage « poids objectif » de l'app). */
  goalWeight: number;
  today: string;
  /** Tendance fiable (trend72) si un palier est actif, sinon null. */
  trend: TrendResult | null;
  /** Statistiques globales de poids (weightStats), null si aucune pesée. */
  stats: WeightStats | null;
  /**
   * Décision mécanique du moteur Système Fluide (recommendAction) : source de
   * vérité pour tout ajustement de kcal. null si aucune tendance fiable.
   */
  recommendation: Recommendation | null;
  /**
   * Avis du coach métabolique (buildPhaseAdvice) : paliers tenus, ratio BMR,
   * signal de fatigue, bascule remontée/reverse — mêmes calculs que la carte
   * affichée sur la Home. null si la phase n'a pas d'avis à ce stade.
   */
  phaseAdvice: PhaseAdvice | null;
}

/**
 * Construit le résumé compact (sérialisable en JSON) envoyé au coach IA des
 * statistiques : objectif en cours, tendance de poids, bilan calorique et
 * macros — tout ce qu'il faut pour juger si la sèche / prise de masse /
 * maintien est sur les rails, EN RÉUTILISANT les décisions déjà calculées
 * par le moteur Système Fluide (recommendAction, buildPhaseAdvice) plutôt que
 * de laisser l'IA inventer ses propres seuils.
 */
export function buildStatsAiContext(
  deps: StatsAiDeps,
): Record<string, unknown> {
  const {
    weights,
    log,
    phase,
    targets,
    goalWeight,
    today,
    trend,
    stats,
    recommendation,
    phaseAdvice,
  } = deps;

  const cutoff = new Date(
    Date.parse(today) - (WEIGHT_WINDOW_DAYS - 1) * 86_400_000,
  )
    .toISOString()
    .slice(0, 10);
  const recentWeights = weights
    .filter((w) => w.date >= cutoff)
    .map((w) => ({ date: w.date, kg: w.w }));

  const hasTrend = trend !== null && trend.dir !== 'observing';
  const rate = hasTrend ? trend.rate : (stats?.rate ?? null);

  const { summary } = buildCalorieBalance({
    log,
    weights,
    currentKcal: targets.kcal,
    today,
    range: INTAKE_WINDOW_DAYS,
  });

  const { averages } = buildMacroDonut({
    log,
    today,
    range: INTAKE_WINDOW_DAYS,
  });

  return {
    objectif: PHASE_NAMES[phase],
    poids: {
      actuel: stats?.cur ?? null,
      objectif: goalWeight,
      evolutionTotale: stats?.total ?? null,
      tendanceKgSemaine: rate,
      confianceTendance: hasTrend
        ? trend.confidence
        : 'faible (peu de données)',
      nombrePesees30j: recentWeights.length,
      pesees30j: recentWeights,
    },
    calories: {
      cibleQuotidienne: targets.kcal,
      moyenneReelle14j: summary.avgKcal,
      ecartMoyenVsCible: -summary.deficit,
      joursAuDessusCible: summary.overDays,
      joursTraques14j: summary.trackedDays,
    },
    macros: {
      proteinesMoyennesG: averages.p,
      cibleProteinesG: targets.prot,
      glucidesMoyensG: averages.g,
      lipidesMoyensG: averages.l,
    },
    decisionAlgorithmique: recommendation
      ? {
          action: recommendation.act,
          message: recommendation.msg,
          raison: recommendation.reason,
        }
      : {
          action: null,
          message: null,
          raison:
            'Pas encore de tendance fiable sur ce palier (pas assez de pesées ou de jours écoulés) — aucun ajustement de kcal ne doit être proposé.',
        },
    coachMetabolique: phaseAdvice
      ? {
          headline: phaseAdvice.headline,
          raison: phaseAdvice.reason,
          ratioBmrPct: Math.round(phaseAdvice.bmrRatio * 100),
          paliersDansLaPhase: phaseAdvice.paliersInPhase,
          fatigue: phaseAdvice.fatigue,
        }
      : null,
    date: today,
  };
}
