"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SPLITS, SPLIT_MUSCLES, SPORT_CATEGORIES } from "@/logic/constants";
import type { WorkoutData } from "@/types";

type SportMode = "muscu" | "cardio" | "sport" | "combat";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function SportPage() {
  const [workouts, setWorkouts] = useState<WorkoutData[]>([]);
  const [mode, setMode] = useState<SportMode>("muscu");
  const [selectedSplit, setSelectedSplit] = useState("Upper");
  const [duration, setDuration] = useState(60);
  const [calories, setCalories] = useState(0);
  const [selectedSport, setSelectedSport] = useState("");
  const [muscles, setMuscles] = useState<Record<string, number>>({});

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/workouts");
        if (res.ok) setWorkouts(await res.json());
      } catch {
        // Offline
      }
    }
    load();
  }, []);

  function handleMuscleChange(name: string, sets: number) {
    setMuscles((prev) => ({ ...prev, [name]: Math.max(0, sets) }));
  }

  async function handleSave() {
    const workout: Omit<WorkoutData, "id"> = {
      date: todayStr(),
      type: mode === "muscu" ? selectedSplit : selectedSport,
      duration,
      calories: mode !== "muscu" ? calories : null,
      notes: null,
      muscles:
        mode === "muscu"
          ? Object.entries(muscles)
              .filter(([, sets]) => sets > 0)
              .map(([name, sets]) => ({ name, sets }))
          : [],
    };

    try {
      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workout),
      });
      if (res.ok) {
        const saved = await res.json();
        setWorkouts((prev) => [saved, ...prev]);
        setMuscles({});
        setCalories(0);
      }
    } catch {
      // Offline
    }
  }

  const currentMuscles =
    mode === "muscu"
      ? SPLIT_MUSCLES[selectedSplit] || []
      : [];

  const sportOptions =
    mode === "cardio"
      ? SPORT_CATEGORIES.cardio
      : mode === "sport"
        ? SPORT_CATEGORIES.sport
        : mode === "combat"
          ? SPORT_CATEGORIES.combat
          : [];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-1 duration-200">
      <h2 className="text-lg font-extrabold tracking-tight bg-gradient-to-br from-foreground to-primary bg-clip-text text-transparent mb-4">
        Sport
      </h2>

      {/* Mode tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto">
        {(["muscu", "cardio", "sport", "combat"] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMode(m);
              setSelectedSport("");
            }}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 capitalize whitespace-nowrap ${
              mode === m
                ? "bg-primary text-primary-foreground"
                : "bg-secondary border border-border text-muted-foreground"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Muscu mode */}
      {mode === "muscu" && (
        <>
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {SPLITS.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSplit(s)}
                className={`py-2 rounded-xl text-[10px] font-semibold transition-all active:scale-95 ${
                  selectedSplit === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary border border-border text-muted-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="bg-card border border-border rounded-2xl p-3 mb-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-2">
              Volume par muscle
            </div>
            <div className="space-y-1.5">
              {currentMuscles.map((m) => (
                <div key={m} className="flex items-center justify-between">
                  <span className="text-xs font-medium">{m}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        handleMuscleChange(m, (muscles[m] || 0) - 1)
                      }
                      className="w-7 h-7 rounded-md bg-secondary border border-border text-sm active:scale-90"
                    >
                      −
                    </button>
                    <span className="text-sm font-bold w-6 text-center font-[family-name:var(--font-jetbrains-mono)]">
                      {muscles[m] || 0}
                    </span>
                    <button
                      onClick={() =>
                        handleMuscleChange(m, (muscles[m] || 0) + 1)
                      }
                      className="w-7 h-7 rounded-md bg-secondary border border-border text-sm active:scale-90"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Cardio/Sport/Combat mode */}
      {mode !== "muscu" && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {sportOptions.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSport(s)}
                className={`px-3 py-2 rounded-xl text-[10px] font-semibold transition-all active:scale-95 ${
                  selectedSport === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary border border-border text-muted-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex gap-2 mb-3">
            <div className="flex-1">
              <label className="text-[9px] text-muted-foreground uppercase block mb-0.5">
                Calories brulees
              </label>
              <Input
                type="number"
                value={calories}
                onChange={(e) => setCalories(+e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Duration + Save */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1">
          <label className="text-[9px] text-muted-foreground uppercase block mb-0.5">
            Duree (min)
          </label>
          <Input
            type="number"
            value={duration}
            onChange={(e) => setDuration(+e.target.value)}
          />
        </div>
        <Button onClick={handleSave} className="self-end min-h-[44px]">
          Enregistrer
        </Button>
      </div>

      {/* History */}
      <div className="bg-card border border-border rounded-2xl p-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-2 bg-gradient-to-r from-muted-foreground to-primary bg-clip-text text-transparent">
          Historique
        </div>
        {workouts.length === 0 ? (
          <p className="text-center py-4 text-xs text-muted-foreground">
            Aucune seance
          </p>
        ) : (
          <div className="space-y-1.5">
            {workouts.slice(0, 15).map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between bg-secondary rounded-[10px] px-3 py-2.5 text-xs"
              >
                <div>
                  <div className="font-medium">{w.type}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {w.date} · {w.duration}min
                    {w.calories ? ` · ${w.calories} kcal` : ""}
                    {w.muscles.length > 0
                      ? ` · ${w.muscles.map((m) => `${m.name}(${m.sets})`).join(", ")}`
                      : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
