"use client";

import { useState, useEffect, useCallback } from "react";
import { CalorieRing } from "@/components/home/calorie-ring";
import { MacroRow } from "@/components/home/macro-row";
import { WaterTracker } from "@/components/home/water-tracker";
import { StepsCard } from "@/components/home/steps-card";
import { WeightHomeCard } from "@/components/home/weight-home-card";
import { RecommendationAlert } from "@/components/home/recommendation-alert";
import { TodayMealsSummary } from "@/components/home/today-meals-summary";
import type { MealItemData, TargetsData } from "@/types";
import type { Recommendation } from "@/logic/recommendation";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateLabel(dateStr: string): string {
  const today = todayStr();
  if (dateStr === today) return "Aujourd'hui";
  const d = new Date(dateStr);
  const t = new Date(today);
  const diff = Math.round((t.getTime() - d.getTime()) / 86400000);
  if (diff === 1) return "Hier";
  if (diff === -1) return "Demain";
  if (diff > 0) return `il y a ${diff}j`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function DashboardPage() {
  const [targets, setTargets] = useState<TargetsData>({
    kcal: 2200, prot: 150, gluc: 250, lip: 75, fib: 30,
  });
  const [meals, setMeals] = useState<MealItemData[]>([]);
  const [water, setWater] = useState(0);
  const [steps] = useState(0);
  const [stepsGoal] = useState(10000);
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);
  const [goalWeight] = useState(75);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const today = todayStr();

  const loadData = useCallback(async () => {
    try {
      const [targetsRes, mealsRes, waterRes, weightRes, analysisRes] =
        await Promise.all([
          fetch("/api/targets"),
          fetch(`/api/meals?date=${today}`),
          fetch(`/api/water?date=${today}`),
          fetch("/api/weight?latest=true"),
          fetch("/api/analysis"),
        ]);

      if (targetsRes.ok) {
        const t = await targetsRes.json();
        setTargets(t);
      }
      if (mealsRes.ok) {
        const m = await mealsRes.json();
        setMeals(m.items || []);
      }
      if (waterRes.ok) {
        const w = await waterRes.json();
        setWater(w.glasses || 0);
      }
      if (weightRes.ok) {
        const w = await weightRes.json();
        setCurrentWeight(w.weight ?? null);
      }
      if (analysisRes.ok) {
        const a = await analysisRes.json();
        setRecommendation(a.recommendation || null);
      }
    } catch {
      // API not yet connected — use defaults
    }
  }, [today]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totals = meals.reduce(
    (acc, i) => ({
      kcal: acc.kcal + i.kcal,
      prot: acc.prot + i.prot,
      gluc: acc.gluc + i.gluc,
      lip: acc.lip + i.lip,
      fib: acc.fib + i.fib,
    }),
    { kcal: 0, prot: 0, gluc: 0, lip: 0, fib: 0 }
  );

  async function handleWaterChange(delta: number) {
    const newGlasses = Math.max(0, Math.min(12, water + delta));
    setWater(newGlasses);
    try {
      await fetch("/api/water", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today, glasses: newGlasses }),
      });
    } catch {
      // Offline
    }
  }

  async function handleWeightSave(weight: number) {
    setCurrentWeight(weight);
    try {
      await fetch("/api/weight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today, weight }),
      });
    } catch {
      // Offline
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-1 duration-200">
      {/* Greeting */}
      <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-primary bg-clip-text text-transparent">
        Mon suivi
      </h1>
      <p className="text-xs text-muted-foreground mt-0.5 mb-4 font-medium">
        {formatDateLabel(today)} —{" "}
        {new Date().toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
      </p>

      {/* Calorie ring */}
      <CalorieRing consumed={Math.round(totals.kcal)} target={targets.kcal} />

      {/* Macros */}
      <MacroRow
        prot={totals.prot}
        gluc={totals.gluc}
        lip={totals.lip}
        fib={totals.fib}
        targets={targets}
      />

      {/* Info row: water + steps */}
      <div className="flex gap-2 mb-3">
        <div className="flex-1">
          <WaterTracker
            glasses={water}
            onAdd={() => handleWaterChange(1)}
            onRemove={() => handleWaterChange(-1)}
          />
        </div>
        <div className="flex-1">
          <StepsCard steps={steps} goal={stepsGoal} />
        </div>
      </div>

      {/* Recommendation */}
      <RecommendationAlert recommendation={recommendation} />

      {/* Weight */}
      <div className="mb-2.5">
        <WeightHomeCard
          currentWeight={currentWeight}
          goalWeight={goalWeight}
          onSave={handleWeightSave}
        />
      </div>

      {/* Today's meals */}
      <TodayMealsSummary items={meals} />
    </div>
  );
}
