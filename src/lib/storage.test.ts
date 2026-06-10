import { afterEach, describe, expect, it } from 'vitest';
import { loadJSON, saveJSON, removeKey, STORAGE_KEYS } from './storage';

describe('storage', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('returns fallback when key is missing', () => {
    expect(loadJSON('missing', { v: 1 })).toEqual({ v: 1 });
  });

  it('persists and rereads JSON values', () => {
    saveJSON('nt_test', { a: 1 });
    expect(loadJSON('nt_test', null)).toEqual({ a: 1 });
  });

  it('removes a key', () => {
    saveJSON('nt_test', 42);
    removeKey('nt_test');
    expect(localStorage.getItem('nt_test')).toBeNull();
  });

  it('uses the stable nt_* key namespace for cloud sync', () => {
    expect(STORAGE_KEYS.log).toBe('nt_log');
    expect(STORAGE_KEYS.targets).toBe('nt_targets');
    expect(STORAGE_KEYS.budget).toBe('nt_budget');
  });
});
