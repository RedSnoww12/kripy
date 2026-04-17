import { describe, expect, it } from 'vitest';
import {
  breakdownTargets,
  percentagesToGrams,
  validatePercentages,
} from './macroDistribution';

describe('macroDistribution', () => {
  describe('percentagesToGrams', () => {
    it('converts 30/40/30 of 2200 kcal correctly', () => {
      const r = percentagesToGrams(2200, { p: 30, g: 40, l: 30 });
      expect(r.prot).toBe(165);
      expect(r.gluc).toBe(220);
      expect(r.lip).toBe(73);
    });
  });

  describe('breakdownTargets', () => {
    it('computes macro kcal totals and diff', () => {
      const b = breakdownTargets({
        kcal: 2200,
        prot: 150,
        gluc: 250,
        lip: 75,
        fib: 30,
      });
      expect(b.pKcal).toBe(600);
      expect(b.gKcal).toBe(1000);
      expect(b.lKcal).toBe(675);
      expect(b.macroKcal).toBe(2275);
      expect(b.diff).toBe(-75);
    });

    it('computes macro percentages', () => {
      const b = breakdownTargets({
        kcal: 2000,
        prot: 150,
        gluc: 200,
        lip: 60,
        fib: 30,
      });
      expect(b.pPct + b.gPct + b.lPct).toBeGreaterThan(95);
    });
  });

  describe('validatePercentages', () => {
    it('status ok when total is 100', () => {
      expect(validatePercentages({ p: 30, g: 40, l: 30 }).status).toBe('ok');
    });
    it('status over when total > 100', () => {
      expect(validatePercentages({ p: 40, g: 40, l: 30 }).status).toBe('over');
    });
    it('status under when total < 100', () => {
      expect(validatePercentages({ p: 30, g: 30, l: 30 }).status).toBe('under');
    });
  });
});
