import { repRangeFor, tierMeta } from '@/data/exercises';
import type { TrainingProfile, StrengthSession } from '@/types';
import { buildMuscleVolume } from './muscleVolume';
import {
  STAGNATION_WINDOW,
  summarizeExercise,
  trackedExerciseIds,
  weekSessionCount,
  type ExerciseResolver,
  type ProgressionSummary,
} from './progression';
import { assessTraining, type TrainingStatus } from './trainingStatus';
import {
  buildLoadWindows,
  currentWindow,
  previousWindow,
  type LoadWindow,
} from './weeklyLoad';

export type { ExerciseResolver } from './progression';

export type CoachTipKind =
  | 'up'
  | 'down'
  | 'keep'
  | 'deload'
  | 'info'
  | 'warn'
  | 'pr'
  | 'priority';

/** Axe du suivi auquel le conseil se rattache (pastille dans l'interface). */
export type CoachAxis =
  | 'adherence'
  | 'volume'
  | 'intensity'
  | 'performance'
  | 'recovery';

/** 0 = à traiter en premier, 1 = important, 2 = information / encouragement. */
export type CoachPriority = 0 | 1 | 2;

export interface CoachTip {
  kind: CoachTipKind;
  axis: CoachAxis;
  priority: CoachPriority;
  msg: string;
  exerciseName?: string;
}

export interface CoachOptions {
  /** Permet les conseils de volume par groupe musculaire. */
  resolveMuscle?: (exerciseId: string) => string | null;
  /** Fenêtres de charge déjà calculées (évite un recalcul). */
  windows?: readonly LoadWindow[];
}

/** Hausse de volume hebdo (séries) au-delà de laquelle on alerte. */
const SPIKE_RATIO = 1.3;
/** Baisse de volume hebdo en dessous de laquelle on s'interroge. */
const DROP_RATIO = 0.6;
/** Dérive de RPE moyen d'une semaine sur l'autre qui signe la fatigue. */
const RPE_CREEP = 0.7;
/** Part de séries dures au-delà de laquelle il n'y a plus de marge. */
const HARD_SETS_SHARE = 0.8;
/** Nombre max de groupes musculaires en déficit signalés à la fois. */
const MAX_VOLUME_TIPS = 2;
/** Au-delà de ~10 séries par muscle et par séance, la qualité chute. */
const SETS_PER_SESSION_SOFT_CAP = 10;

const AXIS_ORDER: Record<CoachAxis, number> = {
  adherence: 0,
  recovery: 1,
  intensity: 2,
  volume: 3,
  performance: 4,
};

function fmtPct(n: number): string {
  return String(Math.abs(n)).replace('.', ',');
}

function exerciseTip(
  summary: ProgressionSummary,
  name: string,
  bodyweight: boolean,
  repRange: [number, number],
): CoachTip | null {
  const { last, prev, deltaPct, isPR, stagnant } = summary;
  if (!last) return null;

  if (isPR) {
    return {
      kind: 'pr',
      axis: 'performance',
      priority: 2,
      exerciseName: name,
      msg: `Record battu (${formatBest(last.best, bodyweight, last.topW)}). La surcharge progressive fonctionne, continue sur ce schéma.`,
    };
  }

  const rpe = last.avgRpe;

  if (rpe !== null && rpe >= 9.5 && deltaPct !== null && deltaPct <= 0) {
    return {
      kind: 'deload',
      axis: 'intensity',
      priority: 0,
      exerciseName: name,
      msg: `RPE très élevé (${fmtPct(rpe)}) sans progression : réduis la charge de ~10 % une semaine (deload) avant de repartir de l'avant.`,
    };
  }

  if (stagnant) {
    const stimulus = bodyweight
      ? 'ajoute du lest, une variante plus dure ou des tempos lents'
      : 'change de fourchette de reps ou ajoute une série';
    return {
      kind: 'info',
      axis: 'performance',
      priority: 1,
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
      axis: 'intensity',
      priority: 1,
      exerciseName: name,
      msg: `Marge disponible (RPE ${fmtPct(rpe)}) : ${inc} à la prochaine séance.`,
    };
  }

  // Aligné sur la prescription (suggestNext) : haut de fourchette atteint,
  // sauf si la série était déjà à l'échec.
  if (
    last.topReps >= repRange[1] &&
    (!bodyweight || last.topW > 0) &&
    (rpe === null || rpe < 9.5)
  ) {
    return {
      kind: 'up',
      axis: 'intensity',
      priority: 1,
      exerciseName: name,
      msg: `${last.topReps} reps atteint le haut de ta fourchette (${repRange[0]}-${repRange[1]}) : augmente la charge et redescends en reps.`,
    };
  }

  if (deltaPct !== null && deltaPct > 0) {
    return {
      kind: 'keep',
      axis: 'performance',
      priority: 2,
      exerciseName: name,
      msg: `+${fmtPct(deltaPct)} % vs séance précédente. Garde ce rythme, la progression est saine.`,
    };
  }

  if (prev && deltaPct !== null && deltaPct < -5) {
    return {
      kind: 'down',
      axis: 'performance',
      priority: 1,
      exerciseName: name,
      msg: `Baisse de ${fmtPct(deltaPct)} % : vérifie sommeil et récupération, et vise simplement les charges de la séance d'avant.`,
    };
  }

  return null;
}

