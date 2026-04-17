import type {
  LinRegPoint,
  LinRegResult,
  LogByDate,
  MealEntry,
  Palier,
  Phase,
  PhaseTrendResult,
  Recommendation,
  TrendConfidence,
  TrendDirection,
  TrendResult,
  WeightEntry,
  WeightStats,
} from '@/types';
import { palierDays } from './palier';

interface EnrichedWeight extends WeightEntry {
  tgKcal: number;
  phase: Phase;
  actKcal: number;
  delta: number;
}

interface TrendDeps {
  weights: WeightEntry[];
  palier: Palier;
  currentKcal: number;
  currentPhase: Phase;
  log: LogByDate;
  today: string;
}

const MS_PER_DAY = 86_400_000;
const MIN_DAYS = 3;
const IDEAL_DAYS = 5;

const ADAPTIVE_WINDOWS: readonly {
  w: number;
  maxNoise: number;
  minN: number;
  conf: TrendConfidence;
}[] = [
  { w: 7, maxNoise: 0.7, minN: 5, conf: 'high' },
  { w: 5, maxNoise: 1.0, minN: 4, conf: 'medium' },
  { w: 3, maxNoise: Infinity, minN: 3, conf: 'low' },
];

export type { LinRegPoint } from '@/types';

export function linReg(pts: LinRegPoint[]): LinRegResult {
  const n = pts.length;
  if (n === 0) return { slope: 0, intercept: 0, r2: 0, ssRes: 0, n: 0 };

  const sx = pts.reduce((s, pt) => s + pt.x, 0);
  const sy = pts.reduce((s, pt) => s + pt.y, 0);
  const sxx = pts.reduce((s, pt) => s + pt.x * pt.x, 0);
  const sxy = pts.reduce((s, pt) => s + pt.x * pt.y, 0);

  const denom = n * sxx - sx * sx;
  const slope = denom !== 0 ? (n * sxy - sx * sy) / denom : 0;
  const intercept = (sy - slope * sx) / n;

  const meanY = sy / n;
  const ssTot = pts.reduce((s, pt) => s + (pt.y - meanY) ** 2, 0);
  const ssRes = pts.reduce((s, pt) => {
    const pred = slope * pt.x + intercept;
    return s + (pt.y - pred) ** 2;
  }, 0);
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  return { slope, intercept, r2, ssRes, n };
}

function sumDayKcal(entries: MealEntry[] | undefined): number {
  if (!entries) return 0;
  return entries.reduce((s, e) => s + (e.kcal ?? 0), 0);
}

function enrichWeight(
  entry: WeightEntry,
  defaults: { tgKcal: number; phase: Phase },
  log: LogByDate,
): EnrichedWeight {
  const tgKcal =
    typeof entry.tgKcal === 'number' && entry.tgKcal > 0
      ? entry.tgKcal
      : defaults.tgKcal;
  const phase =
    typeof entry.phase === 'string' ? (entry.phase as Phase) : defaults.phase;
  const actKcal = Math.round(sumDayKcal(log[entry.date]));
  return { ...entry, tgKcal, phase, actKcal, delta: actKcal - tgKcal };
}

function toLinRegPoints(slice: EnrichedWeight[]): LinRegPoint[] {
  if (!slice.length) return [];
  const t0 = Date.parse(slice[0].date);
  return slice.map((pt) => ({
    x: (Date.parse(pt.date) - t0) / MS_PER_DAY,
    y: pt.w,
  }));
}

function pendingResult(
  palier: Palier,
  sampleSize: number,
  days: number,
): TrendResult {
  return {
    dir: 'observing',
    rate: 0,
    confidence: 'pending',
    sampleSize,
    daysOnPalier: days,
    daysNeeded: MIN_DAYS,
    idealDays: IDEAL_DAYS,
    palierKcal: palier.kcal,
    window: 0,
    avgAct: 0,
    avgTg: palier.kcal,
    adherence: null,
    trackedDays: 0,
    r2: 0,
  };
}

