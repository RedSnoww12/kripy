import { addDoc, collection, type Firestore } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { loadJSON, saveJSON } from '@/lib/storage';

export type FeedbackType = 'bug' | 'feature' | 'other';

export interface FeedbackDraft {
  type: FeedbackType;
  message: string;
  email?: string;
}

export interface FeedbackEntry extends FeedbackDraft {
  id: string;
  createdAt: number;
  uid?: string | null;
  displayName?: string | null;
  userAgent?: string;
  appVersion?: string;
  synced: boolean;
}

export interface ValidationResult {
  ok: boolean;
  error?: string;
}

export const FEEDBACK_MIN_LEN = 10;
export const FEEDBACK_MAX_LEN = 2000;
export const FEEDBACK_STORAGE_KEY = 'nt_feedback_local';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateFeedback(draft: FeedbackDraft): ValidationResult {
  const message = draft.message.trim();
  if (message.length < FEEDBACK_MIN_LEN) {
    return {
      ok: false,
      error: `Message trop court (min ${FEEDBACK_MIN_LEN} caractères).`,
    };
  }
  if (message.length > FEEDBACK_MAX_LEN) {
    return {
      ok: false,
      error: `Message trop long (max ${FEEDBACK_MAX_LEN} caractères).`,
    };
  }
  if (!['bug', 'feature', 'other'].includes(draft.type)) {
    return { ok: false, error: 'Type invalide.' };
  }
  if (draft.email && !EMAIL_RE.test(draft.email.trim())) {
    return { ok: false, error: 'Email invalide.' };
  }
  return { ok: true };
}

export function loadLocalFeedback(): FeedbackEntry[] {
  return loadJSON<FeedbackEntry[]>(FEEDBACK_STORAGE_KEY, []);
}

export function saveLocalFeedback(entries: FeedbackEntry[]): void {
  saveJSON(FEEDBACK_STORAGE_KEY, entries);
}

export function appendLocalFeedback(entry: FeedbackEntry): FeedbackEntry[] {
  const existing = loadLocalFeedback();
  const next = [entry, ...existing].slice(0, 50);
  saveLocalFeedback(next);
  return next;
}

interface SubmitContext {
  uid?: string | null;
  displayName?: string | null;
  appVersion?: string;
  firestore?: Firestore | null;
  now?: () => number;
  randomId?: () => string;
}

export interface SubmitResult {
  ok: boolean;
  entry?: FeedbackEntry;
  error?: string;
}

export async function submitFeedback(
  draft: FeedbackDraft,
  ctx: SubmitContext = {},
): Promise<SubmitResult> {
  const check = validateFeedback(draft);
  if (!check.ok) return { ok: false, error: check.error };

  const now = ctx.now ?? Date.now;
  const randomId = ctx.randomId ?? fallbackId;
  const firestore = ctx.firestore ?? db;

  const entry: FeedbackEntry = {
    id: randomId(),
    createdAt: now(),
    type: draft.type,
    message: draft.message.trim(),
    email: draft.email?.trim() || undefined,
    uid: ctx.uid ?? null,
    displayName: ctx.displayName ?? null,
    userAgent:
      typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    appVersion: ctx.appVersion,
    synced: false,
  };

  if (firestore) {
    try {
      await addDoc(collection(firestore, 'feedback'), {
        createdAt: entry.createdAt,
        type: entry.type,
        message: entry.message,
        email: entry.email ?? null,
        uid: entry.uid ?? null,
        displayName: entry.displayName ?? null,
        userAgent: entry.userAgent ?? null,
        appVersion: entry.appVersion ?? null,
      });
      entry.synced = true;
    } catch (e) {
      console.warn('feedback cloud submit failed', e);
    }
  }

  appendLocalFeedback(entry);
  return { ok: true, entry };
}

function fallbackId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }
  return `fb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