function formatBest(best: number, bodyweight: boolean, topW: number): string {
  if (bodyweight && topW <= 0) return `${Math.round(best)} reps`;
  return `${fmtPct(Math.round(best * 10) / 10)} kg e1RM`;
}

/**
 * Vérifie, pour chaque séance type, si les exercices marqués prioritaires ont
 * bien reçu leur nombre de séries cible lors de la dernière occurrence de
 * cette séance. Contrairement aux tips de progression (basés sur l'historique
 * de charge), celui-ci fait respecter concrètement la planification : un
 * exercice prioritaire qui n'obtient pas ses séries doit être signalé, pas
 * juste toléré.
 */
function priorityAdherenceTips(
  profile: TrainingProfile,
  sessions: StrengthSession[],
  resolve: ExerciseResolver,
): CoachTip[] {
  const tips: CoachTip[] = [];
  for (const template of profile.sessionTemplates) {
    const priorityExos = template.exercises.filter((e) => e.priority);
    if (priorityExos.length === 0) continue;
    const last = [...sessions]
      .reverse()
      .find((s) => s.templateId === template.id);
    if (!last) continue;

    for (const pe of priorityExos) {
      const def = resolve(pe.exerciseId);
      if (!def) continue;
      const done = last.exercises.find((e) => e.exerciseId === pe.exerciseId);
      const actualSets = done?.sets.length ?? 0;
      if (actualSets >= pe.sets) continue;
      const missing = pe.sets - actualSets;
      tips.push({
        kind: 'priority',
        axis: 'adherence',
        priority: 0,
        exerciseName: def.name,
        msg:
          actualSets === 0
            ? `Exercice prioritaire de ${template.name} pas fait à la dernière séance : loggue-le en tout premier la prochaine fois pour tenir tes ${pe.sets} séries prévues.`
            : `${actualSets}/${pe.sets} séries seulement à la dernière séance de ${template.name} (prioritaire) : loggue-le en tout premier pour ne plus sacrifier ${missing > 1 ? `les ${missing} séries manquantes` : 'la série manquante'}.`,
      });
    }
  }
  return tips;
}

/**
 * Conseils tirés de la charge hebdomadaire : pic ou creux de volume par
 * rapport aux semaines précédentes, dérive du RPE moyen, part de séries
 * dures. Ce sont les signaux qu'un exercice pris isolément ne montre pas.
 */
