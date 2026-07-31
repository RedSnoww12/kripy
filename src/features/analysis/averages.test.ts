import { describe, expect, it } from 'vitest';
import type { LogByDate, WeightEntry } from '@/types';
import {
  buildPeriodAverages,
  buildTargetGroups,
  compareWindows,
} from './averages';

const TODAY = '2026-03-20';

function entry(kcal: number, p: number, g: number, l: number) {
  return [{ id: 1, food: 'Repas', qty: 1, meal: 1 as const, kcal, p, g, l }];
}

/** Pesées quotidiennes de `from` (inclus) sur `count` jours. */
function dailyWeights(
  from: string,
  count: number,
  startKg: number,
  stepKg: number,
  tgKcal?: number,
): WeightEntry[] {
  const base = Date.parse(from);
  return Array.from({ length: count }, (_, i) => ({
    date: new Date(base + i * 86_400_000).toISOString().slice(0, 10),
    w: +(startKg + i * stepKg).toFixed(2),
    ...(tgKcal !== undefined ? { tgKcal } : {}),
  }));
}

describe('buildPeriodAverages', () => {
  it('moyenne le poids et les macros sur la fenêtre demandée', () => {
    const weights: WeightEntry[] = [
      { date: '2026-03-18', w: 80 },
      { date: '2026-03-19', w: 79.8 },
      { date: '2026-03-20', w: 79.6 },
    ];
    const log: LogByDate = {
      '2026-03-18': entry(2000, 150, 200, 60),
      '2026-03-19': entry(2200, 160, 220, 70),
      '2026-03-20': entry(2400, 170, 240, 80),
    };
    const p = buildPeriodAverages(weights, log, TODAY, 3);
    expect(p.startDate).toBe('2026-03-18');
    expect(p.endDate).toBe('2026-03-20');
    expect(p.weightKg).toBe(79.8);
    expect(p.weighIns).toBe(3);
    expect(p.kcal).toBe(2200);
    expect(p.prot).toBe(160);
    expect(p.trackedDays).toBe(3);
  });

  it('exclut les jours non tracés au lieu de les compter à 0 kcal', () => {
    const log: LogByDate = {
      '2026-03-20': entry(2000, 150, 200, 60),
      // 03-18 et 03-19 non tracés
    };
    const p = buildPeriodAverages([], log, TODAY, 3);
    expect(p.kcal).toBe(2000);
    expect(p.trackedDays).toBe(1);
  });

  it('ignore les pesées hors de la fenêtre', () => {
    const weights: WeightEntry[] = [
      { date: '2026-03-01', w: 90 },
      { date: '2026-03-20', w: 80 },
    ];
    const p = buildPeriodAverages(weights, {}, TODAY, 3);
    expect(p.weightKg).toBe(80);
    expect(p.weighIns).toBe(1);
  });

  it('renvoie null sans aucune donnée', () => {
    const p = buildPeriodAverages([], {}, TODAY, 7);
    expect(p.weightKg).toBeNull();
    expect(p.kcal).toBeNull();
    expect(p.trackedDays).toBe(0);
  });
});

