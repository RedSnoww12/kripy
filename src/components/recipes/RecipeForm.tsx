import { useEffect, useState, type FormEvent } from 'react';
import { useNutritionStore } from '@/store/useNutritionStore';
import { toast } from '@/components/ui/toastStore';
import type { FoodTuple } from '@/types';
import type { EditingRecipe } from '@/pages/RecipesPage';

const INITIAL = {
  name: '',
  kcal: '',
  p: '',
  g: '',
  l: '',
  f: '',
  portionLabel: '',
  portionGrams: '',
};

type FormState = typeof INITIAL;

function parseNum(value: string): number {
  const n = parseFloat(value.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function tupleToForm(name: string, tuple: FoodTuple): FormState {
  const [kcal, p, g, l, f] = tuple;
  return {
    name,
    kcal: String(kcal),
    p: String(p),
    g: String(g),
    l: String(l),
    f: String(f),
    portionLabel: '',
    portionGrams: '',
  };
}

interface Props {
  editing: EditingRecipe | null;
  onDone: () => void;
}

export default function RecipeForm({ editing, onDone }: Props) {
  const recipes = useNutritionStore((s) => s.recipes);
  const setRecipes = useNutritionStore((s) => s.setRecipes);
  const recipePortions = useNutritionStore((s) => s.recipePortions);
  const setRecipePortions = useNutritionStore((s) => s.setRecipePortions);
  const [form, setForm] = useState<FormState>(INITIAL);

  useEffect(() => {
    if (editing) {
      const next = tupleToForm(editing.name, editing.tuple);
      const existing = recipePortions[editing.name]?.[0];
      if (existing) {
        next.portionLabel = existing.label;
        next.portionGrams = String(existing.grams);
      }
      setForm(next);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      setForm(INITIAL);
    }
  }, [editing, recipePortions]);

  const patch = (v: Partial<FormState>) =>
    setForm((state) => ({ ...state, ...v }));

  const reset = () => {
    setForm(INITIAL);
    onDone();
  };

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

    const portionLabel = form.portionLabel.trim();
    const portionGrams = parseNum(form.portionGrams);

    if (editing && editing.name !== name) {
      const next = { ...recipes };
      delete next[editing.name];
      next[name] = tuple;
      setRecipes(next);
      const nextPortions = { ...recipePortions };
      delete nextPortions[editing.name];
      if (portionLabel && portionGrams > 0) {
        nextPortions[name] = [{ label: portionLabel, grams: portionGrams }];
      }
      setRecipePortions(nextPortions);
    } else {
      setRecipes({ ...recipes, [name]: tuple });
      const nextPortions = { ...recipePortions };
      if (portionLabel && portionGrams > 0) {
        nextPortions[name] = [{ label: portionLabel, grams: portionGrams }];
      } else {
        delete nextPortions[name];
      }
      setRecipePortions(nextPortions);
    }

    toast(editing ? `${name} mise à jour` : `${name} enregistrée`, 'success');
    reset();
  };

  const isEditing = editing !== null;

  return (
    <section className="rcp-form">
      <h2 className="rcp-form-l">
        {isEditing ? 'Modifier la recette' : 'Nouvelle recette'}
      </h2>
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
      >
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
        <div className="rcp-grid">
          <div className="rcp-f">
            <label className="rcp-label" htmlFor="rcPortionLabel">
              Portion (optionnel)
            </label>
            <input
              id="rcPortionLabel"
              type="text"
              className="rcp-in"
              placeholder="ex : part, bol, œuf"
              value={form.portionLabel}
              onChange={(e) => patch({ portionLabel: e.target.value })}
            />
          </div>
          <div className="rcp-f">
            <label className="rcp-label" htmlFor="rcPortionGrams">
              Poids / portion (g)
            </label>
            <input
              id="rcPortionGrams"
              type="number"
              inputMode="decimal"
              className="rcp-in rcp-in-mono"
              placeholder="0"
              value={form.portionGrams}
              onChange={(e) => patch({ portionGrams: e.target.value })}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="submit"
            className="rcp-cta"
            style={{ flex: isEditing ? 2 : 1 }}
          >
            {isEditing ? 'Enregistrer' : 'Ajouter à la bibliothèque'}
          </button>
          {isEditing && (
            <button
              type="button"
              className="btn btn-o"
              onClick={reset}
              style={{ flex: 1 }}
            >
              Annuler
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
