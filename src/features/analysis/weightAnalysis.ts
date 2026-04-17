import type { Phase, TrendResult, WeightEntry, WeightStats } from '@/types';

export type AnalysisTone = 'info' | 'success' | 'warn' | 'danger';

export interface RateMessage {
  message: string;
  tone: AnalysisTone;
}

export function computeVariance(weights: readonly WeightEntry[]): number {
  const last14 = weights.slice(-14).map((w) => w.w);
  if (last14.length <= 1) return 0;
  const mean = last14.reduce((s, v) => s + v, 0) / last14.length;
  const variance =
    last14.reduce((s, v) => s + (v - mean) ** 2, 0) / last14.length;
  return +Math.sqrt(variance).toFixed(2);
}

export function describeVariance(variance: number): {
  label: string;
  color: string;
} {
  if (variance < 0.3) {
    return { label: 'Très stable', color: 'var(--grn)' };
  }
  if (variance < 0.6) {
    return { label: 'Fluctuations normales', color: 'var(--acc)' };
  }
  return {
    label: `Fluctuations importantes (${variance.toFixed(1)} kg)`,
    color: 'var(--org)',
  };
}

interface RateDeps {
  phase: Phase;
  trend: TrendResult | null;
  stats: WeightStats;
}

export function rateMessageFor({ phase, trend, stats }: RateDeps): RateMessage {
  const rate = trend && trend.dir !== 'observing' ? trend.rate : stats.rate;

  if (phase === 'B') {
    if (rate < -1) {
      return {
        message: `Perte rapide (${rate} kg/sem). Risque de perte musculaire, envisage de ralentir.`,
        tone: 'warn',
      };
    }
    if (rate < 0) {
      return {
        message: `Déficit efficace (${rate} kg/sem). Rythme optimal entre -0.3 et -0.7.`,
        tone: 'success',
      };
    }
    return {
      message:
        'Pas de perte cette semaine. Vérifie ton intake ou ajuste -200 kcal.',
      tone: 'danger',
    };
  }

  if (phase === 'D') {
    if (rate > 0.5) {
      return {
        message: `Prise rapide (+${rate} kg/sem). Réduis de 100-200 kcal.`,
        tone: 'warn',
      };
    }
    if (rate > 0) {
      return {
        message: `PDM on track (+${rate} kg/sem). Vise +0.2 à +0.4/sem.`,
        tone: 'success',
      };
    }
    return {
      message: 'Poids stable ou en baisse. Augmente de +200 kcal.',
      tone: 'danger',
    };
  }

  if (phase === 'C') {
    if (Math.abs(rate) < 0.2) {
      return {
        message: 'Reverse stable. Poids bien contrôlé.',
        tone: 'success',
      };
    }
    if (rate < -0.2) {
      return {
        message: 'Encore en perte. Ajoute +200 kcal pour reverse.',
        tone: 'warn',
      };
    }
    return { message: 'Légère prise OK en reverse. Surveille.', tone: 'info' };
  }

  if (phase === 'F') {
    if (rate < -1) {
      return {
        message: `Baisse très rapide (${rate} kg/sem). Tiens le palier avant de remonter.`,
        tone: 'warn',
      };
    }
    if (rate < -0.2) {
      return {
        message: `Remonte efficace (${rate} kg/sem). Tu perds en remontant les kcal, parfait.`,
        tone: 'success',
      };
    }
    if (Math.abs(rate) < 0.2) {
      return {
        message: "Plateau atteint. C'est le moment de remonter +200 kcal.",
        tone: 'info',
      };
    }
    return {
      message: `Prise de poids en remonte (+${rate} kg/sem). Redescends -200 kcal.`,
      tone: 'danger',
    };
  }

  if (rate < 0) {
    return {
      message: `Tendance baisse (${rate} kg/sem).`,
      tone: 'success',
    };
  }
  if (rate > 0) {
    return {
      message: `Tendance hausse (+${rate} kg/sem).`,
      tone: 'warn',
    };
  }
  return { message: 'Poids stable.', tone: 'info' };
}
