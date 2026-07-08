import { repRangeFor } from '@/data/exercises';
import type { TrainingProfile, StrengthSession } from '@/types';
import {
  summarizeExercise,
  trackedExerciseIds,
  weekSessionCount,
  type ProgressionSummary,
} from './progression';

export type CoachTipKind = 'up' | 'down' | 'keep' | 'deload' | 'info' | 'pr';

export interface CoachTip {
  kind: CoachTipKind;
  msg: string;
  exerciseName?: string;
}

export interface ExerciseResolver {
  (exerciseId: string): { name: string; bodyweight: boolean } | null;
}

const STAGNATION_WINDOW = 3;

function isStagnant(summary: ProgressionSummary): boolean {
  const pts = summary.points;
  if (pts.length < STAGNATION_WINDOW) return false;
  const recent = pts.slice(-STAGNATION_WINDOW);
  const first = recent[0].best;
  if (first <= 0) return false;
  return recent.every((p) => Math.abs(p.best - first) / first < 0.015);
}

function exerciseTip(
  summary: ProgressionSummary,
  name: string,
  bodyweight: boolean,
  repRange: [number, number],
): CoachTip | null {
  const { last, prev, deltaPct, isPR } = summary;
  if (!last) return null;

  if (isPR) {
    return {
      kind: 'pr',
      exerciseName: name,
      msg: `Record battu (${formatBest(last.best, bodyweight, last.topW)}). La surcharge progressive fonctionne, continue sur ce schéma.`,
    };
  }

  const rpe = last.avgRpe;

  if (rpe !== null && rpe >= 9.5 && deltaPct !== null && deltaPct <= 0) {
    return {
      kind: 'deload',
      exerciseName: name,
      msg: `RPE très élevé (${rpe}) sans progression : réduis la charge de ~10 % une semaine (deload) avant de repartir de l'avant.`,
    };
  }

  if (isStagnant(summary)) {
    const stimulus = bodyweight
      ? 'ajoute du lest, une variante plus dure ou des tempos lents'
      : 'change de fourchette de reps ou ajoute une série';
    return {
      kind: 'info',
      exerciseName: name,
      msg: `${STAGNATION_WINDOW} séances sans progression : ${stimulus} pour relancer le stimulus.`,
    };
  }

  if (rpe !== null && rpe <= 7.5) {
    const inc = bodyweight
      ? last.topW > 0
        ? 'ajoute ~2,5 kg de lest'
        : 'ajoute 1-2 reps par série ou passe au lest'
      : 'monte de ~2,5 kg';
    return {
      kind: 'up',
      exerciseName: name,
      msg: `Marge disponible (RPE ${rpe}) : ${inc} à la prochaine séance.`,
    };
  }

  if (last.topReps > repRange[1] && (!bodyweight || last.topW > 0)) {
    return {
      kind: 'up',
      exerciseName: name,
      msg: `${last.topReps} reps dépasse ta fourchette cible (${repRange[0]}-${repRange[1]}) : augmente la charge et redescends en reps.`,
    };
  }

  if (deltaPct !== null && deltaPct > 0) {
    return {
      kind: 'keep',
      exerciseName: name,
      msg: `+${deltaPct} % vs séance précédente. Garde ce rythme, la progression est saine.`,
    };
  }

  if (prev && deltaPct !== null && deltaPct < -5) {
    return {
      kind: 'down',
      exerciseName: name,
      msg: `Baisse de ${Math.abs(deltaPct)} % : vérifie sommeil et récupération, et vise simplement les charges de la séance d'avant.`,
    };
  }

  return null;
}

function formatBest(best: number, bodyweight: boolean, topW: number): string {
  if (bodyweight && topW <= 0) return `${Math.round(best)} reps`;
  return `${Math.round(best * 10) / 10} kg e1RM`;
}

/**
 * Conseils "coach" locaux, calculés à partir de l'historique : adhérence
 * hebdo, progression par exercice suivi, RPE et fourchettes de reps du style.
 */
export function coachTips(
  profile: TrainingProfile,
  sessions: StrengthSession[],
  resolve: ExerciseResolver,
  todayIso: string,
): CoachTip[] {
  const tips: CoachTip[] = [];

  const count = weekSessionCount(
    sessions.map((s) => s.date),
    todayIso,
  );
  if (sessions.length > 0 && count < profile.sessionsPerWeek) {
    const missing = profile.sessionsPerWeek - count;
    tips.push({
      kind: 'info',
      msg: `${count}/${profile.sessionsPerWeek} séance${count > 1 ? 's' : ''} sur 7 jours : encore ${missing} pour tenir ton objectif hebdo.`,
    });
  } else if (count >= profile.sessionsPerWeek && count > 0) {
    tips.push({
      kind: 'keep',
      msg: `Objectif hebdo atteint (${count}/${profile.sessionsPerWeek} séances). La régularité est la base de la progression.`,
    });
  }

  const feels = sessions
    .slice(-3)
    .map((s) => s.feel)
    .filter((f): f is number => typeof f === 'number');
  if (feels.length >= 2 && feels.every((f) => f <= 2)) {
    tips.push({
      kind: 'deload',
      msg: 'Ressenti au plus bas sur les dernières séances : accorde-toi une semaine légère, la fatigue masque la progression.',
    });
  }

  for (const exerciseId of trackedExerciseIds(profile, sessions)) {
    const def = resolve(exerciseId);
    if (!def) continue;
    const summary = summarizeExercise(sessions, exerciseId, def.bodyweight);
    if (summary.points.length < 2) continue;
    const repRange = repRangeFor(profile, exerciseId);
    const tip = exerciseTip(summary, def.name, def.bodyweight, repRange);
    if (tip) tips.push(tip);
  }

  return tips;
}