describe('compareWindows', () => {
  it('compare la fenêtre courante à la précédente de même longueur', () => {
    // 6 jours : 03-15..03-17 (précédente) puis 03-18..03-20 (courante)
    const weights = dailyWeights('2026-03-15', 6, 80, -0.2);
    const log: LogByDate = {
      '2026-03-15': entry(2500, 150, 250, 80),
      '2026-03-16': entry(2500, 150, 250, 80),
      '2026-03-17': entry(2500, 150, 250, 80),
      '2026-03-18': entry(2300, 160, 220, 70),
      '2026-03-19': entry(2300, 160, 220, 70),
      '2026-03-20': entry(2300, 160, 220, 70),
    };
    const c = compareWindows(weights, log, TODAY, 3);

    expect(c.previous.startDate).toBe('2026-03-15');
    expect(c.previous.endDate).toBe('2026-03-17');
    expect(c.current.startDate).toBe('2026-03-18');
    expect(c.current.endDate).toBe('2026-03-20');

    // moyennes : 80, 79.8, 79.6 → 79.8  vs  79.4, 79.2, 79 → 79.2
    expect(c.previous.weightKg).toBe(79.8);
    expect(c.current.weightKg).toBe(79.2);
    expect(c.deltaWeightKg).toBe(-0.6);
    expect(c.deltaKcal).toBe(-200);
    expect(c.deltaProt).toBe(10);
  });

  it('ramène l’écart de poids à un rythme hebdomadaire', () => {
    const weights = dailyWeights('2026-03-07', 14, 80, -0.1);
    const c = compareWindows(weights, {}, TODAY, 7);
    // -0.7 kg entre deux fenêtres de 7 jours → -0,7 kg/semaine
    expect(c.deltaWeightKg).toBe(-0.7);
    expect(c.weeklyRateKg).toBe(-0.7);
  });

  it('normalise aussi pour une fenêtre courte', () => {
    const weights = dailyWeights('2026-03-15', 6, 80, -0.2);
    const c = compareWindows(weights, {}, TODAY, 3);
    // -0,6 kg sur 3 jours → -1,4 kg/semaine
    expect(c.weeklyRateKg).toBe(-1.4);
  });

  it('renvoie des deltas null quand une fenêtre est vide', () => {
    const weights: WeightEntry[] = [{ date: '2026-03-20', w: 80 }];
    const c = compareWindows(weights, {}, TODAY, 3);
    expect(c.current.weightKg).toBe(80);
    expect(c.previous.weightKg).toBeNull();
    expect(c.deltaWeightKg).toBeNull();
    expect(c.weeklyRateKg).toBeNull();
  });
});

describe('buildTargetGroups', () => {
  it('regroupe les jours par cible calorique et calcule le rythme de chacune', () => {
    const weights = [
      ...dailyWeights('2026-03-01', 10, 80, -0.1, 2900),
      ...dailyWeights('2026-03-11', 10, 79, -0.2, 2700),
    ];
    const groups = buildTargetGroups(weights, {}, 2700, TODAY);

    expect(groups).toHaveLength(2);
    // Tri décroissant par cible
    expect(groups[0].targetKcal).toBe(2900);
    expect(groups[1].targetKcal).toBe(2700);

    expect(groups[0].days).toBe(10);
    expect(groups[0].firstDate).toBe('2026-03-01');
    expect(groups[0].lastDate).toBe('2026-03-10');
    expect(groups[0].weighIns).toBe(10);
    expect(groups[0].weeklyRateKg).toBe(-0.7);

    expect(groups[1].days).toBe(10);
    expect(groups[1].firstDate).toBe('2026-03-11');
    expect(groups[1].weeklyRateKg).toBe(-1.4);
  });

  it('expose la moyenne réellement consommée pour juger l’adhérence', () => {
    const weights = dailyWeights('2026-03-18', 3, 80, -0.1, 2500);
    const log: LogByDate = {
      '2026-03-18': entry(2700, 150, 250, 80),
      '2026-03-19': entry(2700, 150, 250, 80),
      '2026-03-20': entry(2700, 150, 250, 80),
    };
    const groups = buildTargetGroups(weights, log, 2500, TODAY);
    expect(groups).toHaveLength(1);
    expect(groups[0].targetKcal).toBe(2500);
    // 200 kcal au-dessus de la cible en moyenne
    expect(groups[0].kcal).toBe(2700);
    expect(groups[0].trackedDays).toBe(3);
  });

  it('laisse le rythme à null en dessous de 3 pesées', () => {
    const weights = dailyWeights('2026-03-19', 2, 80, -0.3, 2500);
    const groups = buildTargetGroups(weights, {}, 2500, TODAY);
    expect(groups[0].weighIns).toBe(2);
    expect(groups[0].weeklyRateKg).toBeNull();
  });

  it('renvoie une liste vide sans aucune pesée', () => {
    expect(buildTargetGroups([], {}, 2500, TODAY)).toEqual([]);
  });
});
