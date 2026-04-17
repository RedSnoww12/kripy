import { describe, expect, it } from 'vitest';
import {
  buildWeightChartData,
  sliceWeights,
  WEIGHT_RANGES,
} from './weightChartData';
import type { WeightEntry } from '@/types';

function mkWeight(date: string, w: number): WeightEntry {
  return { date, w };
}

describe('weightChartData', () => {
  const weights: WeightEntry[] = [
    mkWeight('2026-04-10', 75),
    mkWeight('2026-04-11', 74.8),
    mkWeight('2026-04-12', 74.6),
    mkWeight('2026-04-13', 74.4),
    mkWeight('2026-04-14', 74.2),
  ];

  it('range "Tout" returns every entry', () => {
    expect(sliceWeights(weights, 9999)).toHaveLength(5);
  });

  it('range caps to last N entries', () => {
    expect(sliceWeights(weights, 3)).toHaveLength(3);
    expect(sliceWeights(weights, 3)[0].w).toBe(74.6);
  });

  it('returns null with no weights', () => {
    expect(
      buildWeightChartData({ weights: [], range: 7, goalWeight: 70 }),
    ).toBeNull();
  });

  it('includes EMA dataset when >= 3 points', () => {
    const data = buildWeightChartData({ weights, range: 9999, goalWeight: 70 });
    expect(data).not.toBeNull();
    expect(data?.datasets).toHaveLength(3);
    expect(data?.datasets[1].label).toBe('Tendance (EMA)');
    expect(data?.datasets[2].label).toBe('Objectif');
  });

  it('skips objective line when goalWeight is 0', () => {
    const data = buildWeightChartData({ weights, range: 9999, goalWeight: 0 });
    expect(data?.datasets).toHaveLength(2);
  });

  it('exposes a default range set', () => {
    expect(WEIGHT_RANGES.map((r) => r.value)).toEqual([7, 15, 30, 90, 9999]);
  });
});
