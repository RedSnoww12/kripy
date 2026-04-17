import { describe, expect, it } from 'vitest';
import {
  computeVariance,
  describeVariance,
  rateMessageFor,
} from './weightAnalysis';
import type { TrendResult, WeightEntry, WeightStats } from '@/types';

function stats(rate: number): WeightStats {
  return {
    cur: 75,
    start: 77,
    mn: 75,
    mx: 77,
    bmi: '24.5',
    avg7: 75.5,
    avg30: 76,
    rate,
    estDays: null,
    total: -2,
    reg: 80,
    count: 20,
  };
}

function trend(rate: number): TrendResult {
  return {
    dir: 'down',
    rate,
    confidence: 'high',
    window: 7,
    sampleSize: 7,
    r2: 0.9,
    daysOnPalier: 10,
    daysNeeded: 3,
    idealDays: 5,
    palierKcal: 2200,
    avgAct: 2100,
    avgTg: 2200,
    adherence: 95,
    trackedDays: 5,
  };
}

describe('weightAnalysis', () => {
  describe('computeVariance', () => {
    it('returns 0 when not enough data', () => {
      expect(computeVariance([])).toBe(0);
      expect(computeVariance([{ date: '2026-04-01', w: 75 }])).toBe(0);
    });

    it('returns std-dev-ish metric', () => {
      const entries: WeightEntry[] = [
        { date: '2026-04-01', w: 75 },
        { date: '2026-04-02', w: 75.5 },
        { date: '2026-04-03', w: 74.5 },
        { date: '2026-04-04', w: 75 },
      ];
      const v = computeVariance(entries);
      expect(v).toBeGreaterThan(0);
      expect(v).toBeLessThan(1);
    });
  });

  describe('describeVariance', () => {
    it('classes very stable under 0.3', () => {
      expect(describeVariance(0.2).color).toBe('var(--grn)');
    });
    it('classes large over 0.6', () => {
      expect(describeVariance(0.8).color).toBe('var(--org)');
    });
  });

  describe('rateMessageFor', () => {
    it('phase B fast drop is warn', () => {
      expect(
        rateMessageFor({ phase: 'B', trend: trend(-1.2), stats: stats(-1.2) })
          .tone,
      ).toBe('warn');
    });
    it('phase D plateau is danger', () => {
      expect(
        rateMessageFor({ phase: 'D', trend: trend(-0.1), stats: stats(-0.1) })
          .tone,
      ).toBe('danger');
    });
    it('uses stats.rate when trend is observing', () => {
      const observing: TrendResult = { ...trend(0), dir: 'observing' };
      const msg = rateMessageFor({
        phase: 'B',
        trend: observing,
        stats: stats(-0.5),
      });
      expect(msg.tone).toBe('success');
    });
  });
});
