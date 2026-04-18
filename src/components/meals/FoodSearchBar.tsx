import { useMemo, useState } from 'react';
import { searchFoods } from '@/features/nutrition/foodSearch';
import { useNutritionStore } from '@/store/useNutritionStore';
import type { FoodTuple } from '@/types';

interface Props {
  onSelect: (name: string, tuple: FoodTuple) => void;
}

export default function FoodSearchBar({ onSelect }: Props) {
  const recipes = useNutritionStore((s) => s.recipes);
  const barcodes = useNutritionStore((s) => s.barcodes);
  const [query, setQuery] = useState('');

  const results = useMemo(
    () => (query.trim() ? searchFoods(query, recipes, barcodes) : []),
    [query, recipes, barcodes],
  );

  const handlePick = (name: string, tuple: FoodTuple) => {
    onSelect(name, tuple);
    setQuery('');
  };

  return (
    <div className="meal-sw">
      <span className="material-symbols-outlined si">search</span>
      <input
        type="text"
        placeholder="Chercher un aliment…"
        autoComplete="off"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {results.length > 0 && (
        <div className="sr show">
          {results.map(({ name, tuple }) => (
            <div
              key={name}
              className="sri"
              onClick={() => handlePick(name, tuple)}
            >
              <span className="fn">{name}</span>
              <span className="fm mono">
                {tuple[0]}kcal · P{tuple[1]} G{tuple[2]} L{tuple[3]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
