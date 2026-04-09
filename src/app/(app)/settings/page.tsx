"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PHASE_NAMES, PHASE_COLORS, PHASE_MULTIPLIERS, type PhaseId } from "@/logic/phases";
import { ACTIVITY_LABELS, ACTIVITY_MULTIPLIERS, type ActivityLevel, calculateDefaultMacros, calculateBMR, calculateStepBonus } from "@/logic/tdee";
import { MACRO_PRESETS, presetToGrams, macrosToKcal } from "@/logic/macros";

export default function SettingsPage() {
  const [height, setHeight] = useState(175);
  const [goalWeight, setGoalWeight] = useState(75);
  const [currentWeight, setCurrentWeight] = useState(75);
  const [stepsGoal, setStepsGoal] = useState(10000);
  const [activity, setActivity] = useState<ActivityLevel>("moderate");
  const [phase, setPhase] = useState<PhaseId>("A");
  const [targets, setTargets] = useState({ kcal: 2200, prot: 150, gluc: 250, lip: 75, fib: 30 });
  const [saved, setSaved] = useState(false);
  const [tdeeInfo, setTdeeInfo] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [profileRes, targetsRes, weightRes] = await Promise.all([
          fetch("/api/profile"),
          fetch("/api/targets"),
          fetch("/api/weight?latest=true"),
        ]);
        if (profileRes.ok) {
          const p = await profileRes.json();
          setHeight(p.height);
          setGoalWeight(p.goalWeight);
          setStepsGoal(p.stepsGoal);
          setActivity(p.activityLevel);
          setPhase(p.phase);
        }
        if (targetsRes.ok) {
          const t = await targetsRes.json();
          setTargets(t);
        }
        if (weightRes.ok) {
          const w = await weightRes.json();
          if (w.weight) setCurrentWeight(w.weight);
        }
      } catch {
        // Offline
      }
    }
    load();
  }, []);

  function handleCalculateTDEE() {
    const bmr = calculateBMR(currentWeight, height);
    const actMult = ACTIVITY_MULTIPLIERS[activity] ?? 1.55;
    const tdeeBase = Math.round(bmr * actMult);
    const stepBonus = calculateStepBonus(stepsGoal);
    const tdeeRaw = tdeeBase + stepBonus;
    const phaseMult = PHASE_MULTIPLIERS[phase] ?? 1.0;
    const tdee = Math.round(tdeeRaw * phaseMult);
    const macros = calculateDefaultMacros(tdee, currentWeight);

    setTargets({
      kcal: tdee,
      prot: macros.prot,
      gluc: macros.gluc,
      lip: macros.lip,
      fib: 30,
    });

    setTdeeInfo(
      `BMR=${Math.round(bmr)} × ${actMult} (${activity.replace("_", " ")}) = ${tdeeBase} + Pas: +${stepBonus} → ${tdeeRaw} × Phase ${phase} (${phaseMult}) = ${tdee} kcal | P: ${macros.prot}g G: ${macros.gluc}g L: ${macros.lip}g`
    );
  }

  function handlePreset(name: string) {
    const preset = MACRO_PRESETS[name];
    if (!preset) return;
    const grams = presetToGrams(targets.kcal, preset);
    setTargets((prev) => ({ ...prev, ...grams }));
  }

  async function handleSave() {
    try {
      await Promise.all([
        fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            height,
            goalWeight,
            stepsGoal,
            activityLevel: activity,
            phase,
          }),
        }),
        fetch("/api/targets", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(targets),
        }),
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 1200);
    } catch {
      // Offline
    }
  }

  const macroKcal = macrosToKcal(targets.prot, targets.gluc, targets.lip);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-1 duration-200">
      <h2 className="text-lg font-extrabold tracking-tight bg-gradient-to-br from-foreground to-primary bg-clip-text text-transparent mb-4">
        Reglages
      </h2>

      {/* Profile */}
      <div className="bg-card border border-border rounded-2xl p-3 mb-3 space-y-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold bg-gradient-to-r from-muted-foreground to-primary bg-clip-text text-transparent">
          Profil
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[9px] text-muted-foreground uppercase block mb-0.5">
              Taille (cm)
            </label>
            <Input type="number" value={height} onChange={(e) => setHeight(+e.target.value)} />
          </div>
          <div>
            <label className="text-[9px] text-muted-foreground uppercase block mb-0.5">
              Objectif (kg)
            </label>
            <Input type="number" step="0.1" value={goalWeight} onChange={(e) => setGoalWeight(+e.target.value)} />
          </div>
          <div>
            <label className="text-[9px] text-muted-foreground uppercase block mb-0.5">
              Poids actuel (kg)
            </label>
            <Input type="number" step="0.1" value={currentWeight} onChange={(e) => setCurrentWeight(+e.target.value)} />
          </div>
          <div>
            <label className="text-[9px] text-muted-foreground uppercase block mb-0.5">
              Obj. pas/jour
            </label>
            <Input type="number" value={stepsGoal} onChange={(e) => setStepsGoal(+e.target.value)} />
          </div>
        </div>

        <div>
          <label className="text-[9px] text-muted-foreground uppercase block mb-0.5">
            Activite
          </label>
          <select
            value={activity}
            onChange={(e) => setActivity(e.target.value as ActivityLevel)}
            className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm"
          >
            {Object.entries(ACTIVITY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Phase */}
      <div className="bg-card border border-border rounded-2xl p-3 mb-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-2 bg-gradient-to-r from-muted-foreground to-primary bg-clip-text text-transparent">
          Phase
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {(Object.keys(PHASE_NAMES) as PhaseId[]).map((id) => (
            <button
              key={id}
              onClick={() => setPhase(id)}
              className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-semibold transition-all active:scale-95 ${
                phase === id ? "border-primary bg-primary/10" : "border-border"
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PHASE_COLORS[id] }} />
              <span>{id}</span>
              <span className="text-[8px] text-muted-foreground">{PHASE_NAMES[id]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* TDEE Calculator */}
      <div className="bg-card border border-border rounded-2xl p-3 mb-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-2 bg-gradient-to-r from-muted-foreground to-primary bg-clip-text text-transparent">
          Calculer TDEE
        </div>
        <Button onClick={handleCalculateTDEE} variant="outline" className="w-full mb-2 min-h-[44px]">
          Calculer automatiquement
        </Button>
        {tdeeInfo && (
          <div className="bg-primary/10 border border-primary/15 rounded-xl p-2.5 text-xs text-primary leading-relaxed">
            {tdeeInfo}
          </div>
        )}
      </div>

      {/* Targets */}
      <div className="bg-card border border-border rounded-2xl p-3 mb-3 space-y-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold bg-gradient-to-r from-muted-foreground to-primary bg-clip-text text-transparent">
          Objectifs macros
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {(["kcal", "prot", "gluc", "lip", "fib"] as const).map((key) => (
            <div key={key}>
              <label className="text-[9px] text-muted-foreground uppercase block text-center mb-0.5">
                {key}
              </label>
              <Input
                type="number"
                value={targets[key]}
                onChange={(e) => setTargets({ ...targets, [key]: +e.target.value })}
                className="text-center text-xs"
              />
            </div>
          ))}
        </div>

        <div className="text-[10px] text-muted-foreground text-center">
          Total macros: {macroKcal} kcal (cible: {targets.kcal})
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-1.5">
          {Object.keys(MACRO_PRESETS).map((name) => (
            <button
              key={name}
              onClick={() => handlePreset(name)}
              className="px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-secondary border border-border text-muted-foreground active:scale-95 transition-all"
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Save */}
      <Button onClick={handleSave} className={`w-full min-h-[44px] ${saved ? "bg-[var(--green)]" : ""}`}>
        {saved ? "✓" : "Sauvegarder"}
      </Button>
    </div>
  );
}
