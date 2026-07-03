import { loadJSON, removeKey, saveJSON, STORAGE_KEYS } from '@/lib/storage';

/**
 * Synchronisation des pas via l'API REST Google Fit.
 *
 * Google Fit agrège les pas du téléphone (Android) et des montres connectées
 * qui y sont reliées (dont Garmin via Health Sync / Health Connect). C'est le
 * seul canal exploitable depuis une PWA : les API Garmin et Apple Santé ne
 * sont pas accessibles depuis le web sans programme partenaire.
 *
 * Le token OAuth reste local (nt_gtoken, jamais synchronisé dans le cloud).
 */

const SCOPE = 'https://www.googleapis.com/auth/fitness.activity.read';
const GIS_SRC = 'https://accounts.google.com/gsi/client';
const AGGREGATE_URL =
  'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate';
const STEPS_SOURCE =
  'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps';

export type StepsSyncErrorReason =
  | 'not_configured'
  | 'auth'
  | 'network'
  | 'api';

export class StepsSyncError extends Error {
  reason: StepsSyncErrorReason;
  constructor(reason: StepsSyncErrorReason, message?: string) {
    super(message ?? reason);
    this.reason = reason;
  }
}

interface StoredToken {
  token: string;
  /** Timestamp ms d'expiration (marge de 60s déjà déduite). */
  exp: number;
}

interface TokenClient {
  requestAccessToken: (options?: { prompt?: string }) => void;
}

interface GoogleIdentity {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (response: {
          access_token?: string;
          expires_in?: number;
          error?: string;
        }) => void;
      }) => TokenClient;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

function clientId(): string {
  return (
    (import.meta.env.VITE_GOOGLE_FIT_CLIENT_ID as string | undefined) ?? ''
  );
}

export function isStepsSyncConfigured(): boolean {
  return Boolean(clientId());
}

export function isStepsSyncConnected(): boolean {
  return loadJSON<StoredToken | null>(STORAGE_KEYS.googleToken, null) !== null;
}

export function disconnectStepsSync(): void {
  removeKey(STORAGE_KEYS.googleToken);
}

let gisPromise: Promise<void> | null = null;

function loadGis(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gisPromise) return gisPromise;
  gisPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GIS_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      gisPromise = null;
      reject(new StepsSyncError('network', 'Impossible de charger Google.'));
    };
    document.head.appendChild(script);
  });
  return gisPromise;
}

async function requestToken(interactive: boolean): Promise<string> {
  const id = clientId();
  if (!id) throw new StepsSyncError('not_configured');

  const stored = loadJSON<StoredToken | null>(STORAGE_KEYS.googleToken, null);
  if (stored && stored.exp > Date.now()) return stored.token;

  await loadGis();
  const oauth2 = window.google?.accounts?.oauth2;
  if (!oauth2) throw new StepsSyncError('network');

  return new Promise<string>((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: id,
      scope: SCOPE,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new StepsSyncError('auth', response.error));
          return;
        }
        const token: StoredToken = {
          token: response.access_token,
          exp: Date.now() + ((response.expires_in ?? 3600) - 60) * 1000,
        };
        saveJSON(STORAGE_KEYS.googleToken, token);
        resolve(response.access_token);
      },
    });
    client.requestAccessToken(interactive ? undefined : { prompt: '' });
  });
}

/** Demande l'autorisation Google Fit (popup de consentement). */
export async function connectStepsSync(): Promise<void> {
  await requestToken(true);
}

function localISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface AggregateBucket {
  startTimeMillis: string;
  dataset?: {
    point?: { value?: { intVal?: number }[] }[];
  }[];
}

/**
 * Récupère les pas des `days` derniers jours (aujourd'hui inclus) depuis
 * Google Fit. Renvoie une map date ISO locale → nombre de pas.
 */
export async function fetchSteps(days = 7): Promise<Record<string, number>> {
  const token = await requestToken(false);

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  let res: Response;
  try {
    res = await fetch(AGGREGATE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        aggregateBy: [
          {
            dataTypeName: 'com.google.step_count.delta',
            dataSourceId: STEPS_SOURCE,
          },
        ],
        bucketByTime: { durationMillis: 86_400_000 },
        startTimeMillis: start.getTime(),
        endTimeMillis: end.getTime(),
      }),
    });
  } catch {
    throw new StepsSyncError('network');
  }

  if (res.status === 401 || res.status === 403) {
    removeKey(STORAGE_KEYS.googleToken);
    throw new StepsSyncError('auth');
  }
  if (!res.ok) throw new StepsSyncError('api', `HTTP ${res.status}`);

  const data = (await res.json()) as { bucket?: AggregateBucket[] };
  const result: Record<string, number> = {};
  for (const bucket of data.bucket ?? []) {
    const date = localISO(new Date(parseInt(bucket.startTimeMillis, 10)));
    let steps = 0;
    for (const dataset of bucket.dataset ?? []) {
      for (const point of dataset.point ?? []) {
        for (const value of point.value ?? []) {
          steps += value.intVal ?? 0;
        }
      }
    }
    if (steps > 0) result[date] = steps;
  }
  return result;
}

export function describeStepsSyncError(e: unknown): string {
  const reason = e instanceof StepsSyncError ? e.reason : 'api';
  switch (reason) {
    case 'not_configured':
      return 'Synchronisation non configurée (VITE_GOOGLE_FIT_CLIENT_ID absent).';
    case 'auth':
      return 'Autorisation Google Fit requise : reconnecte ton compte.';
    case 'network':
      return 'Impossible de contacter Google Fit. Vérifie ta connexion.';
    default:
      return 'Google Fit a renvoyé une erreur inattendue. Réessaie plus tard.';
  }
}
