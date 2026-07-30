import { describe, expect, it } from 'vitest';
import type { LogByDate, MealEntry, Targets, WeightEntry } from '@/types';
import { buildProgressStats } from './progressStats';

const TODAY = '2026-03-01';
const MS_PER_DAY = 86_400_000;

const targets: Targets = {
  kcal: 2000,
  prot: 150,
  gluc: 200,
  lip: 70,
  fib: 30,
};

function iso(daysAgo: number): string {
  return new Date(Date.parse(TODAY) - daysAgo * MS_PER_DAY)
    .toISOString()
    .slice(0, 10);
}

function entry(kcal: number): MealEntry {
  return { id: 1, food: 'Repas', qty: 100, meal: 1, kcal, p: 0, g: 0, l: 0 };
}

/** Une pesée par jour sur `days` jours, de `from` kg avec `step` kg/jour. */
function dailyWeights(days: number, from: number, step: number): WeightEntry[] {
  const out: WeightEntry[] = [];
  for (let i = days - 1; i >= 0; i--) {
    out.push({ date: iso(i), w: +(from + (days - 1 - i) * step).toFixed(1) });
  }
  return out;
}

describe('buildProgressStats — évolution de poids', () => {
  it('calcule la variation totale et la durée de suivi', () => {
    const weights = dailyWeights(30, 82, -0.1);
    const s = buildProgressStats({ weights, log: {}, targets, today: TODAY });
    expect(s.totalChangeKg).toBeCloseTo(-2.9, 1);
    expect(s.daysTracked).toBe(29);
  });

  it('renvoie une variation nulle avec moins de 2 pesées', () => {
    const s = buildProgressStats({
      weights: [{ date: iso(0), w: 80 }],
      log: {},
      targets,
      today: TODAY,
    });
    expect(s.totalChangeKg).toBe(0);
  });

  it('identifie la meilleure et la pire semaine glissante', () => {
    // Perte régulière, sauf une semaine de reprise marquée
    const weights: WeightEntry[] = [
      { date: iso(28), w: 82 },
      { date: iso(21), w: 81 }, // -1.0
      { date: iso(14), w: 79.5 }, // -1.5  → meilleure
      { date: iso(7), w: 80.5 }, // +1.0  → pire
      { date: iso(0), w: 80 }, // -0.5
    ];
    const s = buildProgressStats({ weights, log: {}, targets, today: TODAY });
    expect(s.bestWeek?.deltaKg).toBeCloseTo(-1.5, 2);
    expect(s.worstWeek?.deltaKg).toBeCloseTo(1.0, 2);
  });

  it('normalise les fenêtres courtes à un rythme sur 7 jours', () => {
    // Perte parfaitement linéaire de 0,1 kg/jour : toutes les fenêtres
    // doivent donner le même rythme (-0,7 kg/sem), y compris celles de 5-6
    // jours en début d'historique (avant, une fenêtre de 5 jours renvoyait
    // -0,5 kg et passait à tort pour « la semaine la plus dure »).
    const weights = dailyWeights(20, 80, -0.1);
    const s = buildProgressStats({ weights, log: {}, targets, today: TODAY });
    expect(s.bestWeek!.deltaKg).toBeCloseTo(-0.7, 1);
    expect(s.worstWeek!.deltaKg).toBeCloseTo(-0.7, 1);
  });

  it('expose le nombre de jours réellement couverts par la fenêtre', () => {
    const weights = dailyWeights(20, 80, -0.1);
    const s = buildProgressStats({ weights, log: {}, targets, today: TODAY });
    expect(s.bestWeek!.days).toBeGreaterThanOrEqual(5);
    expect(s.bestWeek!.days).toBeLessThanOrEqual(9);
  });

  it("ne renvoie aucune semaine quand l'historique est trop court", () => {
    const s = buildProgressStats({
      weights: [
        { date: iso(1), w: 80 },
        { date: iso(0), w: 79.8 },
      ],
      log: {},
      targets,
      today: TODAY,
    });
    expect(s.bestWeek).toBeNull();
    expect(s.worstWeek).toBeNull();
  });

  it('compare la moyenne de cette semaine à la précédente', () => {
    const weights = dailyWeights(14, 80, -0.1);
    const s = buildProgressStats({ weights, log: {}, targets, today: TODAY });
    // Moyenne glissante en baisse : le delta doit être négatif
    expect(s.weekOverWeekKg).not.toBeNull();
    expect(s.weekOverWeekKg!).toBeLessThan(0);
  });

  it('renvoie null pour la comparaison hebdo sans données sur les 2 fenêtres', () => {
    const s = buildProgressStats({
      weights: [{ date: iso(0), w: 80 }],
      log: {},
      targets,
      today: TODAY,
    });
    expect(s.weekOverWeekKg).toBeNull();
  });
});

