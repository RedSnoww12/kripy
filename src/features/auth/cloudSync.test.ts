import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Firestore } from 'firebase/firestore';
import { cloudDelete, cloudLoad, cloudSave } from './cloudSync';
import { STORAGE_KEYS } from '@/lib/storage';
import type { AuthUser } from '@/types';

const setDocMock = vi.fn();
const getDocMock = vi.fn();
const deleteDocMock = vi.fn();

vi.mock('firebase/firestore', () => ({
  getFirestore: () => ({}),
  doc: (_db: unknown, col: string, id: string) => ({ col, id }),
  setDoc: (ref: unknown, data: unknown, opts: unknown) =>
    setDocMock(ref, data, opts),
  getDoc: (ref: unknown) => getDocMock(ref),
  deleteDoc: (ref: unknown) => deleteDocMock(ref),
}));

const fakeDb = {} as Firestore;
const user: AuthUser = {
  uid: 'user-1',
  email: 'a@b.c',
  displayName: 'Amara',
  photoURL: null,
};

describe('cloudSync', () => {
  beforeEach(() => {
    setDocMock.mockReset();
    getDocMock.mockReset();
    deleteDocMock.mockReset();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('cloudSave writes all populated SYNC_KEYS as raw strings', async () => {
    localStorage.setItem(STORAGE_KEYS.phase, '"B"');
    localStorage.setItem(STORAGE_KEYS.targets, '{"kcal":2200}');
    setDocMock.mockResolvedValue(undefined);

    const ok = await cloudSave(user, fakeDb);

    expect(ok).toBe(true);
    expect(setDocMock).toHaveBeenCalledOnce();
    const [, payload, opts] = setDocMock.mock.calls[0];
    expect(payload[STORAGE_KEYS.phase]).toBe('"B"');
    expect(payload[STORAGE_KEYS.targets]).toBe('{"kcal":2200}');
    expect(payload.email).toBe('a@b.c');
    expect(typeof payload.updatedAt).toBe('number');
    expect(opts).toEqual({ merge: true });
  });

  it('cloudSave skips keys with no localStorage value', async () => {
    setDocMock.mockResolvedValue(undefined);
    await cloudSave(user, fakeDb);
    const [, payload] = setDocMock.mock.calls[0];
    expect(payload[STORAGE_KEYS.log]).toBeUndefined();
  });

  it('cloudLoad hydrates localStorage from the Firestore doc', async () => {
    getDocMock.mockResolvedValue({
      exists: () => true,
      data: () => ({
        [STORAGE_KEYS.phase]: '"B"',
        [STORAGE_KEYS.setup]: 'true',
      }),
    });

    const loaded = await cloudLoad('user-1', fakeDb);
    expect(loaded).toBe(2);
    expect(localStorage.getItem(STORAGE_KEYS.phase)).toBe('"B"');
    expect(localStorage.getItem(STORAGE_KEYS.setup)).toBe('true');
  });

  it('cloudLoad returns 0 when the doc does not exist', async () => {
    getDocMock.mockResolvedValue({ exists: () => false });
    const loaded = await cloudLoad('user-1', fakeDb);
    expect(loaded).toBe(0);
  });

  it('cloudDelete removes the user doc from Firestore', async () => {
    deleteDocMock.mockResolvedValue(undefined);
    const ok = await cloudDelete('user-1', fakeDb);
    expect(ok).toBe(true);
    expect(deleteDocMock).toHaveBeenCalledOnce();
    const [ref] = deleteDocMock.mock.calls[0];
    expect(ref).toEqual({ col: 'users', id: 'user-1' });
  });

  it('cloudDelete returns false when Firestore is unavailable', async () => {
    const ok = await cloudDelete('user-1', null);
    expect(ok).toBe(false);
    expect(deleteDocMock).not.toHaveBeenCalled();
  });

  it('cloudDelete returns false when Firestore throws', async () => {
    deleteDocMock.mockRejectedValue(new Error('boom'));
    const ok = await cloudDelete('user-1', fakeDb);
    expect(ok).toBe(false);
  });
});
