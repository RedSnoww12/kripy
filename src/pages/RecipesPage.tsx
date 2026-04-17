import RecipeForm from '@/components/recipes/RecipeForm';
import RecipeList from '@/components/recipes/RecipeList';

export default function RecipesPage() {
  return (
    <div className="tp active">
      <section className="rcp-head">
        <h1 className="rcp-title">Mes recettes</h1>
        <p className="rcp-sub">
          Gère ta bibliothèque nutritionnelle de précision. Les recettes
          apparaissent dans la recherche des repas.
        </p>
      </section>
      <RecipeForm />
      <RecipeList />
    </div>
  );
}
