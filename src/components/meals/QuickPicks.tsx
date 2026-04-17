import { useMemo } from 'react';
import { useNutritionStore } from '@/store/useNutritionStore';
import { getAllFoods } from '@/features/nutrition/foodSearch';
import type { FoodTuple } from '@/types';

interface Props {
  onSelect: (name: string, tuple: FoodTuple) => void;
}

const MAX_CHIPS = 12;

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

  return (
    <div className="fav-s meal-fav-s">
      {picks.map(({ name, tuple }) => (
        <div key={name} className="fav-c" onClick={() => onSelect(name, tuple)}>
          {name}
        </div>
      ))}
    </div>
  );
}
