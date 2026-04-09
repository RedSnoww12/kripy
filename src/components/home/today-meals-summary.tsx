"use client";

import { MEALS } from "@/logic/constants";
import type { MealItemData } from "@/types";

interface TodayMealsSummaryProps {
  items: MealItemData[];
}

export function TodayMealsSummary({ items }: TodayMealsSummaryProps) {
  const mealTotals = MEALS.map((name, idx) => {
    const mealItems = items.filter((i) => i.meal === idx);
    const kcal = mealItems.reduce((s, i) => s + i.kcal, 0);
    return { name, kcal, count: mealItems.length };
  });

  const borderColors = [
    "border-l-[var(--orange)]",
    "border-l-[var(--green)]",
    "border-l-[var(--purple)]",
    "border-l-[var(--pink)]",
  ];

  return (
    <div className="bg-card border border-border rounded-2xl p-3 mb-2.5">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xs font-bold">Repas du jour</h3>
        <span className="text-xs text-[var(--orange)] font-semibold">
          {Math.round(items.reduce((s, i) => s + i.kcal, 0))} kcal
        </span>
      </div>

      {mealTotals.map((m, idx) => (
        <div
          key={m.name}
          className={`flex justify-between items-center bg-secondary rounded-[10px] px-3 py-2.5 mb-1 text-xs border-l-[3px] ${borderColors[idx]}`}
        >
          <span className="flex-1 font-medium">{m.name}</span>
          <span className="text-[var(--orange)] font-semibold">
            {m.count > 0 ? `${Math.round(m.kcal)} kcal` : "—"}
          </span>
        </div>
      ))}
    </div>
  );
}