function pickDirection(
  rate: number,
  slope: number,
  dayspan: number,
  residualStd: number,
  confidence: TrendConfidence,
): TrendDirection {
  const confMult =
    confidence === 'high' ? 1.0 : confidence === 'medium' ? 1.25 : 1.6;
  const tFast = 0.8 * confMult;
  const tSlow = 0.2 * confMult;

  const signalAbs = Math.abs(slope * dayspan);
  if (signalAbs < residualStd * 1.5) return 'stable';
  if (rate <= -tFast) return 'down_fast';
  if (rate <= -tSlow) return 'down';
  if (rate < tSlow) return 'stable';
  if (rate < tFast) return 'up';
  return 'up_fast';
}

export function trend72(deps: TrendDeps): TrendResult | null {
  const { weights, palier, currentKcal, currentPhase, log, today } = deps;
  if (!weights.length) return null;

  const onPalierRaw = weights.filter(
    (x) =>
      x.date >= palier.startDate &&
      (typeof x.tgKcal !== 'number' || x.tgKcal === palier.kcal) &&
      (typeof x.phase !== 'string' || x.phase === palier.phase),
  );

  const days = palierDays(palier, today);

  if (onPalierRaw.length < 3 || days < MIN_DAYS) {
    return pendingResult(palier, onPalierRaw.length, days);
  }

  const defaults = { tgKcal: currentKcal, phase: currentPhase };
  const onPalier = onPalierRaw.map((e) => enrichWeight(e, defaults, log));

  let chosen: {
    slice: EnrichedWeight[];
    pts: LinRegPoint[];
    lr: LinRegResult;
    window: number;
    confidence: TrendConfidence;
  } | null = null;

  for (const s of ADAPTIVE_WINDOWS) {
    const slice = onPalier.slice(-s.w);
    if (slice.length < s.minN) continue;
    const pts = toLinRegPoints(slice);
    const lr = linReg(pts);
    const residualStd = Math.sqrt(lr.ssRes / Math.max(1, lr.n));
    const signalAmp = Math.max(0.2, Math.abs(lr.slope * s.w));
    const noiseRatio = residualStd / signalAmp;
    if (noiseRatio < s.maxNoise || s.w === 3) {
      chosen = { slice, pts, lr, window: s.w, confidence: s.conf };
      break;
    }
  }

  if (!chosen) {
    const slice = onPalier.slice(-3);
    const pts = toLinRegPoints(slice);
    chosen = {
      slice,
      pts,
      lr: linReg(pts),
      window: 3,
      confidence: 'low',
    };
  }

  const rate = +(chosen.lr.slope * 7).toFixed(2);
  const tracked = chosen.slice.filter((e) => e.actKcal > 0 && e.date !== today);
  const trackedDays = tracked.length;

  let avgAct = 0;
  let avgTg = 0;
  let adherence: number | null = null;

  if (trackedDays >= 2) {
    avgAct = Math.round(
      tracked.reduce((s, e) => s + e.actKcal, 0) / trackedDays,
    );
    avgTg = Math.round(tracked.reduce((s, e) => s + e.tgKcal, 0) / trackedDays);
    const avgDev =
      tracked.reduce((s, e) => s + Math.abs(e.actKcal - e.tgKcal), 0) /
      trackedDays;
    adherence = avgTg > 0 ? Math.round(100 * (1 - avgDev / avgTg)) : null;
  } else {
    avgTg = Math.round(
      chosen.slice.reduce((s, e) => s + e.tgKcal, 0) / chosen.slice.length,
    );
  }

  let confidence: TrendConfidence = chosen.confidence;
  if (adherence !== null && adherence < 85) confidence = 'low';

  const residualStd = Math.sqrt(chosen.lr.ssRes / Math.max(1, chosen.lr.n));
  const dayspan = Math.max(
    1,
    chosen.pts[chosen.pts.length - 1].x - chosen.pts[0].x,
  );
  const dir = pickDirection(
    rate,
    chosen.lr.slope,
    dayspan,
    residualStd,
    confidence,
  );

  return {
    dir,
    rate,
    confidence,
    window: chosen.window,
    sampleSize: chosen.lr.n,
    r2: +chosen.lr.r2.toFixed(2),
    daysOnPalier: days,
    daysNeeded: MIN_DAYS,
    idealDays: IDEAL_DAYS,
    palierKcal: palier.kcal,
    avgAct,
    avgTg,
    adherence,
    trackedDays,
  };
}

