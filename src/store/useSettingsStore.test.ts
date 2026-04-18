import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useSettingsStore } from './useSettingsStore';
import { STORAGE_KEYS } from '@/lib/storage';
import { DEFAULT_PROFILE } from '@/data/constants';

describe('useSettingsStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useSettingsStore.getState().rehydrate();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('returns defaults when storage is empty', () => {
    const s = useSettingsStore.getState();
    expect(s.phase).toBe(DEFAULT_PROFILE.phase);
    expect(s.setup).toBe(false);
  });

  it('persists phase changes under nt_phase', () => {
    useSettingsStore.getState().setPhase('B');
    expect(useSettingsStore.getState().phase).toBe('B');
    expect(localStorage.getItem(STORAGE_KEYS.phase)).toBe('"B"');
  });

  it('completeOnboarding writes profile + targets + setup flag', () => {
    useSettingsStore.getState().completeOnboarding(
      {
        height: 180,
        startWeight: 82,
        phase: 'D',
        stepsGoal: 12000,
        activity: 'active',
        theme: 'dark',
        sex: 'M',
      },
      { kcal: 2600, prot: 164, gluc: 280, lip: 82, fib: 36 },
    );
    const s = useSettingsStore.getState();
    expect(s.setup).toBe(true);
    expect(s.targets.kcal).toBe(2600);
    expect(localStorage.getItem(STORAGE_KEYS.setup)).toBe('true');
    expect(localStorage.getItem(STORAGE_KEYS.targets)).toContain('2600');
  });

  it('rehydrate pulls fresh values from localStorage', () => {
    localStorage.setItem(STORAGE_KEYS.phase, '"C"');
    localStorage.setItem(STORAGE_KEYS.setup, 'true');
    useSettingsStore.getState().rehydrate();
    expect(useSettingsStore.getState().phase).toBe('C');
    expect(useSettingsStore.getState().setup).toBe(true);
  });
});
