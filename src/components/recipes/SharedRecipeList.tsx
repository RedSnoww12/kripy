import { useEffect, useMemo, useState } from 'react';
import EmptyState from '@/components/ui/EmptyState';
import { toast } from '@/components/ui/toastStore';
import { isFirebaseConfigured } from '@/lib/firebase';
import { useNutritionStore } from '@/store/useNutritionStore';
import { useSessionStore } from '@/store/useSessionStore';
import { useSharedRecipesStore } from '@/store/useSharedRecipesStore';
import type { SharedRecipe } from '@/types';

const STALE_AFTER_MS = 10 * 60 * 1000;

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export default function SharedRecipeList() {
  const shared = useSharedRecipesStore((s) => s.recipes);
  const loading = useSharedRecipesStore((s) => s.loading);
  const fetchedAt = useSharedRecipesStore((s) => s.fetchedAt);
  const refresh = useSharedRecipesStore((s) => s.refresh);
  const unpublish = useSharedRecipesStore((s) => s.unpublish);
  const user = useSessionStore((s) => s.user);

  const recipes = useNutritionStore((s) => s.recipes);
  const setRecipes = useNutritionStore((s) => s.setRecipes);
  const recipePortions = useNutritionStore((s) => s.recipePortions);
  const setRecipePortions = useNutritionStore((s) => s.setRecipePortions);
  const recipeUnits = useNutritionStore((s) => s.recipeUnits);
  const setRecipeUnits = useNutritionStore((s) => s.setRecipeUnits);

  const [query, setQuery] = useState('');

  // Premier chargement (ou cache périmé) au montage de l'onglet Recettes.
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    if (Date.now() - fetchedAt < STALE_AFTER_MS) return;
    void refresh();
    // fetchedAt volontairement hors des deps : on ne veut qu'un seul
    // déclenchement au montage, pas une boucle après chaque mise à jour.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  const visible = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return shared;
    return shared.filter((r) => normalize(r.name).includes(q));
  }, [shared, query]);

  const importRecipe = (recipe: SharedRecipe) => {
    const alreadyOwned = recipe.name in recipes;
    setRecipes({ ...recipes, [recipe.name]: recipe.tuple });

    const nextPortions = { ...recipePortions };
    if (recipe.portions.length > 0) nextPortions[recipe.name] = recipe.portions;
    else delete nextPortions[recipe.name];
    setRecipePortions(nextPortions);

    const nextUnits = { ...recipeUnits };
    if (recipe.unit) nextUnits[recipe.name] = recipe.unit;
    else delete nextUnits[recipe.name];
    setRecipeUnits(nextUnits);

    toast(
      alreadyOwned
        ? `${recipe.name} mise à jour depuis la communauté`
        : `${recipe.name} ajoutée à tes recettes`,
      'success',
    );
  };

  const handleUnpublish = async (recipe: SharedRecipe) => {
    const ok = await unpublish(recipe.id);
    toast(
      ok ? `${recipe.name} retirée du partage` : 'Retrait impossible',
      ok ? 'success' : 'error',
    );
  };

  if (!isFirebaseConfigured) return null;

  return (
    <section className="rcp-shared">
      <div className="rcp-shared-head">
        <div>
          <h2 className="rcp-form-l">Recettes de la communauté</h2>
          <p className="rcp-shared-sub">
            Publiées par les autres utilisateurs. Elles apparaissent déjà dans
            la recherche des repas — importe-les pour les modifier.
          </p>
        </div>
        <button
          type="button"
          className="rcp-shared-refresh"
          onClick={() => void refresh()}
          disabled={loading}
          aria-label="Rafraîchir les recettes de la communauté"
        >
          <span className="material-symbols-outlined" aria-hidden>
            refresh
          </span>
        </button>
      </div>

      {shared.length > 0 && (
        <input
          type="text"
          className="rcp-in rcp-shared-search"
          placeholder="Chercher dans la communauté…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      )}

      {loading && shared.length === 0 ? (
        <div className="rcp-shared-loading">Chargement des recettes…</div>
      ) : shared.length === 0 ? (
        <EmptyState
          icon="groups"
          title="Aucune recette partagée pour l'instant"
          subtitle="Sois le premier : crée une recette et coche « Partager avec la communauté »."
        />
      ) : visible.length === 0 ? (
        <div className="rcp-shared-loading">
          Aucun résultat pour « {query} »
        </div>
      ) : (
        <div className="rcp-shared-list">
          {visible.map((recipe) => {
            const mine = user?.uid === recipe.authorUid;
            const [kcal, p, g, l] = recipe.tuple;
            const basis = recipe.unit ? `/ ${recipe.unit.label}` : '/ 100g';
            return (
              <div key={recipe.id} className="rcp-shared-item">
                <div className="rcp-shared-item-body">
                  <span className="rcp-shared-item-name">{recipe.name}</span>
                  <span className="rcp-shared-item-macros mono">
                    {kcal} kcal {basis} · P{p} G{g} L{l}
                  </span>
                  <span className="rcp-shared-item-author">
                    {mine ? 'Toi' : (recipe.authorName ?? 'Anonyme')}
                  </span>
                </div>
                <div className="rcp-shared-item-acts">
                  <button
                    type="button"
                    className="rcp-shared-import"
                    onClick={() => importRecipe(recipe)}
                  >
                    Importer
                  </button>
                  {mine && (
                    <button
                      type="button"
                      className="rcp-shared-remove"
                      onClick={() => void handleUnpublish(recipe)}
                      aria-label={`Retirer ${recipe.name} du partage`}
                    >
                      <span className="material-symbols-outlined" aria-hidden>
                        delete
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
