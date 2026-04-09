"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PHASE_NAMES, PHASE_COLORS, type PhaseId } from "@/logic/phases";
import { ACTIVITY_LABELS, type ActivityLevel } from "@/logic/tdee";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    height: 175,
    weight: 75,
    goalWeight: 70,
    activityLevel: "moderate" as ActivityLevel,
    phase: "A" as PhaseId,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      router.push("/dashboard");
    } else {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm text-center">
      <h2 className="text-2xl font-bold mb-1 bg-gradient-to-br from-foreground to-primary bg-clip-text text-transparent font-[family-name:var(--font-space-grotesk)]">
        Configuration
      </h2>
      <p className="text-sm text-muted-foreground mb-7">
        Quelques infos pour calibrer ton suivi
      </p>

      <form onSubmit={handleSubmit} className="text-left space-y-4">
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold block mb-1">
            Taille (cm)
          </label>
          <Input
            type="number"
            value={form.height}
            onChange={(e) =>
              setForm({ ...form, height: +e.target.value })
            }
            min={100}
            max={250}
          />
        </div>

        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold block mb-1">
            Poids actuel (kg)
          </label>
          <Input
            type="number"
            step="0.1"
            value={form.weight}
            onChange={(e) =>
              setForm({ ...form, weight: +e.target.value })
            }
            min={20}
            max={300}
          />
        </div>

        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold block mb-1">
            Objectif poids (kg)
          </label>
          <Input
            type="number"
            step="0.1"
            value={form.goalWeight}
            onChange={(e) =>
              setForm({ ...form, goalWeight: +e.target.value })
            }
            min={20}
            max={300}
          />
        </div>

        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold block mb-1">
            Niveau d&apos;activite
          </label>
          <select
            value={form.activityLevel}
            onChange={(e) =>
              setForm({
                ...form,
                activityLevel: e.target.value as ActivityLevel,
              })
            }
            className="w-full bg-secondary border border-border rounded-xl px-3 py-3 text-base"
          >
            {Object.entries(ACTIVITY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold block mb-1">
            Phase
          </label>
          <div className="grid grid-cols-5 gap-2">
            {(Object.keys(PHASE_NAMES) as PhaseId[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setForm({ ...form, phase: id })}
                className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-xs font-semibold transition-all ${
                  form.phase === id
                    ? "border-primary bg-primary/10"
                    : "border-border"
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: PHASE_COLORS[id] }}
                />
                {id}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            {PHASE_NAMES[form.phase]}
          </p>
        </div>

        <Button
          type="submit"
          className="w-full mt-6"
          size="lg"
          disabled={loading}
        >
          {loading ? "Chargement..." : "Commencer"}
        </Button>
      </form>
    </div>
  );
}
