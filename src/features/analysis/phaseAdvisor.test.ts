import { describe, expect, it } from 'vitest';
import { buildPhaseAdvice } from './phaseAdvisor';
import type { TrendResult, WeightEntry } from '@/types';

function trend(
  dir: TrendResult['dir'],
  overrides: Partial<TrendResult> = {},
): TrendResult {
  return {
    dir,
    rate: 0,
    confidence: 'high',
    window: 7,
    sampleSize: 7,
    r2: 0.9,
    daysOnPalier: 14,
    daysNeeded: 3,
    idealDays: 5,
    palierKcal: 1800,
    avgAct: 1800,
    avgTg: 1800,
    adherence: 100,
    trackedDays: 7,
    ...overrides,
  };
}

function w(
  date: string,
  kg: number,
  tgKcal: number,
  phase: string,
): WeightEntry {
  return { date, w: kg, tgKcal, phase: phase as WeightEntry['phase'] };
}

describe('buildPhaseAdvice — Phase B (Déficit)', () => {
  const bmr = 1700;

  it('returns null when only one palier and far from BMR (low fatigue)', () => {
    const weights = [
      w('2026-01-01', 80, 2200, 'B'),
      w('2026-01-08', 79.5, 2200, 'B'),
    ];
    const advice = buildPhaseAdvice({
      phase: 'B',
      currentKcal: 2200,
      bmr,
      weights,
      trend: trend('down'),
      goalWeight: 75,
      currentWeight: 79.5,
    });
    expect(advice).toBeNull();
  });

  it('warns at medium fatigue with 3 paliers', () => {
    const weights = [
      w('2026-01-01', 80, 2200, 'B'),
      w('2026-01-08', 79.5, 2000, 'B'),
      w('2026-01-15', 79.0, 1900, 'B'),
    ];
    const advice = buildPhaseAdvice({
      phase: 'B',
      currentKcal: 1900,
      bmr,
      weights,
      trend: trend('down'),
      goalWeight: 75,
      currentWeight: 79,
    });
    expect(advice).not.toBeNull();
    expect(advice!.fatigue).toBe('medium');
    expect(advice!.paliersInPhase).toBe(3);
    expect(advice!.options.map((o) => o.targetPhase)).toEqual(
      expect.arrayContaining(['C', 'F']),
    );
  });

  it('flags high fatigue when kcal close to BMR', () => {
    const weights = [
      w('2026-01-01', 80, 2200, 'B'),
      w('2026-01-08', 79.5, 2000, 'B'),
      w('2026-01-15', 79, 1850, 'B'),
      w('2026-01-22', 78.5, 1750, 'B'),
    ];
    const advice = buildPhaseAdvice({
      phase: 'B',
      currentKcal: 1750,
      bmr,
      weights,
      trend: trend('stable'),
      goalWeight: 75,
      currentWeight: 78.5,
    });
    expect(advice).not.toBeNull();
    expect(advice!.fatigue).toBe('high');
    expect(advice!.action).toBe('switch_to_remontee');
    expect(advice!.tone).toBe('danger');
    expect(advice!.options).toHaveLength(2);
  });

  it('suggests Reverse when goal reached', () => {
    const weights = [
      w('2026-01-01', 76, 2000, 'B'),
      w('2026-01-08', 75.2, 2000, 'B'),
    ];
    const advice = buildPhaseAdvice({
      phase: 'B',
      currentKcal: 2000,
      bmr,
      weights,
      trend: trend('down'),
      goalWeight: 75,
      currentWeight: 75.2,
    });
    expect(advice).not.toBeNull();
    expect(advice!.action).toBe('switch_to_reverse');
    expect(advice!.targetPhase).toBe('C');
  });
});

