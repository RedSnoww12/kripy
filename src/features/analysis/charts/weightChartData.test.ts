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

  it('returns null with a single weight (min 2 points needed)', () => {
    expect(
      buildWeightChartData({
        weights: [mkWeight('2026-04-10', 75)],
        range: 7,
        goalWeight: 70,
      }),
    ).toBeNull();
  });

  it('includes EMA and goal fields when conditions match', () => {
    const res = buildWeightChartData({ weights, range: 9999, goalWeight: 70 });
    expect(res).not.toBeNull();
    expect(res?.hasEma).toBe(true);
    expect(res?.hasGoal).toBe(true);
    expect(res?.points[0].ema).toBeTypeOf('number');
    expect(res?.points[0].goal).toBe(70);
  });

  it('skips goal when goalWeight is 0', () => {
    const res = buildWeightChartData({ weights, range: 9999, goalWeight: 0 });
    expect(res?.hasGoal).toBe(false);
    expect(res?.points[0].goal).toBeUndefined();
  });

  it('exposes a default range set', () => {
    expect(WEIGHT_RANGES.map((r) => r.value)).toEqual([7, 15, 30, 90, 9999]);
  });
});