interface PhaseTrendDeps {
  weights: WeightEntry[];
  phase: Phase;
  currentKcal: number;
  log: LogByDate;
}

export function phaseTrend(deps: PhaseTrendDeps): PhaseTrendResult | null {
  const { weights, phase, currentKcal, log } = deps;
  if (!weights.length) return null;

  const defaults = { tgKcal: currentKcal, phase };
  const matched = weights
    .filter((e) => (typeof e.phase === 'string' ? e.phase === phase : true))
    .map((e) => enrichWeight(e, defaults, log));

  if (matched.length < 2) return { count: matched.length, phase };

  const pts = toLinRegPoints(matched);
  const lr = linReg(pts);
  const rate = +(lr.slope * 7).toFixed(2);
  const startDate = matched[0].date;
  const endDate = matched[matched.length - 1].date;
  const totalChange = +(matched[matched.length - 1].w - matched[0].w).toFixed(
    1,
  );

  return {
    count: matched.length,
    phase,
    rate,
    r2: +lr.r2.toFixed(2),
    startDate,
    endDate,
    totalChange,
  };
}

interface WeightStatsDeps {
  weights: WeightEntry[];
  heightCm: number;
  startWeight: number;
  today: string;
}

export function weightStats(deps: WeightStatsDeps): WeightStats | null {
  const { weights, heightCm, startWeight, today } = deps;
  if (!weights.length) return null;

  const cur = weights[weights.length - 1].w;
  const start = weights[0].w;
  const mn = Math.min(...weights.map((x) => x.w));
  const mx = Math.max(...weights.map((x) => x.w));
  const hm = heightCm / 100;
  const bmi = hm > 0 ? (cur / (hm * hm)).toFixed(1) : '--';

  const todayMs = Date.parse(today);
  const cutoff = (days: number): string =>
    new Date(todayMs - days * MS_PER_DAY).toISOString().slice(0, 10);

  const w7 = weights.filter((x) => x.date >= cutoff(7));
  const avg7 = w7.length
    ? +(w7.reduce((s, x) => s + x.w, 0) / w7.length).toFixed(1)
    : cur;

  const w30 = weights.filter((x) => x.date >= cutoff(30));
  const avg30 = w30.length
    ? +(w30.reduce((s, x) => s + x.w, 0) / w30.length).toFixed(1)
    : cur;

  let rate = 0;
  if (w7.length >= 2) {
    rate = +(((w7[w7.length - 1].w - w7[0].w) / (w7.length - 1)) * 7).toFixed(
      2,
    );
  } else if (weights.length >= 2) {
    const days = Math.max(
      1,
      (Date.parse(weights[weights.length - 1].date) -
        Date.parse(weights[0].date)) /
        MS_PER_DAY,
    );
    rate = +(((cur - start) / days) * 7).toFixed(2);
  }

  let estDays: number | null = null;
  if (
    rate !== 0 &&
    ((cur > startWeight && rate < 0) || (cur < startWeight && rate > 0))
  ) {
    estDays = Math.ceil((Math.abs(cur - startWeight) / Math.abs(rate)) * 7);
  }

  const w14 = weights.filter((x) => x.date >= cutoff(14));
  const reg = Math.min(100, Math.round((w14.length / 14) * 100));

  return {
    cur,
    start,
    mn,
    mx,
    bmi,
    avg7,
    avg30,
    rate,
    estDays,
    total: +(cur - start).toFixed(1),
    reg,
    count: weights.length,
  };
}