describe('buildPhaseAdvice — Phase F (Remontée)', () => {
  it('suggests deficit when maintenance optimized at J7+ (no wait button)', () => {
    const weights = [
      w('2026-01-01', 78, 1700, 'F'),
      w('2026-01-08', 78, 1900, 'F'),
      w('2026-01-15', 78, 2100, 'F'),
    ];
    const advice = buildPhaseAdvice({
      phase: 'F',
      currentKcal: 2100,
      bmr: 1600,
      weights,
      trend: trend('stable', { daysOnPalier: 14 }),
      goalWeight: 75,
      currentWeight: 78,
    });
    expect(advice).not.toBeNull();
    expect(advice!.action).toBe('switch_to_deficit');
    expect(advice!.targetPhase).toBe('B');
    expect(advice!.suppressAnalysis).toBe(true);
    const actions = advice!.options.map((o) => o.action);
    expect(actions).toContain('switch_to_deficit');
    expect(actions).toContain('push_palier');
    expect(actions).not.toContain('wait');
  });

  it('offers deficit + wait at J3 (early decision tier)', () => {
    const weights = [
      w('2026-01-01', 78, 1700, 'F'),
      w('2026-01-08', 78, 1900, 'F'),
      w('2026-01-15', 78, 2100, 'F'),
    ];
    const advice = buildPhaseAdvice({
      phase: 'F',
      currentKcal: 2100,
      bmr: 1600,
      weights,
      trend: trend('stable', { daysOnPalier: 3 }),
      goalWeight: 75,
      currentWeight: 78,
    });
    expect(advice).not.toBeNull();
    expect(advice!.action).toBe('continue');
    expect(advice!.suppressAnalysis).toBe(true);
    const actions = advice!.options.map((o) => o.action);
    expect(actions).toEqual(['switch_to_deficit', 'wait']);
    expect(advice!.headline).toContain('J3');
  });

  it('forces wait at J5 when noisy (low confidence)', () => {
    const weights = [
      w('2026-01-01', 78, 1700, 'F'),
      w('2026-01-08', 78, 1900, 'F'),
      w('2026-01-15', 78, 2100, 'F'),
    ];
    const advice = buildPhaseAdvice({
      phase: 'F',
      currentKcal: 2100,
      bmr: 1600,
      weights,
      trend: trend('stable', { daysOnPalier: 5, confidence: 'low' }),
      goalWeight: 75,
      currentWeight: 78,
    });
    expect(advice).not.toBeNull();
    expect(advice!.action).toBe('wait');
    expect(advice!.tone).toBe('warn');
    expect(advice!.options.map((o) => o.action)).toEqual(['wait']);
    expect(advice!.headline).toContain('J7');
  });

  it('forces wait at J5 when high variance (>=0.6)', () => {
    const weights = [
      w('2025-12-20', 78, 1700, 'F'),
      w('2025-12-22', 79, 1700, 'F'),
      w('2025-12-25', 77.2, 1900, 'F'),
      w('2025-12-28', 79.1, 1900, 'F'),
      w('2025-12-30', 77.5, 2100, 'F'),
      w('2026-01-02', 79.2, 2100, 'F'),
      w('2026-01-05', 77.8, 2100, 'F'),
    ];
    const advice = buildPhaseAdvice({
      phase: 'F',
      currentKcal: 2100,
      bmr: 1600,
      weights,
      trend: trend('stable', { daysOnPalier: 5, confidence: 'medium' }),
      goalWeight: 75,
      currentWeight: 77.8,
    });
    expect(advice).not.toBeNull();
    expect(advice!.action).toBe('wait');
  });

  it('offers deficit + push + wait at J5 with clean signal', () => {
    const weights = [
      w('2026-01-01', 78, 1700, 'F'),
      w('2026-01-08', 78, 1900, 'F'),
      w('2026-01-15', 78, 2100, 'F'),
    ];
    const advice = buildPhaseAdvice({
      phase: 'F',
      currentKcal: 2100,
      bmr: 1600,
      weights,
      trend: trend('stable', { daysOnPalier: 5, confidence: 'high' }),
      goalWeight: 75,
      currentWeight: 78,
    });
    expect(advice).not.toBeNull();
    expect(advice!.action).toBe('switch_to_deficit');
    const actions = advice!.options.map((o) => o.action);
    expect(actions).toEqual(['switch_to_deficit', 'push_palier', 'wait']);
  });

  it('encourages to continue when still losing while ramping up', () => {
    const weights = [
      w('2026-01-01', 78, 1700, 'F'),
      w('2026-01-08', 77.7, 1900, 'F'),
    ];
    const advice = buildPhaseAdvice({
      phase: 'F',
      currentKcal: 1900,
      bmr: 1600,
      weights,
      trend: trend('down'),
      goalWeight: 75,
      currentWeight: 77.7,
    });
    expect(advice).not.toBeNull();
    expect(advice!.action).toBe('continue');
    expect(advice!.tone).toBe('success');
  });

  it('returns null when no climb happened yet', () => {
    const weights = [w('2026-01-01', 78, 1700, 'F')];
    const advice = buildPhaseAdvice({
      phase: 'F',
      currentKcal: 1700,
      bmr: 1600,
      weights,
      trend: trend('stable'),
      goalWeight: 75,
      currentWeight: 78,
    });
    expect(advice).toBeNull();
  });
});

