import { describe, expect, it } from 'vitest';
import {
  computePalier,
  extendPalierBackward,
  palierDays,
  palierTimeline,
  targetForDate,
} from './palier';
import type { Palier, WeightEntry } from '@/types';

describe('palier', () => {
  const today = '2026-04-17';

  describe('computePalier', () => {
    it('creates a palier when none exists', () => {
      const p = computePalier(null, 2200, 'B', [], today);
      expect(p).toEqual({ kcal: 2200, phase: 'B', startDate: today });
    });

    it('recreates when kcal changes', () => {
      const stored: Palier = {
        kcal: 2400,
        phase: 'B',
        startDate: '2026-04-01',
      };
      const p = computePalier(stored, 2200, 'B', [], today);
      expect(p.startDate).toBe(today);
      expect(p.kcal).toBe(2200);
    });

    it('recreates when phase changes', () => {
      const stored: Palier = {
        kcal: 2200,
        phase: 'B',
        startDate: '2026-04-01',
      };
      const p = computePalier(stored, 2200, 'A', [], today);
      expect(p.startDate).toBe(today);
      expect(p.phase).toBe('A');
    });

    it('extends startDate backward across matching weigh-ins', () => {
      const stored: Palier = { kcal: 2200, phase: 'B', startDate: today };
      const weights: WeightEntry[] = [
        { date: '2026-04-15', w: 75.0, tgKcal: 2200, phase: 'B' },
        { date: '2026-04-16', w: 74.8, tgKcal: 2200, phase: 'B' },
        { date: '2026-04-17', w: 74.6, tgKcal: 2200, phase: 'B' },
      ];
      const p = computePalier(stored, 2200, 'B', weights, today);
      expect(p.startDate).toBe('2026-04-15');
    });

    it('stops extending at the first mismatching weigh-in', () => {
      const stored: Palier = { kcal: 2200, phase: 'B', startDate: today };
      const weights: WeightEntry[] = [
        { date: '2026-04-10', w: 76.0, tgKcal: 2400, phase: 'A' },
        { date: '2026-04-15', w: 75.0, tgKcal: 2200, phase: 'B' },
        { date: '2026-04-16', w: 74.8, tgKcal: 2200, phase: 'B' },
      ];
      const p = computePalier(stored, 2200, 'B', weights, today);
      expect(p.startDate).toBe('2026-04-15');
    });

    it('ignores legacy entries without tgKcal/phase when extending', () => {
      const stored: Palier = { kcal: 2200, phase: 'B', startDate: today };
      const weights: WeightEntry[] = [
        { date: '2026-04-15', w: 75.0 },
        { date: '2026-04-16', w: 74.8, tgKcal: 2200, phase: 'B' },
      ];
      const p = computePalier(stored, 2200, 'B', weights, today);
      expect(p.startDate).toBe('2026-04-16');
    });
  });

  describe('extendPalierBackward', () => {
    const palier: Palier = {
      kcal: 2200,
      phase: 'B',
      startDate: '2026-04-15',
    };

    it('extends when the new date matches and is older', () => {
      const p = extendPalierBackward(palier, '2026-04-10', 2200, 'B');
      expect(p.startDate).toBe('2026-04-10');
    });

    it('does nothing when date is newer', () => {
      const p = extendPalierBackward(palier, '2026-04-16', 2200, 'B');
      expect(p).toBe(palier);
    });

    it('does nothing when kcal or phase differs', () => {
      expect(extendPalierBackward(palier, '2026-04-10', 2400, 'B')).toBe(
        palier,
      );
      expect(extendPalierBackward(palier, '2026-04-10', 2200, 'A')).toBe(
        palier,
      );
    });

    it('rejects malformed dates', () => {
      expect(extendPalierBackward(palier, '2026/04/10', 2200, 'B')).toBe(
        palier,
      );
    });
  });

  describe('palierDays', () => {
    it('counts full days since startDate', () => {
      const p: Palier = { kcal: 2200, phase: 'B', startDate: '2026-04-10' };
      expect(palierDays(p, '2026-04-17')).toBe(7);
    });
    it('returns 0 on the start day', () => {
      const p: Palier = { kcal: 2200, phase: 'B', startDate: today };
      expect(palierDays(p, today)).toBe(0);
    });
  });

  describe('palierTimeline', () => {
    it('returns sorted timeline from weights with tgKcal', () => {
      const weights: WeightEntry[] = [
        { date: '2026-04-10', w: 76, tgKcal: 2400 },
        { date: '2026-04-05', w: 77, tgKcal: 2400 },
        { date: '2026-04-15', w: 75, tgKcal: 2200 },
      ];
      const tl = palierTimeline(weights, 2200, today);
      expect(tl.map((e) => e.date)).toEqual([
        '2026-04-05',
        '2026-04-10',
        '2026-04-15',
      ]);
    });

    it('appends today point if current kcal differs from last', () => {
      const weights: WeightEntry[] = [
        { date: '2026-04-10', w: 76, tgKcal: 2400 },
      ];
      const tl = palierTimeline(weights, 2200, today);
      expect(tl).toHaveLength(2);
      expect(tl[1]).toEqual({ date: today, tgKcal: 2200 });
    });
  });

  describe('targetForDate', () => {
    const weights: WeightEntry[] = [
      { date: '2026-04-01', w: 78, tgKcal: 2400 },
      { date: '2026-04-10', w: 75, tgKcal: 2200 },
    ];

    it('returns the palier active at a given date', () => {
      expect(targetForDate('2026-04-05', weights, 2200, today)).toBe(2400);
      expect(targetForDate('2026-04-12', weights, 2200, today)).toBe(2200);
    });
  });
});
