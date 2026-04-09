"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { FOODS } from "@/logic/constants";
import { normalizeSearch, type FoodData } from "@/logic/food-calc";

interface FoodSearchProps {
  onSelect: (name: string, data: FoodData) => void;
}

export function FoodSearch({ onSelect }: FoodSearchProps) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (query.length < 2) return [];
    const q = normalizeSearch(query);
    return Object.entries(FOODS)
      .filter(([name]) => normalizeSearch(name).includes(q))
      .slice(0, 20);
  }, [query]);

  return (
    <div className="mb-3">
      <Input
        type="text"
        placeholder="Rechercher un aliment..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-1"
      />

      {results.length > 0 && (
        <div className="bg-card border border-border rounded-xl max-h-60 overflow-y-auto">
          {results.map(([name, data]) => (
            <button
              key={name}
              onClick={() => {
                onSelect(name, data as FoodData);
                setQuery("");
              }}
              className="w-full text-left px-3 py-2.5 text-xs border-b border-border last:border-0 hover:bg-secondary active:bg-secondary transition-colors flex justify-between items-center min-h-[44px]"
            >
              <span className="font-medium">{name}</span>
              <span className="text-muted-foreground text-[10px]">
                {data[0]} kcal · {data[1]}P · {data[2]}G · {data[3]}L
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
