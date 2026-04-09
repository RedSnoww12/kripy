"use client";

import { useState, useEffect, useCallback } from "react";
import { DateNavigator } from "@/components/meals/date-navigator";
import { FoodSearch } from "@/components/meals/food-search";
import { FoodQuantityModal } from "@/components/meals/food-quantity-modal";
import { MealList } from "@/components/meals/meal-list";
import { MEALS } from "@/logic/constants";
import type { FoodData, NutrientResult } from "@/logic/food-calc";
import type { MealItemData } from "@/types";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function shiftDate(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function dateLabel(date: string): string {
  const today = todayStr();
  if (date === today) return "Aujourd'hui";
  const diff = Math.round(
    (new Date(today).getTime() - new Date(date).getTime()) / 86400000
  );
  if (diff === 1) return "Hier";
  if (diff === -1) return "Demain";
  if (diff > 0 && diff <= 3) return `il y a ${diff}j`;
  return new Date(date).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function MealsPage() {
  const [date, setDate] = useState(todayStr());
  const [selectedMeal, setSelectedMeal] = useState(0);
  const [items, setItems] = useState<MealItemData[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState<{
    name: string;
    data: FoodData;
  } | null>(null);

  const maxDate = shiftDate(todayStr(), 7);

  const loadMeals = useCallback(async () => {
    try {
      const res = await fetch(`/api/meals?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch {
      // Offline
    }
  }, [date]);

  useEffect(() => {
    loadMeals();
  }, [loadMeals]);

  function handleFoodSelect(name: string, data: FoodData) {
    setSelectedFood({ name, data });
    setModalOpen(true);
  }

  async function handleAddItem(qty: number, nutrients: NutrientResult) {
    if (!selectedFood) return;

    const newItem: MealItemData = {
      id: Date.now().toString(),
      food: selectedFood.name,
      meal: selectedMeal,
      qty,
      ...nutrients,
    };

    setItems((prev) => [...prev, newItem]);

    try {
      await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, ...newItem }),
      });
    } catch {
      // Offline
    }
  }

  async function handleDeleteItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await fetch(`/api/meals?id=${id}`, { method: "DELETE" });
    } catch {
      // Offline
    }
  }

  const dayTotal = items.reduce((s, i) => s + i.kcal, 0);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-1 duration-200">
      <DateNavigator
        date={date}
        label={dateLabel(date)}
        onPrev={() => setDate(shiftDate(date, -1))}
        onNext={() => {
          if (date < maxDate) setDate(shiftDate(date, 1));
        }}
      />

      {/* Day total */}
      <div className="text-center mb-3">
        <span className="text-2xl font-bold font-[family-name:var(--font-jetbrains-mono)]">
          {Math.round(dayTotal)}
        </span>
        <span className="text-xs text-muted-foreground ml-1">kcal</span>
      </div>

      {/* Meal tabs */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto">
        {MEALS.map((name, idx) => {
          const mealKcal = items
            .filter((i) => i.meal === idx)
            .reduce((s, i) => s + i.kcal, 0);
          return (
            <button
              key={name}
              onClick={() => setSelectedMeal(idx)}
              className={`flex-1 min-w-0 py-2.5 px-2 rounded-xl text-[10px] font-semibold text-center transition-all active:scale-95 ${
                selectedMeal === idx
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary border border-border text-muted-foreground"
              }`}
            >
              <div>{name}</div>
              {mealKcal > 0 && (
                <div className="text-[9px] opacity-75 mt-0.5">
                  {Math.round(mealKcal)}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Food search */}
      <FoodSearch onSelect={handleFoodSelect} />

      {/* Meal list */}
      <MealList
        items={items}
        selectedMeal={selectedMeal}
        onDelete={handleDeleteItem}
      />

      {/* Quantity modal */}
      {selectedFood && (
        <FoodQuantityModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          foodName={selectedFood.name}
          foodData={selectedFood.data}
          onConfirm={handleAddItem}
        />
      )}
    </div>
  );
}
