import { useEffect } from 'react';
import {
  deleteUser,
  onAuthStateChanged,
  reauthenticateWithPopup,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useSessionStore } from '@/store/useSessionStore';
import { rehydrateAll } from '@/store';
import { cloudDelete, cloudLoad, cloudSave } from './cloudSync';
import type { AuthUser } from '@/types';

function toAuthUser(user: User): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
}

export function useAuthListener(): void {
  useEffect(() => {
    if (!auth) {
      useSessionStore.getState().markAuthReady();
      return;
    }
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      const store = useSessionStore.getState();
      if (firebaseUser) {
        const mapped = toAuthUser(firebaseUser);
        store.setUser(mapped);
        const loaded = await cloudLoad(firebaseUser.uid);
        if (loaded > 0) rehydrateAll();
      } else {
        store.setUser(null);
      }
      store.markAuthReady();
    });
    return () => unsub();
  }, []);
}

export async function signInWithGoogle(): Promise<AuthUser | null> {
  if (!auth) throw new Error('Firebase non configuré');
  const result = await signInWithPopup(auth, googleProvider);
  const mapped = toAuthUser(result.user);
  useSessionStore.getState().setUser(mapped);
  const loaded = await cloudLoad(result.user.uid);
  if (loaded > 0) rehydrateAll();
  return mapped;
}

export async function signOutUser(): Promise<void> {
  if (!auth) return;
  const user = useSessionStore.getState().user;
  if (user) {
    await cloudSave(user);
  }
  await signOut(auth);
  useSessionStore.getState().reset();
}

export async function deleteAccount(): Promise<void> {
  if (!auth) throw new Error('Firebase non configuré');
  const current = auth.currentUser;
  if (!current) throw new Error('Aucun utilisateur connecté');

  await cloudDelete(current.uid);

  try {
    await deleteUser(current);
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === 'auth/requires-recent-login') {
      await reauthenticateWithPopup(current, googleProvider);
      await deleteUser(current);
    } else {
      throw e;
    }
  }

  localStorage.clear();
  useSessionStore.getState().reset();
}