function loadTips(
  windows: readonly LoadWindow[],
  sessionsPerWeek: number,
  anyProgress: boolean,
): CoachTip[] {
  const tips: CoachTip[] = [];
  const cur = currentWindow(windows);
  const prev = previousWindow(windows);
  if (!cur) return tips;

  const previousActive = windows.filter(
    (w) => w.index >= 1 && w.index <= 3 && w.sessions > 0,
  );
  if (previousActive.length >= 2 && cur.sets >= 8) {
    const baseline =
      previousActive.reduce((s, w) => s + w.sets, 0) / previousActive.length;
    const ratio = cur.sets / baseline;
    if (ratio >= SPIKE_RATIO) {
      tips.push({
        kind: 'warn',
        axis: 'volume',
        priority: 1,
        msg: `Volume +${Math.round((ratio - 1) * 100)} % vs tes ${previousActive.length} semaines précédentes (${cur.sets} séries sur 7 jours). Monte par paliers de 10 % max : c'est le pic de charge qui blesse, pas la charge.`,
      });
    } else if (ratio <= DROP_RATIO && cur.sessions < sessionsPerWeek) {
      tips.push({
        kind: 'info',
        axis: 'volume',
        priority: 2,
        msg: `Volume à ${cur.sets} séries sur 7 jours, −${Math.round((1 - ratio) * 100)} % vs ta moyenne. Semaine légère volontaire ? Sinon, cale une séance dans les prochains jours.`,
      });
    }
  }

  if (
    cur.avgRpe !== null &&
    prev?.avgRpe != null &&
    cur.avgRpe - prev.avgRpe >= RPE_CREEP &&
    !anyProgress
  ) {
    tips.push({
      kind: 'deload',
      axis: 'intensity',
      priority: 0,
      msg: `RPE moyen ${String(prev.avgRpe).replace('.', ',')} → ${String(cur.avgRpe).replace('.', ',')} sur 7 jours sans progression : la fatigue s'accumule. Garde les charges mais retire une série par exercice cette semaine.`,
    });
  } else if (
    cur.ratedSets >= 6 &&
    cur.hardSets / cur.ratedSets >= HARD_SETS_SHARE &&
    cur.avgRpe !== null &&
    cur.avgRpe >= 9
  ) {
    tips.push({
      kind: 'warn',
      axis: 'intensity',
      priority: 1,
      msg: `${Math.round((cur.hardSets / cur.ratedSets) * 100)} % de tes séries à RPE ≥ 8 (moyenne ${String(cur.avgRpe).replace('.', ',')}). Tout à fond tout le temps ne laisse aucune marge pour progresser : vise RPE 7-8 sur les premières séries.`,
    });
  }

  return tips;
}

/**
 * Relie le compteur de volume par muscle au coach : un groupe sous sa cible
 * hebdo devient une action concrète, pas juste une barre orange.
 */
function muscleVolumeTips(
  profile: TrainingProfile,
  sessions: StrengthSession[],
  resolveMuscle: (exerciseId: string) => string | null,
  todayIso: string,
): CoachTip[] {
  const report = buildMuscleVolume(profile, sessions, resolveMuscle, todayIso);
  // Sans séance sur la fenêtre, tout serait « sous la cible » : l'adhérence
  // hebdo le dit déjà mieux.
  if (report.totalSets === 0) return [];

  const tips: CoachTip[] = [];
  const under = report.rows
    .filter((r) => r.status === 'under' && r.range && r.tier)
    .sort((a, b) => {
      const rank = { priority: 0, moderate: 1, maintenance: 2 } as const;
      const ra = rank[a.tier!];
      const rb = rank[b.tier!];
      if (ra !== rb) return ra - rb;
      return b.range![0] - b.sets - (a.range![0] - a.sets);
    })
    .slice(0, MAX_VOLUME_TIPS);

  for (const row of under) {
    const [min, max] = row.range!;
    const gap = min - row.sets;
    tips.push({
      kind: 'info',
      axis: 'volume',
      priority: row.tier === 'priority' ? 0 : 1,
      exerciseName: row.muscle,
      msg: `${row.sets}/${min}-${max} séries sur 7 jours pour un objectif « ${tierMeta(row.tier!).label.toLowerCase()} » : il en manque ${gap}. Ajoute un exercice ${row.muscle} ou une série de plus par exercice.`,
    });
  }

  for (const row of report.rows) {
    if (
      row.tier === 'priority' &&
      row.sessions === 1 &&
      row.sets > SETS_PER_SESSION_SOFT_CAP
    ) {
      tips.push({
        kind: 'info',
        axis: 'volume',
        priority: 2,
        exerciseName: row.muscle,
        msg: `${row.sets} séries en une seule séance : répartis-les sur 2 séances. Au-delà de ~${SETS_PER_SESSION_SOFT_CAP} séries par muscle et par séance, les dernières ne valent plus grand-chose.`,
      });
    }
    if (row.status === 'over' && row.range && row.sets > row.range[1] + 4) {
      tips.push({
        kind: 'info',
        axis: 'volume',
        priority: 2,
        exerciseName: row.muscle,
        msg: `${row.sets} séries, bien au-dessus de ta fourchette (${row.range[0]}-${row.range[1]}). Ce volume coûte de la récupération à tes groupes prioritaires.`,
      });
    }
  }

  return tips;
}

