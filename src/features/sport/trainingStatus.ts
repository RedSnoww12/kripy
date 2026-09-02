import { STAGNATION_WINDOW, type TrendKind } from './progression';
import {
  baselineOf,
  currentWindow,
  pctDelta,
  previousWindow,
  type LoadWindow,
} from './weeklyLoad';

/**
 * Verdict hebdomadaire calculé localement à partir des trois axes du suivi :
 * volume (séries, tonnage), intensité (RPE moyen, séries dures) et
 * performance (tendance par exercice, records). C'est la synthèse « où j'en
 * suis cette semaine » affichée en tête du coach ; les conseils détaillés
 * viennent ensuite (voir coach.ts).
 */
export type TrainingStatusKind =
  | 'insufficient'
  | 'progressing'
  | 'steady'
  | 'stalled'
  | 'fatigue'
  | 'spike'
  | 'low_volume';

export type StatusTone = 'good' | 'neutral' | 'warn' | 'bad';
export type AxisKey = 'volume' | 'intensity' | 'performance';

export interface AxisRead {
  key: AxisKey;
  label: string;
  value: string;
  unit: string;
  /**
   * Variation vs la fenêtre précédente : en % pour le volume, en points de
   * RPE pour l'intensité, null quand il n'y a rien à comparer.
   */
  delta: number | null;
  deltaLabel: string | null;
  tone: StatusTone;
  hint: string;
}

export interface ExerciseTrendInput {
  name: string;
  trend: TrendKind | null;
  stagnant: boolean;
  isPR: boolean;
}

export interface TrainingStatus {
  kind: TrainingStatusKind;
  tone: StatusTone;
  title: string;
  msg: string;
  axes: [AxisRead, AxisRead, AxisRead];
}

export interface AssessInput {
  windows: readonly LoadWindow[];
  exercises: readonly ExerciseTrendInput[];
  sessionsPerWeek: number;
  /** Ressenti (1..5) des dernières séances, la plus récente en dernier. */
  recentFeels: readonly number[];
}

/** Volume ≥ 130 % de la moyenne des semaines précédentes = pic de charge. */
export const SPIKE_RATIO = 1.3;
/** Volume ≤ 60 % de la moyenne = semaine (trop) légère. */
export const DROP_RATIO = 0.6;
/** RPE moyen hebdo à partir duquel on parle d'intensité très élevée. */
export const HIGH_RPE = 9;
/** Hausse du RPE moyen d'une semaine à l'autre qui signe une dérive de fatigue. */
export const RPE_CREEP = 0.7;
/** Séances totales nécessaires avant de rendre un verdict. */
const MIN_SESSIONS = 3;

function fmtInt(n: number): string {
  return n.toLocaleString('fr-FR');
}

function fmtSigned(n: number, digits = 0): string {
  const v = digits > 0 ? n.toFixed(digits).replace('.', ',') : String(n);
  return n > 0 ? `+${v}` : v;
}

function plural(n: number, one: string, many = `${one}s`): string {
  return n > 1 ? many : one;
}

interface Counts {
  up: number;
  down: number;
  flat: number;
  rated: number;
  stagnant: number;
  prs: number;
}

function countTrends(
  exercises: readonly ExerciseTrendInput[],
  window: LoadWindow | null,
): Counts {
  let up = 0;
  let down = 0;
  let flat = 0;
  let stagnant = 0;
  for (const e of exercises) {
    // La tendance lissée regarde 6 séances : un exercice qui a progressé
    // puis s'est figé sur les 3 dernières n'est plus « en hausse » aujourd'hui.
    if (e.trend === 'up' && !e.stagnant) up += 1;
    else if (e.trend === 'down') down += 1;
    else if (e.trend !== null) flat += 1;
    if (e.stagnant) stagnant += 1;
  }
  return {
    up,
    down,
    flat,
    rated: up + down + flat,
    stagnant,
    prs: window?.prCount ?? 0,
  };
}

function volumeAxis(
  windows: readonly LoadWindow[],
  cur: LoadWindow | null,
  prev: LoadWindow | null,
  sessionsPerWeek: number,
): { axis: AxisRead; ratio: number | null } {
  const sets = cur?.sets ?? 0;
  const baseline = baselineOf(windows, 'sets');
  const ratio = baseline !== null && baseline > 0 ? sets / baseline : null;
  const delta = prev && prev.sets > 0 && cur ? pctDelta(sets, prev.sets) : null;

  let tone: StatusTone = 'neutral';
  if (!cur || cur.sessions === 0)
    tone = sessionsPerWeek > 0 ? 'bad' : 'neutral';
  else if (ratio !== null && ratio >= SPIKE_RATIO) tone = 'warn';
  else if (
    ratio !== null &&
    ratio <= DROP_RATIO &&
    cur.sessions < sessionsPerWeek
  )
    tone = 'warn';
  else if (ratio !== null) tone = 'good';

  let hint: string;
  if (!cur || cur.sessions === 0) hint = 'aucune séance sur 7 jours';
  else if (cur.tonnage > 0) hint = `${fmtInt(cur.tonnage)} kg soulevés`;
  else hint = `${fmtInt(cur.reps)} reps au poids du corps`;

  return {
    ratio,
    axis: {
      key: 'volume',
      label: 'Volume',
      value: String(sets),
      unit: plural(sets, 'série'),
      delta,
      deltaLabel: delta !== null ? `${fmtSigned(delta)} %` : null,
      tone,
      hint,
    },
  };
}

