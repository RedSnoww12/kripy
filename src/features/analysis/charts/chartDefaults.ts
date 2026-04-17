export const CHART_TOKENS = {
  primary: 'var(--grn)',
  cyan: 'var(--cyan)',
  pink: 'var(--pnk)',
  orange: 'var(--org)',
  yellow: 'var(--yel)',
  purple: 'var(--pur)',
  red: 'var(--red)',
  accent: 'var(--acc)',
  tickMute: 'var(--t3)',
  gridMute: 'var(--l1)',
} as const;

export const MACRO_COLORS = {
  p: CHART_TOKENS.primary,
  g: CHART_TOKENS.cyan,
  l: CHART_TOKENS.pink,
  f: CHART_TOKENS.orange,
} as const;

export const MONO_FONT = {
  fontFamily: 'JetBrains Mono',
  fontSize: 8,
} as const;

export function rateColor(value: number): string {
  if (value > 0) return 'var(--grn)';
  if (value < 0) return 'var(--red)';
  return CHART_TOKENS.primary;
}