/** À partir de ce nombre d'exercices à deload, on parle d'une semaine légère globale. */
const GLOBAL_DELOAD_THRESHOLD = 3;

/**
 * Trois exercices ou plus à RPE maximal sans progression, ce n'est plus un
 * problème d'exercice mais de fatigue générale : un seul conseil de deload
 * global remplace la liste, sinon le coach crie « urgent » douze fois.
 */
function collapseDeloadTips(tips: CoachTip[]): CoachTip[] {
  const deloads = tips.filter((t) => t.kind === 'deload' && t.exerciseName);
  if (deloads.length < GLOBAL_DELOAD_THRESHOLD) return tips;
  const others = tips.filter((t) => !(t.kind === 'deload' && t.exerciseName));
  const names = deloads.map((t) => t.exerciseName!);
  const shown = names.slice(0, 3).join(', ');
  const extra = names.length > 3 ? ` et ${names.length - 3} autres` : '';
  return [
    {
      kind: 'deload',
      axis: 'recovery',
      priority: 0,
      msg: `${names.length} exercices à RPE ≥ 9,5 sans progression (${shown}${extra}) : ce n'est plus un exercice qui coince, c'est la fatigue. Semaine de deload globale, −10 % de charge partout, puis reprends la progression.`,
    },
    ...others,
  ];
}

/** À partir de ce nombre de records simultanés, une seule carte les célèbre. */
const PR_COLLAPSE_THRESHOLD = 3;

/** Trois records ou plus le même jour : une carte, pas une rangée de trophées. */
function collapsePrTips(tips: CoachTip[]): CoachTip[] {
  const prs = tips.filter((t) => t.kind === 'pr' && t.exerciseName);
  if (prs.length < PR_COLLAPSE_THRESHOLD) return tips;
  const others = tips.filter((t) => !(t.kind === 'pr' && t.exerciseName));
  const names = prs.map((t) => t.exerciseName!);
  const shown = names.slice(0, 4).join(', ');
  const extra = names.length > 4 ? ` et ${names.length - 4} autres` : '';
  return [
    {
      kind: 'pr',
      axis: 'performance',
      priority: 2,
      msg: `${names.length} records battus : ${shown}${extra}. La surcharge progressive fonctionne, ne change rien au schéma.`,
    },
    ...others,
  ];
}

/**
 * Regroupe les exercices « en progression » en un seul conseil : dix cartes
 * « garde ce rythme » noient les deux qui demandent une action.
 */
function collapseKeepTips(tips: CoachTip[]): CoachTip[] {
  const keeps = tips.filter((t) => t.kind === 'keep' && t.exerciseName);
  if (keeps.length <= 1) return tips;
  const others = tips.filter((t) => !(t.kind === 'keep' && t.exerciseName));
  const names = keeps.map((t) => {
    const pct = t.msg.match(/^\+([\d,]+) %/)?.[1];
    return pct ? `${t.exerciseName} +${pct} %` : t.exerciseName!;
  });
  const shown = names.slice(0, 4).join(', ');
  const extra = names.length > 4 ? ` et ${names.length - 4} autres` : '';
  return [
    ...others,
    {
      kind: 'keep',
      axis: 'performance',
      priority: 2,
      msg: `En progression : ${shown}${extra}. Garde ce rythme.`,
    },
  ];
}

function sortTips(tips: CoachTip[]): CoachTip[] {
  return tips
    .map((tip, index) => ({ tip, index }))
    .sort((a, b) => {
      if (a.tip.priority !== b.tip.priority)
        return a.tip.priority - b.tip.priority;
      const axis = AXIS_ORDER[a.tip.axis] - AXIS_ORDER[b.tip.axis];
      return axis !== 0 ? axis : a.index - b.index;
    })
    .map(({ tip }) => tip);
}

/**
 * Conseils "coach" locaux, calculés à partir de l'historique : adhérence
 * hebdo, charge (volume / intensité) sur 7 jours, volume par muscle,
 * progression par exercice suivi. Triés du plus urgent au plus informatif.
 */
