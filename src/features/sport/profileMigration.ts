import { defaultPlannedExercise, TRAINING_STYLES } from '@/data/exercises';
import type {
  CustomExercise,
  PlannedExercise,
  SessionTemplate,
  TrainingProfile,
  TrainingStyle,
} from '@/types';

/**
 * Le format du profil sportif a évolué : les anciennes versions stockaient
 * `split` + `trackedExercises` (liste plate), le format actuel stocke des
 * `sessionTemplates` (séances nommées avec séries/reps cibles). Un profil
 * ancien chargé tel quel (localStorage ou Firestore) faisait planter la page
 * Sport. Cette normalisation accepte n'importe quelle forme stockée et
 * renvoie toujours un profil valide — ou null si la donnée est inexploitable.
 */

interface StoredProfile {
  style?: unknown;
  sessionsPerWeek?: unknown;
  sessionTemplates?: unknown;
  customExercises?: unknown;
  /** Ancien format (≤ PR #31). */
  trackedExercises?: unknown;
}

const MIGRATED_TEMPLATE_NAME = 'Séance A';

function isStyle(v: unknown): v is TrainingStyle {
  return typeof v === 'string' && TRAINING_STYLES.some((s) => s.key === v);
}

function toCount(v: unknown, fallback: number, min: number, max: number) {
  const n = typeof v === 'number' ? Math.round(v) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function sanitizeCustoms(v: unknown): CustomExercise[] {
  if (!Array.isArray(v)) return [];
  return v.filter(
    (c): c is CustomExercise =>
      Boolean(c) &&
      typeof c === 'object' &&
      typeof (c as CustomExercise).id === 'string' &&
      typeof (c as CustomExercise).name === 'string',
  );
}

function sanitizePlanned(v: unknown, style: TrainingStyle): PlannedExercise[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((e): PlannedExercise[] => {
    if (!e || typeof e !== 'object') return [];
    const rec = e as Record<string, unknown>;
    if (typeof rec.exerciseId !== 'string') return [];
    const base = defaultPlannedExercise(rec.exerciseId, style);
    return [
      {
        exerciseId: rec.exerciseId,
        sets: toCount(rec.sets, base.sets, 1, 20),
        repsMin: toCount(rec.repsMin, base.repsMin, 1, 100),
        repsMax: toCount(rec.repsMax, base.repsMax, 1, 100),
      },
    ];
  });
}

function sanitizeTemplates(
  v: unknown,
  style: TrainingStyle,
): SessionTemplate[] | null {
  if (!Array.isArray(v)) return null;
  return v.flatMap((t, i): SessionTemplate[] => {
    if (!t || typeof t !== 'object') return [];
    const rec = t as Record<string, unknown>;
    return [
      {
        id: typeof rec.id === 'string' ? rec.id : `tpl_migrated_${i}`,
        name:
          typeof rec.name === 'string' && rec.name.trim()
            ? rec.name
            : `Séance ${i + 1}`,
        exercises: sanitizePlanned(rec.exercises, style),
      },
    ];
  });
}

export function normalizeProfile(raw: unknown): TrainingProfile | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as StoredProfile;

  const style = isStyle(p.style) ? p.style : 'hypertrophy';
  const sessionsPerWeek = toCount(p.sessionsPerWeek, 3, 1, 7);
  const customExercises = sanitizeCustoms(p.customExercises);

  let sessionTemplates = sanitizeTemplates(p.sessionTemplates, style);
  if (sessionTemplates === null) {
    // Ancien format : on regroupe les exercices suivis dans une séance
    // unique que l'utilisateur pourra renommer / redécouper via ⚙.
    const tracked = Array.isArray(p.trackedExercises)
      ? p.trackedExercises.filter((x): x is string => typeof x === 'string')
      : [];
    sessionTemplates =
      tracked.length > 0
        ? [
            {
              id: 'tpl_migrated',
              name: MIGRATED_TEMPLATE_NAME,
              exercises: tracked.map((id) => defaultPlannedExercise(id, style)),
            },
          ]
        : [];
  }

  return { style, sessionsPerWeek, sessionTemplates, customExercises };
}
