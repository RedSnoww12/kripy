import { useState } from 'react';
import RecipeForm from '@/components/recipes/RecipeForm';
import RecipeList from '@/components/recipes/RecipeList';
import type { FoodTuple } from '@/types';

export interface EditingRecipe {
  name: string;
  tuple: FoodTuple;
}

export default function RecipesPage() {
  const [editing, setEditing] = useState<EditingRecipe | null>(null);

  return (
    <div className="tp active">
      <section className="rcp-head">
        <h1 className="rcp-title">Mes recettes</h1>
        <p className="rcp-sub">
          Gère ta bibliothèque nutritionnelle de précision. Les recettes
          apparaissent dans la recherche des repas.
        </p>
      </section>
      <RecipeForm editing={editing} onDone={() => setEditing(null)} />
      <RecipeList onEdit={(name, tuple) => setEditing({ name, tuple })} />
    </div>
  );
}