function intensityAxis(
  cur: LoadWindow | null,
  prev: LoadWindow | null,
): { axis: AxisRead; creep: number | null } {
  const rpe = cur?.avgRpe ?? null;
  const prevRpe = prev?.avgRpe ?? null;
  const creep =
    rpe !== null && prevRpe !== null
      ? Math.round((rpe - prevRpe) * 10) / 10
      : null;
  const hardPct =
    cur && cur.ratedSets > 0
      ? Math.round((cur.hardSets / cur.ratedSets) * 100)
      : null;

  let tone: StatusTone = 'neutral';
  if (rpe !== null) {
    if (rpe >= HIGH_RPE) tone = 'warn';
    else if (rpe > 7) tone = 'good';
  }

  let hint: string;
  if (rpe === null) hint = 'RPE non renseigné';
  else if (rpe <= 7) hint = 'de la marge : les charges peuvent monter';
  else hint = `${hardPct} % de séries dures (RPE ≥ 8)`;

  return {
    creep,
    axis: {
      key: 'intensity',
      label: 'Intensité',
      value: rpe !== null ? rpe.toFixed(1).replace('.', ',') : '—',
      unit: 'RPE moyen',
      delta: creep,
      deltaLabel: creep !== null && creep !== 0 ? fmtSigned(creep, 1) : null,
      tone,
      hint,
    },
  };
}

function performanceAxis(c: Counts): AxisRead {
  let tone: StatusTone = 'neutral';
  if (c.rated > 0) {
    if (c.up > c.down && c.up > 0) tone = 'good';
    else if (c.down > c.up) tone = 'bad';
    else if (c.stagnant >= 2) tone = 'warn';
  }

  let hint: string;
  if (c.rated === 0) hint = 'tendance dès la 2ᵉ séance par exercice';
  else if (c.prs > 0) hint = `${c.prs} ${plural(c.prs, 'record')} sur 7 jours`;
  else if (c.down > 0)
    hint = `${c.down} en baisse · ${c.stagnant} ${plural(c.stagnant, 'palier')}`;
  else if (c.stagnant > 0)
    hint = `${c.stagnant} ${plural(c.stagnant, 'exercice')} en palier`;
  else hint = 'tendance sur les 6 dernières séances';

  return {
    key: 'performance',
    label: 'Performance',
    value: c.rated > 0 ? `${c.up}/${c.rated}` : '—',
    unit: 'exos en hausse',
    delta: null,
    deltaLabel: c.prs > 0 ? `${c.prs} PR` : null,
    tone,
    hint,
  };
}