describe('buildPhaseAdvice — Phase C (Reverse)', () => {
  it('suggests deficit when reverse stable at J7+ (goal not reached)', () => {
    const weights = [
      w('2026-01-01', 78, 1900, 'C'),
      w('2026-01-08', 78, 2100, 'C'),
    ];
    const advice = buildPhaseAdvice({
      phase: 'C',
      currentKcal: 2100,
      bmr: 1600,
      weights,
      trend: trend('stable', { daysOnPalier: 14 }),
      goalWeight: 75,
      currentWeight: 78,
    });
    expect(advice).not.toBeNull();
    expect(advice!.action).toBe('switch_to_deficit');
    const actions = advice!.options.map((o) => o.action);
    expect(actions).toEqual(['switch_to_deficit', 'push_palier']);
    expect(advice!.suppressAnalysis).toBe(true);
  });

  it('offers deficit + wait at J3 in reverse', () => {
    const weights = [
      w('2026-01-01', 78, 1900, 'C'),
      w('2026-01-08', 78, 2100, 'C'),
    ];
    const advice = buildPhaseAdvice({
      phase: 'C',
      currentKcal: 2100,
      bmr: 1600,
      weights,
      trend: trend('stable', { daysOnPalier: 3 }),
      goalWeight: 75,
      currentWeight: 78,
    });
    expect(advice).not.toBeNull();
    expect(advice!.action).toBe('continue');
    expect(advice!.options.map((o) => o.action)).toEqual([
      'switch_to_deficit',
      'wait',
    ]);
  });

  it('forces wait at J5 when noisy in reverse', () => {
    const weights = [
      w('2026-01-01', 78, 1900, 'C'),
      w('2026-01-08', 78, 2100, 'C'),
    ];
    const advice = buildPhaseAdvice({
      phase: 'C',
      currentKcal: 2100,
      bmr: 1600,
      weights,
      trend: trend('stable', { daysOnPalier: 6, confidence: 'low' }),
      goalWeight: 75,
      currentWeight: 78,
    });
    expect(advice).not.toBeNull();
    expect(advice!.action).toBe('wait');
    expect(advice!.options.map((o) => o.action)).toEqual(['wait']);
  });

  it('suggests maintain when reverse stable and goal reached', () => {
    const weights = [
      w('2026-01-01', 75, 1900, 'C'),
      w('2026-01-08', 75, 2100, 'C'),
    ];
    const advice = buildPhaseAdvice({
      phase: 'C',
      currentKcal: 2100,
      bmr: 1600,
      weights,
      trend: trend('stable'),
      goalWeight: 75,
      currentWeight: 75,
    });
    expect(advice).not.toBeNull();
    expect(advice!.action).toBe('switch_to_maintain');
  });
});

describe('buildPhaseAdvice — guards', () => {
  it('returns null on phase A', () => {
    const advice = buildPhaseAdvice({
      phase: 'A',
      currentKcal: 2400,
      bmr: 1800,
      weights: [w('2026-01-01', 80, 2400, 'A')],
      trend: trend('stable'),
      goalWeight: 78,
      currentWeight: 80,
    });
    expect(advice).toBeNull();
  });

  it('returns null when bmr is invalid', () => {
    const advice = buildPhaseAdvice({
      phase: 'B',
      currentKcal: 1800,
      bmr: 0,
      weights: [],
      trend: trend('stable'),
      goalWeight: 75,
      currentWeight: 80,
    });
    expect(advice).toBeNull();
  });
});
