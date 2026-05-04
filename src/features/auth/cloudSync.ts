import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  type FieldValue,
  type Firestore,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SYNC_KEYS } from '@/lib/storage';
import type { AuthUser } from '@/types';

interface CloudDoc {
  [key: string]: string | number | FieldValue | null | undefined;
  updatedAt?: FieldValue;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
}

function getDb(explicitDb?: Firestore | null): Firestore | null {
  return explicitDb ?? db;
}

export async function cloudSave(
  user: AuthUser,
  firestore: Firestore | null = db,
): Promise<boolean> {
  const database = getDb(firestore);
  if (!database) return false;

  const payload: CloudDoc = {
    updatedAt: serverTimestamp(),
    displayName: user.displayName ?? null,
    email: user.email ?? null,
    photoURL: user.photoURL ?? null,
  };

  for (const key of SYNC_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw !== null) payload[key] = raw;
  }

  try {
    await setDoc(doc(database, 'users', user.uid), payload, { merge: true });
    return true;
  } catch (e) {
    console.warn('cloudSave failed', e);
    return false;
  }
}

export async function cloudLoad(
  uid: string,
  firestore: Firestore | null = db,
): Promise<number> {
  const database = getDb(firestore);
  if (!database) return 0;

  try {
    const snap = await getDoc(doc(database, 'users', uid));
    if (!snap.exists()) return 0;
    const data = snap.data() as CloudDoc;
    let loaded = 0;
    for (const key of SYNC_KEYS) {
      const v = data[key];
      if (typeof v === 'string') {
        localStorage.setItem(key, v);
        loaded++;
      }
    }
    return loaded;
  } catch (e) {
    console.warn('cloudLoad failed', e);
    return 0;
  }
}

export async function cloudDelete(
  uid: string,
  firestore: Firestore | null = db,
): Promise<boolean> {
  const database = getDb(firestore);
  if (!database) return false;
  try {
    await deleteDoc(doc(database, 'users', uid));
    return true;
  } catch (e) {
    console.warn('cloudDelete failed', e);
    return false;
  }
}
