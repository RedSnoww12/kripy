"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { RecipeData } from "@/types";

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<RecipeData[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    kcal: 0,
    prot: 0,
    gluc: 0,
    lip: 0,
    fib: 0,
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/recipes");
        if (res.ok) setRecipes(await res.json());
      } catch {
        // Offline
      }
    }
    load();
  }, []);

  async function handleSave() {
    if (!form.name.trim()) return;
    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const saved = await res.json();
        setRecipes((prev) => [...prev, saved]);
        setForm({ name: "", kcal: 0, prot: 0, gluc: 0, lip: 0, fib: 0 });
        setShowForm(false);
      }
    } catch {
      // Offline
    }
  }

  async function handleDelete(id: string) {
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    try {
      await fetch(`/api/recipes?id=${id}`, { method: "DELETE" });
    } catch {
      // Offline
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-1 duration-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-extrabold tracking-tight bg-gradient-to-br from-foreground to-primary bg-clip-text text-transparent">
          Recettes
        </h2>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Annuler" : "+ Recette"}
        </Button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-2xl p-3 mb-3 space-y-2">
          <Input
            placeholder="Nom de la recette"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <div className="grid grid-cols-5 gap-1.5">
            {(["kcal", "prot", "gluc", "lip", "fib"] as const).map((key) => (
              <div key={key}>
                <label className="text-[9px] text-muted-foreground uppercase block text-center mb-0.5">
                  {key}
                </label>
                <Input
                  type="number"
                  value={form[key]}
                  onChange={(e) =>
                    setForm({ ...form, [key]: +e.target.value })
                  }
                  className="text-center text-xs"
                />
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground">
            Valeurs pour 100g
          </p>
          <Button onClick={handleSave} className="w-full min-h-[44px]">
            Sauvegarder
          </Button>
        </div>
      )}

      {recipes.length === 0 ? (
        <p className="text-center py-8 text-xs text-muted-foreground">
          Aucune recette enregistree
        </p>
      ) : (
        <div className="space-y-2">
          {recipes.map((r) => (
            <div
              key={r.id}
              className="bg-card border border-border rounded-xl px-3 py-2.5 flex items-center justify-between"
            >
              <div>
                <div className="text-sm font-semibold">{r.name}</div>
                <div className="text-[10px] text-muted-foreground">
                  {r.kcal} kcal · P:{r.prot} G:{r.gluc} L:{r.lip} F:{r.fib} /100g
                </div>
              </div>
              <button
                onClick={() => handleDelete(r.id)}
                className="w-7 h-7 rounded-md text-destructive bg-destructive/10 text-xs font-bold active:scale-90 transition-transform"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
