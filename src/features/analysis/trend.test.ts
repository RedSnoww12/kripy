import { describe, expect, it } from 'vitest';
import {
  linReg,
  phaseTrend,
  recommendAction,
  trend72,
  weightStats,
} from './trend';
import type {
  LogByDate,
  Palier,
  Phase,
  TrendResult,
  WeightEntry,
} from '@/types';

describe('linReg', () => {
  it('fits a perfect line with r2=1', () => {
    const r = linReg([
      { x: 0, y: 0 },
      { x: 1, y: 2 },
      { x: 2, y: 4 },
    ]);
    expect(r.slope).toBeCloseTo(2, 6);
    expect(r.intercept).toBeCloseTo(0, 6);
    expect(r.r2).toBeCloseTo(1, 6);
  });

  it('handles empty input', () => {
    expect(linReg([])).toEqual({
      slope: 0,
      intercept: 0,
      r2: 0,
      ssRes: 0,
      n: 0,
    });
  });
});

describe('trend72', () => {
  const palier: Palier = {
    kcal: 2200,
    phase: 'B',
    startDate: '2026-04-10',
  };
  const today = '2026-04-17';
  const emptyLog: LogByDate = {};

  it('returns null when no weights', () => {
    expect(
      trend72({
        weights: [],
        palier,
        currentKcal: 2200,
        currentPhase: 'B',
        log: emptyLog,
        today,
      }),
    ).toBeNull();
  });

  it('returns observing state when not enough data on palier', () => {
    const r = trend72({
      weights: [
        { date: '2026-04-15', w: 75, tgKcal: 2200, phase: 'B' },
        { date: '2026-04-16', w: 74.8, tgKcal: 2200, phase: 'B' },
      ],
      palier,
      currentKcal: 2200,
      currentPhase: 'B',
      log: emptyLog,
      today,
    }) as TrendResult;
    expect(r.dir).toBe('observing');
    expect(r.confidence).toBe('pending');
  });

  it('computes a downward trend with sufficient data', () => {
    const weights: WeightEntry[] = [
      { date: '2026-04-10', w: 75.0, tgKcal: 2200, phase: 'B' },
      { date: '2026-04-11', w: 74.7, tgKcal: 2200, phase: 'B' },
      { date: '2026-04-12', w: 74.5, tgKcal: 2200, phase: 'B' },
      { date: '2026-04-13', w: 74.2, tgKcal: 2200, phase: 'B' },
      { date: '2026-04-14', w: 74.0, tgKcal: 2200, phase: 'B' },
      { date: '2026-04-15', w: 73.7, tgKcal: 2200, phase: 'B' },
      { date: '2026-04-16', w: 73.5, tgKcal: 2200, phase: 'B' },
    ];
    const r = trend72({
      weights,
      palier,
      currentKcal: 2200,
      currentPhase: 'B',
      log: emptyLog,
      today,
    }) as TrendResult;
    expect(r).not.toBeNull();
    expect(r.rate).toBeLessThan(0);
    expect(['down', 'down_fast']).toContain(r.dir);
  });

  it('excludes weigh-ins from before the palier startDate', () => {
    const weights: WeightEntry[] = [
      { date: '2026-04-05', w: 77, tgKcal: 2400, phase: 'A' },
      { date: '2026-04-06', w: 77.1, tgKcal: 2400, phase: 'A' },
      { date: '2026-04-07', w: 77.2, tgKcal: 2400, phase: 'A' },
    ];
    const r = trend72({
      weights,
      palier,
      currentKcal: 2200,
      currentPhase: 'B',
      log: emptyLog,
      today,
    }) as TrendResult;
    expect(r.dir).toBe('observing');
    expect(r.sampleSize).toBe(0);
  });
});

describe('phaseTrend', () => {
  it('returns null with no weights', () => {
    expect(
      phaseTrend({
        weights: [],
        phase: 'B',
        currentKcal: 2200,
        log: {},
      }),
    ).toBeNull();
  });

  it('computes rate across all matching phase entries', () => {
    const weights: WeightEntry[] = [
      { date: '2026-04-01', w: 78, phase: 'B', tgKcal: 2200 },
      { date: '2026-04-15', w: 76, phase: 'B', tgKcal: 2200 },
    ];
    const r = phaseTrend({
      weights,
      phase: 'B',
      currentKcal: 2200,
      log: {},
    });
    expect(r?.count).toBe(2);
    expect(r?.totalChange).toBe(-2);
  });
});

describe('weightStats', () => {
  it('returns null with no weights', () => {
    expect(
      weightStats({
        weights: [],
        heightCm: 175,
        startWeight: 75,
        today: '2026-04-17',
      }),
    ).toBeNull();
  });

  it('computes BMI, current, min/max', () => {
    const r = weightStats({
      weights: [
        { date: '2026-04-10', w: 74 },
        { date: '2026-04-15', w: 73 },
      ],
      heightCm: 175,
      startWeight: 75,
      today: '2026-04-17',
    });
    expect(r?.cur).toBe(73);
    expect(r?.start).toBe(74);
    expect(r?.mn).toBe(73);
    expect(r?.mx).toBe(74);
    expect(r?.bmi).toBe('23.8');
  });
});

describe('recommendAction', () => {
  const baseTrend: TrendResult = {
    dir: 'down',
    rate: -0.5,
    confidence: 'high',
    window: 7,
    sampleSize: 7,
    r2: 0.9,
    daysOnPalier: 10,
    daysNeeded: 3,
    idealDays: 5,
    palierKcal: 2200,
    avgAct: 2150,
    avgTg: 2200,
    adherence: 98,
    trackedDays: 6,
  };

  it('returns observer when trend is observing', () => {
    const r = recommendAction(
      'B',
      { ...baseTrend, dir: 'observing', confidence: 'pending' },
      2200,
    );
    expect(r.act).toBe('observer');
  });

  it('phase B + down_fast suggests +200', () => {
    const r = recommendAction('B', { ...baseTrend, dir: 'down_fast' }, 2200);
    expect(r.act).toBe('+200');
  });

  it('phase B + stable suggests -200', () => {
    const r = recommendAction('B', { ...baseTrend, dir: 'stable' }, 2200);
    expect(r.act).toBe('-200');
  });

  it('phase D + stable suggests +200', () => {
    const r = recommendAction(
      'D',
      { ...baseTrend, dir: 'stable', avgAct: 2580, avgTg: 2600 },
      2600,
    );
    expect(r.act).toBe('+200');
  });

  it('warns on low adherence', () => {
    const r = recommendAction(
      'B',
      { ...baseTrend, confidence: 'low', adherence: 60 },
      2200,
    );
    expect(r.act).toBe('observer');
    expect(r.tp).toBe('warn');
  });

  it('never drops below 1200 kcal floor', () => {
    const r = recommendAction(
      'B' as Phase,
      { ...baseTrend, dir: 'stable', avgAct: 1280, avgTg: 1300 },
      1300,
    );
    expect(r.act).toBe('-200');
    expect(r.msg).toContain('1200');
  });
});
