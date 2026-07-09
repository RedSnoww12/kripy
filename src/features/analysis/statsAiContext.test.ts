import { describe, expect, it } from 'vitest';
import type { TrendResult, WeightEntry, WeightStats } from '@/types';
import { buildStatsAiContext } from './statsAiContext';

const TODAY = '2026-07-08';

function weightsOver(days: number, from: number, step: number): WeightEntry[] {
  const out: WeightEntry[] = [];
  for (let i = days - 1; i >= 0; i--) {
    out.push({
      date: new Date(Date.parse(TODAY) - i * 86_400_000)
        .toISOString()
        .slice(0, 10),
      w: +(from + (days - 1 - i) * step).toFixed(1),
    });
  }
  return out;
}

const stats: WeightStats = {
  cur: 79.2,
  start: 82,
  mn: 79,
  mx: 82.3,
  bmi: '24.1',
  avg7: 79.4,
  avg30: 80.1,
  rate: -0.45,
  estDays: 40,
  total: -2.8,
  reg: 90,
  count: 28,
};

const trend: TrendResult = {
  dir: 'down',
  rate: -0.5,
  confidence: 'high',
  window: 7,
  sampleSize: 7,
  r2: 0.9,
  daysOnPalier: 21,
  daysNeeded: 3,
  idealDays: 5,
  palierKcal: 2100,
  avgAct: 2050,
  avgTg: 2100,
  adherence: 95,
  trackedDays: 6,
};

describe('buildStatsAiContext', () => {
  it("expose l'objectif, la tendance et les pesées récentes", () => {
    const weights = weightsOver(40, 82, -0.07);
    const ctx = buildStatsAiContext({
      weights,
      log: {},
      phase: 'B',
      targets: { kcal: 2100, prot: 160, gluc: 220, lip: 65, fib: 30 },
      goalWeight: 76,
      today: TODAY,
      trend,
      stats,
    });

    expect(ctx.objectif).toBe('Déficit');
    const poids = ctx.poids as Record<string, unknown>;
    expect(poids.actuel).toBe(79.2);
    expect(poids.objectif).toBe(76);
    expect(poids.tendanceKgSemaine).toBe(-0.5);
    expect(poids.confianceTendance).toBe('high');
    // 40 pesées seedées mais la fenêtre est bornée à 30 jours
    expect(poids.nombrePesees30j).toBe(30);
  });

  it('retombe sur le rate des stats globales quand la tendance observe encore', () => {
    const ctx = buildStatsAiContext({
      weights: weightsOver(10, 80, -0.05),
      log: {},
      phase: 'D',
      targets: { kcal: 2800, prot: 150, gluc: 350, lip: 90, fib: 30 },
      goalWeight: 85,
      today: TODAY,
      trend: { ...trend, dir: 'observing' },
      stats,
    });

    expect(ctx.objectif).toBe('Prise de masse');
    const poids = ctx.poids as Record<string, unknown>;
    expect(poids.tendanceKgSemaine).toBe(stats.rate);
    expect(poids.confianceTendance).toContain('faible');
  });

  it('reste exploitable sans aucune pesée ni journal', () => {
    const ctx = buildStatsAiContext({
      weights: [],
      log: {},
      phase: 'A',
      targets: { kcal: 2200, prot: 150, gluc: 250, lip: 75, fib: 30 },
      goalWeight: 75,
      today: TODAY,
      trend: null,
      stats: null,
    });

    expect(ctx.objectif).toBe('Maintien');
    const poids = ctx.poids as Record<string, unknown>;
    expect(poids.actuel).toBeNull();
    expect(poids.tendanceKgSemaine).toBeNull();
    const calories = ctx.calories as Record<string, unknown>;
    expect(calories.joursTraques14j).toBe(0);
  });

  it('résume le bilan calorique et les macros sur 14 jours', () => {
    const entry = (id: number, kcal: number, p: number, g: number, l: number) =>
      ({ id, food: 'Repas', qty: 1, meal: 1, kcal, p, g, l }) as const;
    const log = {
      '2026-07-06': [entry(1, 2000, 150, 200, 60)],
      '2026-07-07': [entry(2, 2200, 140, 230, 70)],
    };
    const ctx = buildStatsAiContext({
      weights: weightsOver(14, 80, 0),
      log,
      phase: 'B',
      targets: { kcal: 2100, prot: 160, gluc: 220, lip: 65, fib: 30 },
      goalWeight: 76,
      today: TODAY,
      trend: null,
      stats,
    });

    const calories = ctx.calories as Record<string, unknown>;
    expect(calories.cibleQuotidienne).toBe(2100);
    expect(calories.moyenneReelle14j).toBe(2100);
    expect(calories.joursTraques14j).toBe(2);
    const macros = ctx.macros as Record<string, unknown>;
    expect(macros.proteinesMoyennesG).toBe(145);
    expect(macros.cibleProteinesG).toBe(160);
  });
});
