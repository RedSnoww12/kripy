"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface WeightHomeCardProps {
  currentWeight: number | null;
  goalWeight: number;
  onSave: (weight: number) => void;
}

export function WeightHomeCard({
  currentWeight,
  goalWeight,
  onSave,
}: WeightHomeCardProps) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const w = parseFloat(value.replace(",", "."));
    if (isNaN(w) || w < 20 || w > 300) return;
    setSaving(true);
    await onSave(w);
    setValue("");
    setSaving(false);
  }

  const diff = currentWeight ? +(currentWeight - goalWeight).toFixed(1) : null;

  return (
    <div className="bg-card border border-[var(--purple)]/15 rounded-2xl p-3.5 relative overflow-hidden bg-gradient-to-br from-[var(--purple)]/[0.04] to-transparent">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[var(--purple)] to-[var(--pink)]" />

      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-2 bg-gradient-to-r from-muted-foreground to-primary bg-clip-text text-transparent">
        Poids
      </div>

      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1">
          <span className="text-2xl font-bold">
            {currentWeight ?? "--"}
          </span>
          <span className="text-xs text-muted-foreground ml-1">kg</span>
          {diff !== null && (
            <span
              className={`text-xs ml-2 font-semibold ${
                diff > 0 ? "text-[var(--orange)]" : "text-[var(--green)]"
              }`}
            >
              {diff > 0 ? "+" : ""}
              {diff} kg
            </span>
          )}
        </div>
        <div className="text-right">
          <div className="text-[9px] text-muted-foreground">Objectif</div>
          <div className="text-sm font-bold">{goalWeight} kg</div>
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          type="number"
          step="0.1"
          placeholder="Poids (kg)"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1"
        />
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? "..." : "OK"}
        </Button>
      </div>
    </div>
  );
}
