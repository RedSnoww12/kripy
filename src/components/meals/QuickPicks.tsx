import { useMemo } from 'react';
import { useNutritionStore } from '@/store/useNutritionStore';
import { getAllFoods } from '@/features/nutrition/foodSearch';
import type { FoodTuple } from '@/types';

interface Props {
  onSelect: (name: string, tuple: FoodTuple) => void;
}

const MAX_CHIPS = 6;

export default function QuickPicks({ onSelect }: Props) {
  const favs = useNutritionStore((s) => s.favs);
  const recent = useNutritionStore((s) => s.recent);
  const recipes = useNutritionStore((s) => s.recipes);
  const barcodes = useNutritionStore((s) => s.barcodes);

  const picks = useMemo(() => {
    const merged = Array.from(new Set([...favs, ...recent])).slice(
      0,
      MAX_CHIPS,
    );
    const foods = getAllFoods(recipes, barcodes);
    return merged
      .map((name) => ({ name, tuple: foods[name] }))
      .filter((p): p is { name: string; tuple: FoodTuple } => Boolean(p.tuple));
  }, [favs, recent, recipes, barcodes]);

  if (picks.length === 0) return null;

  const hasFavs = favs.length > 0;
  const rightLabel = hasFavs ? 'Favoris' : 'Récents';

  return (
    <section className="meal-qp">
      <header className="meal-sh">
        <span className="meal-sh-l">
          <span className="meal-sh-dash" />
          Accès rapide
        </span>
        <span className="meal-sh-r">{rightLabel}</span>
      </header>
      <div className="meal-qp-grid">
        {picks.map(({ name, tuple }) => (
          <button
            key={name}
            type="button"
            className="meal-qp-card"
            onClick={() => onSelect(name, tuple)}
          >
            <span className="meal-qp-ico material-symbols-outlined">
              restaurant
            </span>
            <span className="meal-qp-n">{name}</span>
            <span className="meal-qp-m mono">
              {tuple[0]}
              <span className="meal-qp-u">kcal/100g</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
