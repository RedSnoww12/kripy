import type { Phase } from '@/types';

export const mono = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  fontVariantNumeric: 'tabular-nums' as const,
  letterSpacing: '-.01em',
};

export const monoMicro = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  fontSize: 9,
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '.22em',
};

export const T = {
  bg: 'var(--bg)',
  s0: 'var(--s0)',
  s1: 'var(--s1)',
  s2: 'var(--s2)',
  s3: 'var(--s3)',
  s4: 'var(--s4)',
  t1: 'var(--t1)',
  t2: 'var(--t2)',
  t3: 'var(--t3)',
  acc: 'var(--acc)',
  acc2: 'var(--acc2)',
  grn: 'var(--grn)',
  cyan: 'var(--cyan)',
  pnk: 'var(--pnk)',
  pur: 'var(--pur)',
  yel: 'var(--yel)',
  org: 'var(--org)',
  red: 'var(--red)',
  outline: 'var(--outline-variant)',
  grad: 'var(--grad-primary)',
};

export const PHASE_CSS: Record<Phase, string> = {
  A: 'var(--phA)',
  B: 'var(--phB)',
  C: 'var(--phC)',
  D: 'var(--phD)',
  E: 'var(--phE)',
  F: 'var(--phF)',
};

export function onbFadeUp(delay = 0): React.CSSProperties {
  return {
    animation: `onbFadeUp .5s ${delay * 0.08}s backwards cubic-bezier(.2,.9,.3,1)`,
  };
}
