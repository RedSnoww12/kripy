import type { PhaseId } from "./phases";
import type { TrendResult } from "./trend";

export type ActionType = "maintenir" | "+200" | "-200" | "observer";
export type AlertType = "info" | "success" | "warn" | "danger";

export interface Recommendation {
  act: ActionType;
  msg: string;
  tp: AlertType;
  reason: string;
  newKcal?: number;
}

const MIN_KCAL = 1200;

export function recommendAction(
  phase: PhaseId,
  trend: TrendResult,
  kcal: number
): Recommendation {
  const newUp = kcal + 200;
  const newDn = Math.max(MIN_KCAL, kcal - 200);
  const d = trend.dir;
  const r = trend.rate;

  // Observation phase
  if (d === "observing") {
    const dn = trend.daysOnPalier;
    const dt = trend.daysNeeded;
    return {
      act: "observer",
      msg: `Palier ${kcal} kcal — observe encore (${dn}/${dt} jours)`,
      tp: "info",
      reason: `Reste sur ${kcal} kcal pendant au moins ${dt} jours avant d'ajuster. Tendance fiable a partir de ${trend.idealDays} jours.`,
    };
  }

  let act: ActionType = "maintenir";
  let msg = "";
  let tp: AlertType = "info";
  let reason = "";
  let newKcal: number | undefined;

  if (phase === "A") {
    // Pre-prep
    if (d === "down_fast") {
      msg = `Baisse rapide (${r} kg/sem) — maintiens ${kcal} kcal`;
      tp = "warn";
      reason = "Tu perds trop vite pour une pre-prep.";
    } else if (d === "down") {
      msg = `Legere baisse (${r} kg/sem) — maintiens ${kcal} kcal`;
      tp = "success";
      reason = "Tendance normale en pre-prep.";
    } else if (d === "stable") {
      act = "+200";
      newKcal = newUp;
      msg = `Stagnation (+/-0) — passe a ${newUp} kcal (+200)`;
      tp = "warn";
      reason = "Ton metabolisme tient, augmente pour progresser.";
    } else if (d === "up") {
      msg = `Legere prise (+${r} kg/sem) — maintiens ${kcal} kcal`;
      tp = "info";
      reason = "Continue, le corps s'adapte.";
    } else {
      act = "-200";
      newKcal = newDn;
      msg = `Prise rapide (+${r} kg/sem) — baisse a ${newDn} kcal (-200)`;
      tp = "danger";
      reason = "Trop rapide, ralentis.";
    }
  } else if (phase === "B") {
    // Deficit
    if (d === "down_fast") {
      act = "+200";
      newKcal = newUp;
      msg = `Perte trop rapide (${r} kg/sem) — monte a ${newUp} kcal (+200)`;
      tp = "warn";
      reason = "Risque de perte musculaire. Ralentis le deficit.";
    } else if (d === "down") {
      msg = `Deficit efficace (${r} kg/sem) — maintiens ${kcal} kcal`;
      tp = "success";
      reason = "Rythme optimal, continue.";
    } else if (d === "stable") {
      act = "-200";
      newKcal = newDn;
      msg = `Stagnation en deficit — baisse a ${newDn} kcal (-200)`;
      tp = "warn";
      reason = "Ton corps s'est adapte, besoin de creuser.";
    } else if (d === "up") {
      act = "-200";
      newKcal = newDn;
      msg = `Remontee en deficit (+${r} kg/sem) — baisse a ${newDn} kcal (-200)`;
      tp = "danger";
      reason = "Verifie ton tracking et reduis.";
    } else {
      act = "-200";
      newKcal = newDn;
      msg = `Remontee rapide (+${r} kg/sem) — baisse a ${newDn} kcal (-200)`;
      tp = "danger";
      reason = "Tracking a verifier imperativement.";
    }
  } else if (phase === "C") {
    // Reverse
    if (d === "down_fast" || d === "down") {
      act = "+200";
      newKcal = newUp;
      msg = `Encore en perte (${r} kg/sem) — monte a ${newUp} kcal (+200)`;
      tp = "warn";
      reason = "Le reverse vise a maintenir le poids.";
    } else if (d === "stable") {
      msg = `Reverse stable — maintiens ${kcal} kcal`;
      tp = "success";
      reason = "Parfait, le metabolisme se reeduque.";
    } else if (d === "up") {
      msg = `Legere prise (+${r} kg/sem) — maintiens ${kcal} kcal`;
      tp = "info";
      reason = "Normal en reverse, surveille.";
    } else {
      act = "-200";
      newKcal = newDn;
      msg = `Prise rapide (+${r} kg/sem) — baisse a ${newDn} kcal (-200)`;
      tp = "warn";
      reason = "Tu montes trop vite, ralentis.";
    }
  } else if (phase === "D") {
    // PDM (Bulk)
    if (d === "down_fast" || d === "down") {
      act = "+200";
      newKcal = newUp;
      msg = `Poids baisse (${r} kg/sem) — monte a ${newUp} kcal (+200)`;
      tp = "warn";
      reason = "Pas de surplus, augmente.";
    } else if (d === "stable") {
      act = "+200";
      newKcal = newUp;
      msg = `Stagnation en PDM — monte a ${newUp} kcal (+200)`;
      tp = "warn";
      reason = "Pas de prise, plus de calories necessaires.";
    } else if (d === "up") {
      msg = `PDM on track (+${r} kg/sem) — maintiens ${kcal} kcal`;
      tp = "success";
      reason = "Rythme ideal, continue.";
    } else {
      act = "-200";
      newKcal = newDn;
      msg = `Prise rapide (+${r} kg/sem) — baisse a ${newDn} kcal (-200)`;
      tp = "danger";
      reason = "Trop de gras, ralentis le bulk.";
    }
  } else {
    // Phase E - Reset
    if (d === "down_fast" || d === "down") {
      msg = `Reset OK (${r} kg/sem) — maintiens ${kcal} kcal`;
      tp = "success";
      reason = "Le reset fonctionne.";
    } else if (d === "stable") {
      act = "-200";
      newKcal = newDn;
      msg = `Stagnation reset — baisse a ${newDn} kcal (-200)`;
      tp = "warn";
      reason = "Ajuste pour relancer.";
    } else {
      act = "-200";
      newKcal = newDn;
      msg = `Remontee en reset (+${r} kg/sem) — baisse a ${newDn} kcal (-200)`;
      tp = "danger";
      reason = "Baisse pour reprendre le controle.";
    }
  }

  return { act, msg, tp, reason, newKcal };
}

/** When applying a calorie change, adjust glucose by ±50g */
export function adjustMacrosForCalorieChange(
  currentGluc: number,
  action: "+200" | "-200"
): number {
  if (action === "+200") return currentGluc + 50;
  return Math.max(0, currentGluc - 50);
}
