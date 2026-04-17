import { describe, expect, it } from 'vitest';
import { ema } from './ema';

describe('ema', () => {
  it('returns empty for empty input', () => {
    expect(ema([], 7)).toEqual([]);
  });

  it('first value is the raw seed', () => {
    expect(ema([80], 7)[0]).toBe(80);
  });

  it('smooths noise towards the mean', () => {
    const raw = [80, 82, 78, 80, 82, 78, 80];
    const smoothed = ema(raw, 5);
    const last = smoothed[smoothed.length - 1];
    expect(last).toBeGreaterThan(78);
    expect(last).toBeLessThan(82);
  });

  it('reacts faster with smaller span', () => {
    const raw = [80, 85];
    const fast = ema(raw, 2)[1];
    const slow = ema(raw, 10)[1];
    expect(fast).toBeGreaterThan(slow);
  });
});
