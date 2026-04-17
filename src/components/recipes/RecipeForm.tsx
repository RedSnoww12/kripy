import { useState, type FormEvent } from 'react';
import { useNutritionStore } from '@/store/useNutritionStore';
import { toast } from '@/components/ui/toastStore';
import type { FoodTuple } from '@/types';

const INITIAL = {
  name: '',
  kcal: '',
  p: '',
  g: '',
  l: '',
  f: '',
};

function parseNum(value: string): number {
  const n = parseFloat(value.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

export default function RecipeForm() {
  const recipes = useNutritionStore((s) => s.recipes);
  const setRecipes = useNutritionStore((s) => s.setRecipes);
  const [form, setForm] = useState(INITIAL);

  const patch = (v: Partial<typeof INITIAL>) =>
    setForm((state) => ({ ...state, ...v }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) {
      toast('Nom requis', 'error');
      return;
    }
    const kcal = parseNum(form.kcal);
    const p = parseNum(form.p);
    const g = parseNum(form.g);
    const l = parseNum(form.l);
    const f = parseNum(form.f);

    if (kcal <= 0 && p <= 0 && g <= 0 && l <= 0) {
      toast('Renseigne au moins les kcal ou des macros', 'error');
      return;
    }

    const tuple: FoodTuple = [kcal, p, g, l, f];
    setRecipes({ ...recipes, [name]: tuple });
    setForm(INITIAL);
    toast(`${name} enregistrée`, 'success');
  };

  return (
    <section className="rcp-form">
      <h2 className="rcp-form-l">Nouvelle recette</h2>
      <form onSubmit={handleSubmit}>
        <div className="rcp-f">
          <label className="rcp-label" htmlFor="rcName">
            Nom de la recette
          </label>
          <input
            id="rcName"
            type="text"
            className="rcp-in"
            placeholder="ex : Poulet Curry Keto"
            value={form.name}
            onChange={(e) => patch({ name: e.target.value })}
          />
        </div>
        <div className="rcp-f">
          <label className="rcp-label" htmlFor="rcKcal">
            Kcal / 100g
          </label>
          <input
            id="rcKcal"
            type="number"
            inputMode="numeric"
            className="rcp-in rcp-in-mono"
            placeholder="0"
            value={form.kcal}
            onChange={(e) => patch({ kcal: e.target.value })}
          />
        </div>
        <div className="rcp-grid">
          <div className="rcp-f">
            <label className="rcp-label" htmlFor="rcProt">
              P (g)
            </label>
            <input
              id="rcProt"
              type="number"
              inputMode="decimal"
              className="rcp-in rcp-in-mono"
              placeholder="0.0"
              value={form.p}
              onChange={(e) => patch({ p: e.target.value })}
            />
          </div>
          <div className="rcp-f">
            <label className="rcp-label" htmlFor="rcGluc">
              G (g)
            </label>
            <input
              id="rcGluc"
              type="number"
              inputMode="decimal"
              className="rcp-in rcp-in-mono"
              placeholder="0.0"
              value={form.g}
              onChange={(e) => patch({ g: e.target.value })}
            />
          </div>
          <div className="rcp-f">
            <label className="rcp-label" htmlFor="rcLip">
              L (g)
            </label>
            <input
              id="rcLip"
              type="number"
              inputMode="decimal"
              className="rcp-in rcp-in-mono"
              placeholder="0.0"
              value={form.l}
              onChange={(e) => patch({ l: e.target.value })}
            />
          </div>
          <div className="rcp-f">
            <label className="rcp-label" htmlFor="rcFib">
              F (g)
            </label>
            <input
              id="rcFib"
              type="number"
              inputMode="decimal"
              className="rcp-in rcp-in-mono"
              placeholder="0.0"
              value={form.f}
              onChange={(e) => patch({ f: e.target.value })}
            />
          </div>
        </div>
        <button type="submit" className="rcp-cta">
          Ajouter à la bibliothèque
        </button>
      </form>
    </section>
  );
}
