import { useEffect, useState, type FormEvent } from 'react';
import { useNutritionStore } from '@/store/useNutritionStore';
import { toast } from '@/components/ui/toastStore';
import type { FoodTuple, RecipePortion } from '@/types';
import type { EditingRecipe } from '@/pages/RecipesPage';

interface PortionInput {
  label: string;
  grams: string;
}

interface FormState {
  name: string;
  kcal: string;
  p: string;
  g: string;
  l: string;
  f: string;
  portions: PortionInput[];
}

const EMPTY_PORTION: PortionInput = { label: '', grams: '' };

const INITIAL: FormState = {
  name: '',
  kcal: '',
  p: '',
  g: '',
  l: '',
  f: '',
  portions: [{ ...EMPTY_PORTION }],
};

function parseNum(value: string): number {
  const n = parseFloat(value.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function tupleToForm(
  name: string,
  tuple: FoodTuple,
  portions: RecipePortion[] | undefined,
): FormState {
  const [kcal, p, g, l, f] = tuple;
  const portionInputs: PortionInput[] =
    portions && portions.length > 0
      ? portions.map((p) => ({ label: p.label, grams: String(p.grams) }))
      : [{ ...EMPTY_PORTION }];
  return {
    name,
    kcal: String(kcal),
    p: String(p),
    g: String(g),
    l: String(l),
    f: String(f),
    portions: portionInputs,
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
      setForm(tupleToForm(editing.name, editing.tuple, recipePortions[editing.name]));
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      setForm(INITIAL);
    }
  }, [editing, recipePortions]);

  const patch = (v: Partial<FormState>) =>
    setForm((state) => ({ ...state, ...v }));

  const updatePortion = (idx: number, patch: Partial<PortionInput>) => {
    setForm((state) => {
      const next = [...state.portions];
      next[idx] = { ...next[idx], ...patch };
      return { ...state, portions: next };
    });
  };

  const addPortion = () => {
    setForm((state) => ({
      ...state,
      portions: [...state.portions, { ...EMPTY_PORTION }],
    }));
  };

  const removePortion = (idx: number) => {
    setForm((state) => {
      const next = state.portions.filter((_, i) => i !== idx);
      return {
        ...state,
        portions: next.length > 0 ? next : [{ ...EMPTY_PORTION }],
      };
    });
  };

  const reset = () => {
    setForm(INITIAL);
    onDone();
  };

  const collectPortions = (): RecipePortion[] => {
    return form.portions
      .map((p) => ({ label: p.label.trim(), grams: parseNum(p.grams) }))
      .filter((p) => p.label && p.grams > 0);
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
    const portions = collectPortions();

    if (editing && editing.name !== name) {
      const next = { ...recipes };
      delete next[editing.name];
      next[name] = tuple;
      setRecipes(next);
      const nextPortions = { ...recipePortions };
      delete nextPortions[editing.name];
      if (portions.length > 0) nextPortions[name] = portions;
      setRecipePortions(nextPortions);
    } else {
      setRecipes({ ...recipes, [name]: tuple });
      const nextPortions = { ...recipePortions };
      if (portions.length > 0) nextPortions[name] = portions;
      else delete nextPortions[name];
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

        <div className="rcp-f">
          <label className="rcp-label">Portions (optionnel)</label>
          {form.portions.map((portion, idx) => (
            <div key={idx} className="rcp-portion-row">
              <input
                type="text"
                className="rcp-in"
                placeholder="ex : part, bol, œuf"
                value={portion.label}
                onChange={(e) =>
                  updatePortion(idx, { label: e.target.value })
                }
              />
              <input
                type="number"
                inputMode="decimal"
                className="rcp-in rcp-in-mono"
                placeholder="g"
                value={portion.grams}
                onChange={(e) =>
                  updatePortion(idx, { grams: e.target.value })
                }
              />
              <button
                type="button"
                className="rcp-portion-del"
                aria-label="Supprimer la portion"
                onClick={() => removePortion(idx)}
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            className="rcp-portion-add"
            onClick={addPortion}
          >
            + Ajouter une portion
          </button>
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