export function coachTips(
  profile: TrainingProfile,
  sessions: StrengthSession[],
  resolve: ExerciseResolver,
  todayIso: string,
  options: CoachOptions = {},
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
      axis: 'adherence',
      priority: count === 0 ? 1 : 2,
      msg:
        count === 0
          ? `Aucune séance sur les 7 derniers jours : la régularité passe avant tout le reste, replanifie ta prochaine séance.`
          : `${count}/${profile.sessionsPerWeek} séance${count > 1 ? 's' : ''} sur 7 jours : encore ${missing} pour tenir ton objectif hebdo.`,
    });
  } else if (count >= profile.sessionsPerWeek && count > 0) {
    tips.push({
      kind: 'keep',
      axis: 'adherence',
      priority: 2,
      msg: `Objectif hebdo atteint (${count}/${profile.sessionsPerWeek} séances). La régularité est la base de la progression.`,
    });
  }

  tips.push(...priorityAdherenceTips(profile, sessions, resolve));

  const feels = sessions
    .slice(-3)
    .map((s) => s.feel)
    .filter((f): f is number => typeof f === 'number');
  if (feels.length >= 2 && feels.every((f) => f <= 2)) {
    tips.push({
      kind: 'deload',
      axis: 'recovery',
      priority: 0,
      msg: 'Ressenti au plus bas sur les dernières séances : accorde-toi une semaine légère, la fatigue masque la progression.',
    });
  }

  let progressing = 0;
  let rated = 0;
  const exerciseTips: CoachTip[] = [];
  for (const exerciseId of trackedExerciseIds(profile, sessions)) {
    const def = resolve(exerciseId);
    if (!def) continue;
    const summary = summarizeExercise(sessions, exerciseId, def.bodyweight);
    if (summary.points.length < 2) continue;
    rated += 1;
    if (summary.trend === 'up' || summary.isPR) progressing += 1;
    const repRange = repRangeFor(profile, exerciseId);
    const tip = exerciseTip(summary, def.name, def.bodyweight, repRange);
    if (tip) exerciseTips.push(tip);
  }

  if (sessions.length > 0) {
    const windows =
      options.windows ?? buildLoadWindows(sessions, resolve, todayIso);
    // Même seuil que le verdict : au plus un quart des exercices en hausse,
    // c'est « sans progression ».
    const fewProgressing = rated > 0 && progressing <= Math.floor(rated / 4);
    tips.push(...loadTips(windows, profile.sessionsPerWeek, !fewProgressing));
  }

  if (options.resolveMuscle && sessions.length > 0) {
    tips.push(
      ...muscleVolumeTips(profile, sessions, options.resolveMuscle, todayIso),
    );
  }

  tips.push(...exerciseTips);

  return sortTips(collapseKeepTips(collapsePrTips(collapseDeloadTips(tips))));
}

export interface CoachReport {
  status: TrainingStatus;
  tips: CoachTip[];
  windows: LoadWindow[];
}

/**
 * Point d'entrée unique pour l'interface : verdict hebdo + conseils classés,
 * en ne calculant les fenêtres de charge qu'une seule fois.
 */
export function buildCoachReport(
  profile: TrainingProfile,
  sessions: StrengthSession[],
  resolve: ExerciseResolver,
  resolveMuscle: (exerciseId: string) => string | null,
  todayIso: string,
): CoachReport {
  const windows = buildLoadWindows(sessions, resolve, todayIso);
  const exercises = trackedExerciseIds(profile, sessions).flatMap((id) => {
    const def = resolve(id);
    if (!def) return [];
    const summary = summarizeExercise(sessions, id, def.bodyweight);
    if (summary.points.length === 0) return [];
    return [
      {
        name: def.name,
        trend: summary.trend,
        stagnant: summary.stagnant,
        isPR: summary.isPR,
      },
    ];
  });
  const recentFeels = sessions
    .slice(-3)
    .map((s) => s.feel)
    .filter((f): f is number => typeof f === 'number');

  const status = assessTraining({
    windows,
    exercises,
    sessionsPerWeek: profile.sessionsPerWeek,
    recentFeels,
  });
  const tips = coachTips(profile, sessions, resolve, todayIso, {
    resolveMuscle,
    windows,
  });
  return { status, tips, windows };
}
