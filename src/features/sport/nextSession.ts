import { styleMeta } from '@/data/exercises';
import type { StrengthSession, TrainingProfile } from '@/types';
import { exerciseHistory } from './progression';

export type SuggestionKind = 'up' | 'reps' | 'keep' | 'deload';

export interface NextSuggestion {
  kind: SuggestionKind;
  /** Charge cible en kg (lest ajouté pour un exercice PDC, 0 = poids du corps). */
  w: number;
  repsMin: number;
  repsMax: number;
  sets: number;
  /** Explication courte type coach. */
  why: string;
}

const LOAD_STEP = 2.5;
const DELOAD_FACTOR = 0.9;
const DEFAULT_SETS = 3;

function roundLoad(w: number): number {
  return Math.max(0, Math.round(w / LOAD_STEP) * LOAD_STEP);
}

/**
 * Prescription de la prochaine séance pour un exercice (double progression) :
 * on monte les reps dans la fourchette du style, puis la charge quand le haut
 * de fourchette est atteint. Le RPE de la dernière séance module la décision.
 */
export function suggestNext(
  profile: TrainingProfile,
  sessions: StrengthSession[],
  exerciseId: string,
  bodyweight: boolean,
): NextSuggestion | null {
  const [lo, hi] = styleMeta(profile.style).repRange;
  const points = exerciseHistory(sessions, exerciseId, bodyweight);
  if (points.length === 0) return null;

  const last = points[points.length - 1];
  const prev = points.length > 1 ? points[points.length - 2] : null;
  const rpe = last.avgRpe;
  const sets = last.setCount || DEFAULT_SETS;
  const progressed = prev !== null && last.best > prev.best;

  // Poids du corps strict : progression en répétitions, puis passage au lest.
  if (bodyweight && last.topW <= 0) {
    if (last.topReps >= hi && (rpe === null || rpe <= 8.5)) {
      return {
        kind: 'up',
        w: LOAD_STEP,
        repsMin: lo,
        repsMax: Math.min(hi, lo + 2),
        sets,
        why: `Haut de fourchette atteint (${last.topReps} reps) : passe au lest.`,
      };
    }
    if (rpe !== null && rpe >= 9.5) {
      return {
        kind: 'keep',
        w: 0,
        repsMin: last.topReps,
        repsMax: last.topReps,
        sets,
        why: `RPE ${rpe} : consolide ${last.topReps} reps avant d'en ajouter.`,
      };
    }
    return {
      kind: 'reps',
      w: 0,
      repsMin: last.topReps + 1,
      repsMax: last.topReps + 2,
      sets,
      why: 'Vise 1-2 répétitions de plus par série.',
    };
  }

  // Exercices chargés (barre, haltères, machines, PDC lesté).
  if (rpe !== null && rpe >= 9.5) {
    if (!progressed && prev !== null) {
      return {
        kind: 'deload',
        w: roundLoad(last.topW * DELOAD_FACTOR),
        repsMin: lo,
        repsMax: hi,
        sets,
        why: `RPE ${rpe} sans progression : allège d'~10 % une séance pour récupérer.`,
      };
    }
    return {
      kind: 'keep',
      w: last.topW,
      repsMin: last.topReps,
      repsMax: Math.min(hi, last.topReps + 1),
      sets,
      why: `RPE ${rpe} : garde la charge et consolide avant de monter.`,
    };
  }

  if (last.topReps >= hi) {
    return {
      kind: 'up',
      w: roundLoad(last.topW + LOAD_STEP),
      repsMin: lo,
      repsMax: Math.min(hi, lo + 2),
      sets,
      why: `Haut de fourchette atteint (${last.topReps} reps) : monte la charge et repars à ${lo} reps.`,
    };
  }

  if (rpe !== null && rpe <= 7.5) {
    return {
      kind: 'up',
      w: roundLoad(last.topW + LOAD_STEP),
      repsMin: last.topReps,
      repsMax: Math.min(hi, last.topReps + 1),
      sets,
      why: `RPE ${rpe} : de la marge, ajoute ${String(LOAD_STEP).replace('.', ',')} kg.`,
    };
  }

  return {
    kind: 'reps',
    w: last.topW,
    repsMin: Math.min(hi, last.topReps + 1),
    repsMax: Math.min(hi, last.topReps + 2),
    sets,
    why: 'Même charge, vise 1-2 reps de plus.',
  };
}

/** "82,5 kg × 6-8" / "+5 kg × 5" / "12-13 reps" selon le mode. */
export function formatSuggestion(
  s: NextSuggestion,
  bodyweight: boolean,
): string {
  const reps =
    s.repsMin === s.repsMax ? `${s.repsMin}` : `${s.repsMin}-${s.repsMax}`;
  const load = String(s.w).replace('.', ',');
  if (bodyweight) {
    if (s.w <= 0) return `${reps} reps`;
    return `+${load} kg × ${reps}`;
  }
  return `${load} kg × ${reps}`;
}
