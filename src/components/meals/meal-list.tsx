"use client";

import { MEALS } from "@/logic/constants";
import type { MealItemData } from "@/types";

interface MealListProps {
  items: MealItemData[];
  selectedMeal: number;
  onDelete: (id: string) => void;
}

export function MealList({ items, selectedMeal, onDelete }: MealListProps) {
  const filtered = items.filter((i) => i.meal === selectedMeal);
  const total = filtered.reduce((s, i) => s + i.kcal, 0);

  return (
    <div className="bg-card border border-border rounded-2xl p-3">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xs font-bold">{MEALS[selectedMeal]}</h3>
        <span className="text-xs text-[var(--orange)] font-semibold">
          {Math.round(total)} kcal
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center py-4 text-xs text-muted-foreground">
          Aucun aliment
        </p>
      ) : (
        <div className="space-y-1">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between bg-secondary rounded-[10px] px-3 py-2.5 text-xs"
            >
              <div className="flex-1">
                <div className="font-medium">{item.food}</div>
                <div className="text-[10px] text-muted-foreground">
                  {item.qty}g · P:{item.prot} G:{item.gluc} L:{item.lip}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[var(--orange)]">
                  {Math.round(item.kcal)}
                </span>
                <button
                  onClick={() => onDelete(item.id)}
                  className="w-6 h-6 rounded-md text-destructive bg-destructive/10 text-[10px] font-bold active:scale-90 transition-transform"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
