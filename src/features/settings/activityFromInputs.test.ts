import { describe, expect, it } from 'vitest';
import { deriveActivity, deriveActivityDetailed } from './activityFromInputs';

describe('deriveActivity', () => {
  it('returns sedentary for low steps + no sport', () => {
    expect(deriveActivity(3000, 0)).toBe('sedentary');
  });

  it('returns light around the 1.3–1.5 band', () => {
    expect(deriveActivity(6000, 0)).toBe('light');
    expect(deriveActivity(6000, 2)).toBe('light');
  });

  it('returns moderate when factor lands in [1.5, 1.7)', () => {
    expect(deriveActivity(8000, 3)).toBe('moderate');
    expect(deriveActivity(9000, 2)).toBe('moderate');
  });

  it('returns active when factor lands in [1.7, 1.9)', () => {
    expect(deriveActivity(11000, 3)).toBe('active');
  });

  it('caps at active for heavy step + sport load (derivation max is 1.825)', () => {
    const d = deriveActivityDetailed(15000, 6);
    expect(d.factor).toBeCloseTo(1.825, 2);
    expect(d.level).toBe('active');
  });

  it('exposes factor + individual contributions', () => {
    const d = deriveActivityDetailed(8000, 3);
    expect(d.stepFactor).toBe(1.5);
    expect(d.sportFactor).toBe(0.1);
    expect(d.factor).toBeCloseTo(1.6, 2);
    expect(d.level).toBe('moderate');
  });
});
