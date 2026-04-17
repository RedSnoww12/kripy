import { useEffect, useRef } from 'react';

interface TweenOptions {
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}

const DEFAULT_DURATION = 450;

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function format(
  value: number,
  decimals: number,
  prefix: string,
  suffix: string,
): string {
  return `${prefix}${value.toFixed(decimals)}${suffix}`;
}

export function useTween<T extends HTMLElement = HTMLElement>(
  target: number,
  options: TweenOptions = {},
) {
  const ref = useRef<T | null>(null);
  const frameRef = useRef<number | null>(null);
  const fromRef = useRef<number>(target);
  const isInitialRef = useRef(true);

  const {
    duration = DEFAULT_DURATION,
    decimals = 0,
    prefix = '',
    suffix = '',
  } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (isInitialRef.current) {
      el.textContent = format(target, decimals, prefix, suffix);
      fromRef.current = target;
      isInitialRef.current = false;
      return;
    }

    const from = fromRef.current;
    if (Math.abs(from - target) < Math.pow(10, -decimals - 1)) {
      el.textContent = format(target, decimals, prefix, suffix);
      fromRef.current = target;
      return;
    }

    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    const start = performance.now();

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const value = from + (target - from) * easeOutCubic(t);
      el.textContent = format(value, decimals, prefix, suffix);
      if (t < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        frameRef.current = null;
        fromRef.current = target;
      }
    };

    frameRef.current = requestAnimationFrame(step);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration, decimals, prefix, suffix]);

  return ref;
}

export function useTweenInt<T extends HTMLElement = HTMLElement>(
  target: number,
  duration = DEFAULT_DURATION,
) {
  const ref = useRef<T | null>(null);
  const frameRef = useRef<number | null>(null);
  const fromRef = useRef<number>(target);
  const isInitialRef = useRef(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (isInitialRef.current) {
      el.textContent = target.toLocaleString('fr-FR');
      fromRef.current = target;
      isInitialRef.current = false;
      return;
    }

    const from = fromRef.current;
    if (from === target) {
      el.textContent = target.toLocaleString('fr-FR');
      return;
    }

    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    const start = performance.now();

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const value = Math.round(from + (target - from) * easeOutCubic(t));
      el.textContent = value.toLocaleString('fr-FR');
      if (t < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        frameRef.current = null;
        fromRef.current = target;
      }
    };

    frameRef.current = requestAnimationFrame(step);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration]);

  return ref;
}
