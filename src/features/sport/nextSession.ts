import { repRangeFor, targetSetsFor } from '@/data/exercises';
import type { StrengthSession, TrainingProfile } from '@/types';
import { epley1RM, exerciseHistory, type ExercisePoint } from './progression';

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
  const [lo, hi] = repRangeFor(profile, exerciseId);
  const points = exerciseHistory(sessions, exerciseId, bodyweight);
  if (points.length === 0) return null;

  const last = points[points.length - 1];
  const prev = points.length > 1 ? points[points.length - 2] : null;
  const rpe = last.avgRpe;
  const sets =
    targetSetsFor(profile, exerciseId) ?? last.setCount ?? DEFAULT_SETS;
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

function loadLabel(w: number, bodyweight: boolean): string {
  const load = String(w).replace('.', ',');
  if (bodyweight) return w > 0 ? `+${load} kg` : 'PDC';
  return `${load} kg`;
}

/**
 * État du cycle de double progression pour un exercice : à charge donnée,
 * on remplit la fourchette de reps du style ; une fois en haut, la charge
 * monte et on repart en bas. `reps` situe le meilleur set actuel dans la
 * fourchette [lo, hi], `next` décrit l'étape suivante.
 */
export interface OverloadTrack {
  lo: number;
  hi: number;
  /** Reps du meilleur set à la charge actuelle (peut déborder de [lo, hi]). */
  reps: number;
  /** Libellé de la charge actuelle ("80 kg", "PDC", "+10 kg"). */
  current: string;
  /** Libellé de l'étape suivante ("82,5 kg", "+1-2 reps", "consolide"). */
  next: string;
  kind: SuggestionKind;
}

export function overloadTrack(
  last: ExercisePoint,
  s: NextSuggestion,
  repRange: [number, number],
  bodyweight: boolean,
): OverloadTrack {
  const [lo, hi] = repRange;
  let next: string;
  switch (s.kind) {
    case 'up':
      next =
        bodyweight && last.topW <= 0
          ? `lest ${loadLabel(s.w, true)}`
          : loadLabel(s.w, bodyweight);
      break;
    case 'deload':
      next = `${loadLabel(s.w, bodyweight)} deload`;
      break;
    case 'keep':
      next = 'consolide';
      break;
    default: {
      const gain = s.repsMax - last.topReps;
      next = gain > 1 ? `+1-${gain} reps` : '+1 rep';
    }
  }
  return {
    lo,
    hi,
    reps: last.topReps,
    current: loadLabel(last.topW, bodyweight),
    next,
    kind: s.kind,
  };
}

/**
 * Score cible pour tracer la ligne d'objectif sur le graphique de
 * progression : e1RM de la suggestion (échelle e1RM), ou reps cibles pour
 * du poids du corps strict (échelle reps). Null si les échelles diffèrent
 * (passage PDC → lest).
 */
export function targetScore(
  s: NextSuggestion,
  bodyweight: boolean,
  lastPureBodyweight: boolean,
): number | null {
  if (bodyweight && lastPureBodyweight) {
    if (s.w > 0) return null;
    return s.repsMin;
  }
  if (s.w <= 0) return null;
  return Math.round(epley1RM(s.w, s.repsMin) * 10) / 10;
}