export function assessTraining(input: AssessInput): TrainingStatus {
  const { windows, exercises, sessionsPerWeek, recentFeels } = input;
  const cur = currentWindow(windows);
  const prev = previousWindow(windows);
  const counts = countTrends(exercises, cur);
  const volume = volumeAxis(windows, cur, prev, sessionsPerWeek);
  const intensity = intensityAxis(cur, prev);
  const performance = performanceAxis(counts);
  const axes: [AxisRead, AxisRead, AxisRead] = [
    volume.axis,
    intensity.axis,
    performance,
  ];

  const totalSessions = windows.reduce((s, w) => s + w.sessions, 0);
  const activeWindows = windows.filter((w) => w.sessions > 0).length;
  if (totalSessions < MIN_SESSIONS || activeWindows < 2) {
    const need = Math.max(0, MIN_SESSIONS - totalSessions);
    return {
      kind: 'insufficient',
      tone: 'neutral',
      title: 'Trop tôt pour un verdict',
      msg:
        need > 0
          ? `Encore ${need} ${plural(need, 'séance')} et une deuxième semaine de données pour lire volume, intensité et progression.`
          : 'Une deuxième semaine de séances et le bilan volume / intensité / progression prendra tout son sens.',
      axes,
    };
  }

  const rpe = cur?.avgRpe ?? null;
  const lowFeel = recentFeels.length >= 2 && recentFeels.every((f) => f <= 2);
  const creep = intensity.creep;
  // « Sans progression » = au plus un quart des exercices suivis en hausse :
  // deux exercices qui montent sur dix ne compensent pas huit à l'échec.
  const fewProgressing =
    counts.rated > 0 && counts.up <= Math.floor(counts.rated / 4);
  if (lowFeel) {
    return {
      kind: 'fatigue',
      tone: 'bad',
      title: 'Fatigue qui s’accumule',
      msg: 'Ressenti au plus bas sur tes dernières séances : sommeil, nutrition, puis une semaine légère avant de reforcer.',
      axes,
    };
  }
  if (creep !== null && creep >= RPE_CREEP && fewProgressing) {
    return {
      kind: 'fatigue',
      tone: 'bad',
      title: 'Fatigue qui s’accumule',
      msg: `RPE moyen ${prev?.avgRpe?.toFixed(1).replace('.', ',')} → ${rpe?.toFixed(1).replace('.', ',')} sur 7 jours ${
        counts.up === 0
          ? 'sans progression'
          : `pour ${counts.up} ${plural(counts.up, 'exercice')} en hausse sur ${counts.rated}`
      } : le corps encaisse plus qu’il ne rend. Allège une semaine (−10 % de charge ou −1 série par exercice).`,
      axes,
    };
  }
  if (rpe !== null && rpe >= HIGH_RPE && fewProgressing) {
    return {
      kind: 'fatigue',
      tone: 'bad',
      title: 'Tout à l’échec, rien qui monte',
      msg: `RPE moyen ${rpe.toFixed(1).replace('.', ',')} et ${
        counts.up === 0
          ? 'aucun exercice en hausse'
          : `seulement ${counts.up} ${plural(counts.up, 'exercice')} sur ${counts.rated} en hausse`
      }. Redescends à RPE 7-8 sur quelques séances : on progresse avec de la marge, pas à bout de forces.`,
      axes,
    };
  }

  if (
    cur &&
    volume.ratio !== null &&
    volume.ratio >= SPIKE_RATIO &&
    cur.sets >= 8
  ) {
    const pct = Math.round((volume.ratio - 1) * 100);
    return {
      kind: 'spike',
      tone: 'warn',
      title: 'Pic de volume',
      msg: `${cur.sets} séries sur 7 jours, +${pct} % vs tes semaines précédentes. Une hausse brutale de volume est le premier facteur de blessure : lisse à +10 % par semaine maximum.`,
      axes,
    };
  }

  if (
    cur &&
    volume.ratio !== null &&
    volume.ratio <= DROP_RATIO &&
    cur.sessions < sessionsPerWeek
  ) {
    const pct = Math.round((1 - volume.ratio) * 100);
    return {
      kind: 'low_volume',
      tone: 'warn',
      title: 'Semaine légère',
      msg: `${cur.sets} ${plural(cur.sets, 'série')} et ${cur.sessions}/${sessionsPerWeek} séances, −${pct} % vs ta moyenne. Si ce n’est pas un deload voulu, cale une séance dans les prochains jours.`,
      axes,
    };
  }

  if (counts.prs > 0 || (counts.up > counts.down && counts.up > 0)) {
    return {
      kind: 'progressing',
      tone: 'good',
      title: 'Ça progresse',
      msg:
        counts.prs > 0
          ? `${counts.prs} ${plural(counts.prs, 'record')} sur 7 jours et ${counts.up} ${plural(counts.up, 'exercice')} en hausse. Volume et intensité tiennent : garde exactement ce schéma.`
          : `${counts.up} ${plural(counts.up, 'exercice')} en hausse sur les dernières séances, ${counts.down} en baisse. La surcharge progressive fait son travail.`,
      axes,
    };
  }

  if (
    counts.rated >= 2 &&
    counts.up === 0 &&
    counts.stagnant >= Math.max(2, Math.ceil(counts.rated / 2))
  ) {
    return {
      kind: 'stalled',
      tone: 'warn',
      title: 'Palier',
      msg: `${counts.stagnant} ${plural(counts.stagnant, 'exercice')} au même niveau depuis ${STAGNATION_WINDOW} séances et rien en hausse. Change un paramètre : fourchette de reps, série supplémentaire ou variante.`,
      axes,
    };
  }

  return {
    kind: 'steady',
    tone: 'neutral',
    title: 'Stable',
    msg:
      counts.rated > 0
        ? `Charge régulière, pas de signal de fatigue. ${counts.up} en hausse, ${counts.flat} ${plural(counts.flat, 'stable')}, ${counts.down} en baisse : la prochaine étape, c’est une série ou 2,5 kg de plus là où le RPE le permet.`
        : 'Charge régulière, pas de signal de fatigue. Encore une séance ou deux par exercice pour lire les tendances.',
    axes,
  };
}