describe('buildProgressStats — régularité', () => {
  it('compte la série de pesées consécutives en cours', () => {
    const weights = dailyWeights(5, 80, 0);
    const s = buildProgressStats({ weights, log: {}, targets, today: TODAY });
    expect(s.weighInStreak).toBe(5);
  });

  it('casse la série dès un jour manqué', () => {
    const weights: WeightEntry[] = [
      { date: iso(4), w: 80 },
      { date: iso(3), w: 80 },
      // iso(2) manquant
      { date: iso(1), w: 80 },
      { date: iso(0), w: 80 },
    ];
    const s = buildProgressStats({ weights, log: {}, targets, today: TODAY });
    expect(s.weighInStreak).toBe(2);
  });

  it('calcule le taux de pesée sur 30 jours', () => {
    const weights = dailyWeights(15, 80, 0);
    const s = buildProgressStats({ weights, log: {}, targets, today: TODAY });
    expect(s.weighInRate30).toBe(50);
  });

  it('renvoie une série nulle sans pesée', () => {
    const s = buildProgressStats({
      weights: [],
      log: {},
      targets,
      today: TODAY,
    });
    expect(s.weighInStreak).toBe(0);
    expect(s.weighInRate30).toBe(0);
    expect(s.daysTracked).toBe(0);
  });
});

describe('buildProgressStats — adhérence calorique', () => {
  it('calcule le pourcentage de jours dans la tolérance de la cible', () => {
    const log: LogByDate = {
      [iso(0)]: [entry(2000)], // pile
      [iso(1)]: [entry(2080)], // dans la tolérance (±100)
      [iso(2)]: [entry(2400)], // hors tolérance
      [iso(3)]: [entry(1500)], // hors tolérance
    };
    const s = buildProgressStats({ weights: [], log, targets, today: TODAY });
    expect(s.trackedDays14).toBe(4);
    expect(s.kcalAdherence14).toBe(50);
  });

  it('ignore les jours non tracés', () => {
    const log: LogByDate = { [iso(0)]: [entry(2000)], [iso(1)]: [] };
    const s = buildProgressStats({ weights: [], log, targets, today: TODAY });
    expect(s.trackedDays14).toBe(1);
    expect(s.kcalAdherence14).toBe(100);
  });

  it("renvoie null quand aucun jour n'est tracé", () => {
    const s = buildProgressStats({
      weights: [],
      log: {},
      targets,
      today: TODAY,
    });
    expect(s.kcalAdherence14).toBeNull();
    expect(s.trackedDays14).toBe(0);
  });

  it('calcule la plus longue série de jours tracés', () => {
    const log: LogByDate = {
      [iso(10)]: [entry(2000)],
      [iso(9)]: [entry(2000)],
      [iso(8)]: [entry(2000)],
      // trou
      [iso(5)]: [entry(2000)],
      [iso(4)]: [entry(2000)],
    };
    const s = buildProgressStats({ weights: [], log, targets, today: TODAY });
    expect(s.bestLogStreak).toBe(3);
  });
});
