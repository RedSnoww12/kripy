import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FEEDBACK_MAX_LEN,
  FEEDBACK_MIN_LEN,
  FEEDBACK_STORAGE_KEY,
  appendLocalFeedback,
  loadLocalFeedback,
  submitFeedback,
  validateFeedback,
  type FeedbackEntry,
} from './feedback';

describe('validateFeedback', () => {
  it('rejects short messages', () => {
    const r = validateFeedback({ type: 'bug', message: 'too short' });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/court/);
  });

  it('rejects messages over the max length', () => {
    const r = validateFeedback({
      type: 'bug',
      message: 'a'.repeat(FEEDBACK_MAX_LEN + 1),
    });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/long/);
  });

  it('accepts a message at the min length boundary', () => {
    const r = validateFeedback({
      type: 'feature',
      message: 'a'.repeat(FEEDBACK_MIN_LEN),
    });
    expect(r.ok).toBe(true);
  });

  it('rejects invalid type', () => {
    const r = validateFeedback({
      type: 'spam' as unknown as 'bug',
      message: 'Bonjour, ceci est un retour valide.',
    });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/Type/);
  });

  it('rejects an invalid email', () => {
    const r = validateFeedback({
      type: 'bug',
      message: 'Bonjour, ceci est un retour valide.',
      email: 'not-an-email',
    });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/Email/);
  });

  it('accepts a valid email', () => {
    const r = validateFeedback({
      type: 'bug',
      message: 'Bonjour, ceci est un retour valide.',
      email: 'user@example.com',
    });
    expect(r.ok).toBe(true);
  });
});

describe('local feedback storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('appends entries and caps to 50', () => {
    const base: FeedbackEntry = {
      id: 'x',
      createdAt: 1,
      type: 'bug',
      message: 'msg',
      synced: false,
    };
    for (let i = 0; i < 55; i++) {
      appendLocalFeedback({ ...base, id: `id-${i}`, createdAt: i });
    }
    const list = loadLocalFeedback();
    expect(list).toHaveLength(50);
    expect(list[0].id).toBe('id-54');
  });
});

describe('submitFeedback', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns validation error and does not persist', async () => {
    const res = await submitFeedback({ type: 'bug', message: 'nope' });
    expect(res.ok).toBe(false);
    expect(loadLocalFeedback()).toHaveLength(0);
  });

  it('stores locally when firestore is unavailable', async () => {
    const res = await submitFeedback(
      {
        type: 'feature',
        message: 'J’aimerais un export CSV des pesées.',
      },
      {
        firestore: null,
        randomId: () => 'fixed-id',
        now: () => 1234,
      },
    );
    expect(res.ok).toBe(true);
    expect(res.entry?.synced).toBe(false);
    const stored = JSON.parse(
      localStorage.getItem(FEEDBACK_STORAGE_KEY) ?? '[]',
    );
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe('fixed-id');
  });
});
