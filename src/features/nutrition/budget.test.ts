import { describe, expect, it } from 'vitest';
import {
  activeAdjustments,
  adjustmentDayIndex,
  adjustmentEndDate,
  buildAdjustment,
  clampSmoothDays,
  dailyDelta,
  effectiveKcalTarget,
  findBySourceDate,
  pruneAdjustments,
  totalDailyDelta,
} from './budget';

describe('buildAdjustment', () => {
  it('démarre le lendemain du jour de surplus', () => {
    const adj = buildAdjustment('2026-06-10', 200, 4, 1);
    expect(adj.startDate).toBe('2026-06-11');
    expect(adj.sourceDate).toBe('2026-06-10');
    expect(adj.amount).toBe(200);
    expect(adj.days).toBe(4);
  });

  it('arrondit le montant et borne le nombre de jours', () => {
    const adj = buildAdjustment('2026-06-10', 199.6, 99, 1);
    expect(adj.amount).toBe(200);
    expect(adj.days).toBe(30);
  });

  it('refuse un montant négatif', () => {
    expect(buildAdjustment('2026-06-10', -50, 3, 1).amount).toBe(0);
  });
});

describe('clampSmoothDays', () => {
  it('borne entre 1 et 30', () => {
    expect(clampSmoothDays(0)).toBe(1);
    expect(clampSmoothDays(31)).toBe(30);
    expect(clampSmoothDays(5)).toBe(5);
    expect(clampSmoothDays(NaN)).toBe(1);
  });
});

describe('dailyDelta', () => {
  const adj = buildAdjustment('2026-06-10', 200, 3, 1);

  it('vaut 0 hors de la fenêtre de lissage', () => {
    expect(dailyDelta(adj, '2026-06-10')).toBe(0);
    expect(dailyDelta(adj, '2026-06-14')).toBe(0);
  });

  it('répartit exactement le surplus (somme = montant)', () => {
    const deltas = ['2026-06-11', '2026-06-12', '2026-06-13'].map((d) =>
      dailyDelta(adj, d),
    );
    expect(deltas.reduce((a, b) => a + b, 0)).toBe(200);
    deltas.forEach((d) => expect(Math.abs(d - 200 / 3)).toBeLessThan(1));
  });

  it('répartit exactement même avec un reste (somme = montant)', () => {
    const a = buildAdjustment('2026-06-10', 100, 7, 1);
    let sum = 0;
    for (let i = 1; i <= 7; i++) {
      sum += dailyDelta(a, `2026-06-${String(10 + i).padStart(2, '0')}`);
    }
    expect(sum).toBe(100);
  });

  it('gère un lissage sur un seul jour', () => {
    const a = buildAdjustment('2026-06-10', 150, 1, 1);
    expect(dailyDelta(a, '2026-06-11')).toBe(150);
    expect(dailyDelta(a, '2026-06-12')).toBe(0);
  });
});

describe('totalDailyDelta / effectiveKcalTarget', () => {
  const a1 = buildAdjustment('2026-06-10', 200, 4, 1);
  const a2 = buildAdjustment('2026-06-11', 100, 2, 2);

  it('cumule les lissages qui se chevauchent', () => {
    expect(totalDailyDelta([a1, a2], '2026-06-12')).toBe(50 + 50);
    expect(effectiveKcalTarget(2200, [a1, a2], '2026-06-12')).toBe(2100);
  });

  it('ne descend jamais sous 0', () => {
    const big = buildAdjustment('2026-06-10', 5000, 1, 3);
    expect(effectiveKcalTarget(2200, [big], '2026-06-11')).toBe(0);
  });

  it('vaut la cible de base sans lissage actif', () => {
    expect(effectiveKcalTarget(2200, [], '2026-06-12')).toBe(2200);
    expect(effectiveKcalTarget(2200, [a1], '2026-06-20')).toBe(2200);
  });
});

describe('activeAdjustments / adjustmentDayIndex / endDate', () => {
  const adj = buildAdjustment('2026-06-10', 200, 3, 1);

  it('filtre les lissages actifs à une date', () => {
    expect(activeAdjustments([adj], '2026-06-11')).toHaveLength(1);
    expect(activeAdjustments([adj], '2026-06-10')).toHaveLength(0);
    expect(activeAdjustments([adj], '2026-06-14')).toHaveLength(0);
  });

  it('calcule l’index du jour (1-based) et la date de fin', () => {
    expect(adjustmentDayIndex(adj, '2026-06-11')).toBe(1);
    expect(adjustmentDayIndex(adj, '2026-06-13')).toBe(3);
    expect(adjustmentEndDate(adj)).toBe('2026-06-13');
  });
});

describe('findBySourceDate / pruneAdjustments', () => {
  it('retrouve un lissage par jour de surplus', () => {
    const adj = buildAdjustment('2026-06-10', 200, 3, 1);
    expect(findBySourceDate([adj], '2026-06-10')).toBe(adj);
    expect(findBySourceDate([adj], '2026-06-11')).toBeUndefined();
  });

  it('purge les lissages terminés depuis longtemps, garde les récents', () => {
    const old = buildAdjustment('2026-01-01', 200, 3, 1);
    const recent = buildAdjustment('2026-06-05', 100, 3, 2);
    const pruned = pruneAdjustments([old, recent], '2026-06-10');
    expect(pruned).toEqual([recent]);
  });
});
