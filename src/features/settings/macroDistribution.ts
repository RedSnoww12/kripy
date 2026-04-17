import type { Targets } from '@/types';

export interface MacroPercentages {
  p: number;
  g: number;
  l: number;
}

export function percentagesToGrams(
  kcal: number,
  pct: MacroPercentages,
): { prot: number; gluc: number; lip: number } {
  return {
    prot: Math.round((kcal * pct.p) / 100 / 4),
    gluc: Math.round((kcal * pct.g) / 100 / 4),
    lip: Math.round((kcal * pct.l) / 100 / 9),
  };
}

export interface MacroTotalsBreakdown {
  kcal: number;
  macroKcal: number;
  diff: number;
  pPct: number;
  gPct: number;
  lPct: number;
  pKcal: number;
  gKcal: number;
  lKcal: number;
}

export function breakdownTargets(targets: Targets): MacroTotalsBreakdown {
  const pKcal = targets.prot * 4;
  const gKcal = targets.gluc * 4;
  const lKcal = targets.lip * 9;
  const macroKcal = pKcal + gKcal + lKcal;
  return {
    kcal: targets.kcal,
    macroKcal,
    diff: targets.kcal - macroKcal,
    pPct: macroKcal > 0 ? Math.round((pKcal / macroKcal) * 100) : 0,
    gPct: macroKcal > 0 ? Math.round((gKcal / macroKcal) * 100) : 0,
    lPct: macroKcal > 0 ? Math.round((lKcal / macroKcal) * 100) : 0,
    pKcal,
    gKcal,
    lKcal,
  };
}

export type PercentStatus = 'ok' | 'over' | 'under';

export interface PercentValidation {
  total: number;
  status: PercentStatus;
}

export function validatePercentages(pct: MacroPercentages): PercentValidation {
  const total = pct.p + pct.g + pct.l;
  const status: PercentStatus =
    total === 100 ? 'ok' : total > 100 ? 'over' : 'under';
  return { total, status };
}