export function recommendAction(
  phase: Phase,
  trend: TrendResult,
  kcal: number,
): Recommendation {
  const newUp = kcal + 200;
  const newDn = Math.max(1200, kcal - 200);
  const { dir: d, rate: r } = trend;

  if (d === 'observing') {
    const dn = trend.daysOnPalier;
    const dt = trend.daysNeeded;
    return {
      act: 'observer',
      tp: 'info',
      msg: `Palier ${kcal} kcal — observe encore (${dn}/${dt} jours)`,
      reason: `Reste sur ${kcal} kcal pendant au moins ${dt} jours avant d'ajuster. Tendance fiable à partir de ${trend.idealDays} jours.`,
    };
  }

  if (
    trend.confidence === 'low' &&
    trend.adherence !== null &&
    trend.adherence < 85
  ) {
    return {
      act: 'observer',
      tp: 'warn',
      msg: `Tracking irrégulier (${trend.adherence}% adhérence) — stabilise avant d'ajuster`,
      reason: `Moy réelle ${trend.avgAct} kcal vs cible ${trend.avgTg} kcal. Respecte la cible ${trend.idealDays}j avant de décider un +/-200.`,
    };
  }

  if (phase === 'B' && trend.avgAct > 0 && trend.avgAct > kcal + 100) {
    return {
      act: 'maintenir',
      tp: 'warn',
      msg: `Dépassement cible (+${trend.avgAct - kcal} kcal) — maintiens ${kcal} kcal`,
      reason:
        'Tu manges au-dessus de ta cible déficit. Tiens le palier actuel avant de couper.',
    };
  }

  if (phase === 'D' && trend.avgAct > 0 && trend.avgAct < kcal - 100) {
    return {
      act: 'maintenir',
      tp: 'warn',
      msg: `Sous-consommation (-${kcal - trend.avgAct} kcal) — maintiens ${kcal} kcal`,
      reason: `Tu manges en-dessous de ta cible PDM. Atteins d'abord ${kcal} kcal avant de monter.`,
    };
  }

  if (phase === 'F' && trend.avgAct > 0 && trend.avgAct < kcal - 100) {
    return {
      act: 'maintenir',
      tp: 'warn',
      msg: `Sous-consommation (-${kcal - trend.avgAct} kcal) — tiens ${kcal} kcal`,
      reason:
        "La remonte exige d'atteindre la cible. Tu recrees un deficit non voulu, stabilise d'abord.",
    };
  }

  if (phase === 'A') {
    if (d === 'down_fast')
      return {
        act: 'maintenir',
        tp: 'warn',
        msg: `Baisse rapide (${r} kg/sem) — maintiens ${kcal} kcal`,
        reason: 'Tu perds trop vite pour une pre-prep.',
      };
    if (d === 'down')
      return {
        act: 'maintenir',
        tp: 'success',
        msg: `Légère baisse (${r} kg/sem) — maintiens ${kcal} kcal`,
        reason: 'Tendance normale en pre-prep.',
      };
    if (d === 'stable')
      return {
        act: '+200',
        tp: 'warn',
        msg: `Stagnation (+/-0) — passe à ${newUp} kcal (+200)`,
        reason: 'Ton métabolisme tient, augmente pour progresser.',
      };
    if (d === 'up')
      return {
        act: 'maintenir',
        tp: 'info',
        msg: `Légère prise (+${r} kg/sem) — maintiens ${kcal} kcal`,
        reason: "Continue, le corps s'adapte.",
      };
    return {
      act: '-200',
      tp: 'danger',
      msg: `Prise rapide (+${r} kg/sem) — baisse à ${newDn} kcal (-200)`,
      reason: 'Trop rapide, ralentis.',
    };
  }

  if (phase === 'B') {
    if (d === 'down_fast')
      return {
        act: '+200',
        tp: 'warn',
        msg: `Perte trop rapide (${r} kg/sem) — monte à ${newUp} kcal (+200)`,
        reason: 'Risque de perte musculaire. Ralentis le déficit.',
      };
    if (d === 'down')
      return {
        act: 'maintenir',
        tp: 'success',
        msg: `Déficit efficace (${r} kg/sem) — maintiens ${kcal} kcal`,
        reason: 'Rythme optimal, continue.',
      };
    if (d === 'stable')
      return {
        act: '-200',
        tp: 'warn',
        msg: `Stagnation en déficit — baisse à ${newDn} kcal (-200)`,
        reason: "Ton corps s'est adapté, besoin de creuser.",
      };
    if (d === 'up')
      return {
        act: '-200',
        tp: 'danger',
        msg: `Remontée en déficit (+${r} kg/sem) — baisse à ${newDn} kcal (-200)`,
        reason: 'Vérifie ton tracking et réduis.',
      };
    return {
      act: '-200',
      tp: 'danger',
      msg: `Remontée rapide (+${r} kg/sem) — baisse à ${newDn} kcal (-200)`,
      reason: 'Tracking à vérifier impérativement.',
    };
  }

  if (phase === 'C') {
    if (d === 'down_fast' || d === 'down')
      return {
        act: '+200',
        tp: 'warn',
        msg: `Encore en perte (${r} kg/sem) — monte à ${newUp} kcal (+200)`,
        reason: 'Le reverse vise à maintenir le poids.',
      };
    if (d === 'stable')
      return {
        act: 'maintenir',
        tp: 'success',
        msg: `Reverse stable — maintiens ${kcal} kcal`,
        reason: 'Parfait, le métabolisme se rééduque.',
      };
    if (d === 'up')
      return {
        act: 'maintenir',
        tp: 'info',
        msg: `Légère prise (+${r} kg/sem) — maintiens ${kcal} kcal`,
        reason: 'Normal en reverse, surveille.',
      };
    return {
      act: '-200',
      tp: 'warn',
      msg: `Prise rapide (+${r} kg/sem) — baisse à ${newDn} kcal (-200)`,
      reason: 'Tu montes trop vite, ralentis.',
    };
  }

  if (phase === 'F') {
    if (d === 'down_fast')
      return {
        act: 'maintenir',
        tp: 'warn',
        msg: `Baisse rapide (${r} kg/sem) — maintiens ${kcal} kcal`,
        reason:
          'Tu descends encore vite malgré la remonte. Tiens le palier, ne remonte pas encore.',
      };
    if (d === 'down')
      return {
        act: 'maintenir',
        tp: 'success',
        msg: `Remonte efficace (${r} kg/sem) — maintiens ${kcal} kcal`,
        reason:
          'Parfait: tu remontes les kcal ET tu perds du poids. Continue sur ce palier.',
      };
    if (d === 'stable')
      return {
        act: '+200',
        tp: 'info',
        msg: `Plateau atteint — monte à ${newUp} kcal (+200)`,
        reason:
          "Le métabolisme s'est adapté au palier. Pousse encore pour relancer la perte plus haut en kcal.",
      };
    if (d === 'up')
      return {
        act: '-200',
        tp: 'warn',
        msg: `Légère prise (+${r} kg/sem) — baisse à ${newDn} kcal (-200)`,
        reason:
          'Tu as dépassé le plafond de remonte. Reviens au palier précédent.',
      };
    return {
      act: '-200',
      tp: 'danger',
      msg: `Prise rapide (+${r} kg/sem) — baisse à ${newDn} kcal (-200)`,
      reason: 'Largement au-dessus du plafond, redescends.',
    };
  }

  if (phase === 'D') {
    if (d === 'down_fast' || d === 'down')
      return {
        act: '+200',
        tp: 'warn',
        msg: `Poids baisse (${r} kg/sem) — monte à ${newUp} kcal (+200)`,
        reason: 'Pas de surplus, augmente.',
      };
    if (d === 'stable')
      return {
        act: '+200',
        tp: 'warn',
        msg: `Stagnation en PDM — monte à ${newUp} kcal (+200)`,
        reason: 'Pas de prise, plus de calories nécessaires.',
      };
    if (d === 'up')
      return {
        act: 'maintenir',
        tp: 'success',
        msg: `PDM on track (+${r} kg/sem) — maintiens ${kcal} kcal`,
        reason: 'Rythme idéal, continue.',
      };
    return {
      act: '-200',
      tp: 'danger',
      msg: `Prise rapide (+${r} kg/sem) — baisse à ${newDn} kcal (-200)`,
      reason: 'Trop de gras, ralentis le bulk.',
    };
  }

  // Phase E (Reset)
  if (d === 'down_fast' || d === 'down')
    return {
      act: 'maintenir',
      tp: 'success',
      msg: `Reset OK (${r} kg/sem) — maintiens ${kcal} kcal`,
      reason: 'Le reset fonctionne.',
    };
  if (d === 'stable')
    return {
      act: '-200',
      tp: 'warn',
      msg: `Stagnation reset — baisse à ${newDn} kcal (-200)`,
      reason: 'Ajuste pour relancer.',
    };
  return {
    act: '-200',
    tp: 'danger',
    msg: `Remontée en reset (+${r} kg/sem) — baisse à ${newDn} kcal (-200)`,
    reason: 'Baisse pour reprendre le contrôle.',
  };
}
