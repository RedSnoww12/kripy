import { useEffect, useMemo, useState } from 'react';
import EmptyState from '@/components/ui/EmptyState';
import QuantityModal from '@/components/meals/QuantityModal';
import { toast } from '@/components/ui/toastStore';
import { searchSharedRecipes } from '@/features/recipes/sharedRecipes';
import { computeMealEntry, type Basis } from '@/features/nutrition/foodSearch';
import { isFirebaseConfigured } from '@/lib/firebase';
import { currentMealSlot, todayISO } from '@/lib/date';
import { useNutritionStore } from '@/store/useNutritionStore';
import { useSessionStore } from '@/store/useSessionStore';
import { useSharedRecipesStore } from '@/store/useSharedRecipesStore';
import type { MealEntryUnit, MealSlot, SharedRecipe } from '@/types';
import styles from './PublicRecipeBrowser.module.css';

const STALE_AFTER_MS = 10 * 60 * 1000;

export default function PublicRecipeBrowser() {
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
  const addMealEntry = useNutritionStore((s) => s.addMealEntry);
  const pushRecent = useNutritionStore((s) => s.pushRecent);

  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState<SharedRecipe | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    if (Date.now() - fetchedAt < STALE_AFTER_MS) return;
    void refresh();
    // fetchedAt hors des deps : un seul déclenchement au montage, sinon
    // chaque mise à jour du cache relancerait un fetch en boucle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  const visible = useMemo(
    () => searchSharedRecipes(shared, query),
    [shared, query],
  );

  /**
   * Ajout direct au journal du jour : la recette publique reste en lecture
   * seule, on ne recopie rien dans la bibliothèque perso de l'utilisateur.
   */
  const confirmAdd = (qty: number, unit?: MealEntryUnit, slot?: MealSlot) => {
    if (!adding) return;
    const basis: Basis = adding.unit
      ? { kind: 'perUnit', label: adding.unit.label }
      : { kind: 'per100g' };
    const entry = computeMealEntry(
      adding.name,
      adding.tuple,
      qty,
      slot ?? currentMealSlot(),
      unit,
      basis,
    );
    addMealEntry(todayISO(), entry);
    pushRecent(adding.name);
    toast(`${adding.name} ajoutée à ton repas`, 'success');
    setAdding(null);
  };

  /** Copie éditable dans la bibliothèque perso (la publique reste intacte). */
  const copyToMine = (recipe: SharedRecipe) => {
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
        ? `${recipe.name} mise à jour dans tes recettes`
        : `${recipe.name} copiée dans tes recettes`,
      'success',
    );
  };

  const handleUnpublish = async (recipe: SharedRecipe) => {
    const ok = await unpublish(recipe.id);
    toast(
      ok ? `${recipe.name} repassée en privé` : 'Retrait impossible',
      ok ? 'success' : 'error',
    );
  };

  if (!isFirebaseConfigured) {
    return (
      <div className={styles.notice}>
        Les recettes publiques nécessitent une connexion au cloud (Firebase non
        configuré).
      </div>
    );
  }

  return (
    <section className={styles.wrap}>
      <div className={styles.head}>
        <div>
          <p className={styles.intro}>
            Les recettes publiées par la communauté. Tu peux les ajouter à tes
            repas telles quelles — seul leur auteur peut les modifier.
          </p>
          <span className={styles.count}>
            {visible.length}
            {query ? ` / ${shared.length}` : ''}{' '}
            {visible.length === 1 ? 'recette' : 'recettes'}
          </span>
        </div>
        <button
          type="button"
          className={styles.refresh}
          onClick={() => void refresh()}
          disabled={loading}
          aria-label="Rafraîchir les recettes publiques"
        >
          <span className="material-symbols-outlined" aria-hidden>
            refresh
          </span>
        </button>
      </div>

      <div className="meal-sw">
        <span className="material-symbols-outlined si">search</span>
        <input
          type="text"
          inputMode="search"
          placeholder="Chercher une recette ou un auteur…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Rechercher dans les recettes publiques"
        />
      </div>

      {loading && shared.length === 0 ? (
        <div className={styles.notice}>Chargement des recettes publiques…</div>
      ) : shared.length === 0 ? (
        <EmptyState
          icon="public"
          title="Aucune recette publique pour l'instant"
          subtitle="Sois le premier : crée une recette et coche « Rendre la recette publique »."
        />
      ) : visible.length === 0 ? (
        <div className={styles.notice}>Aucun résultat pour « {query} »</div>
      ) : (
        <div className={styles.list}>
          {visible.map((recipe) => {
            const mine = !!user && user.uid === recipe.authorUid;
            const [kcal, p, g, l] = recipe.tuple;
            const basis = recipe.unit ? `/ ${recipe.unit.label}` : '/ 100g';
            return (
              <article key={recipe.id} className={styles.item}>
                <div className={styles.body}>
                  <div className={styles.nameRow}>
                    <span className={styles.name}>{recipe.name}</span>
                    <span
                      className={`${styles.badge}${mine ? ` ${styles.badgeMine}` : ''}`}
                    >
                      {mine ? 'Ta recette' : 'Lecture seule'}
                    </span>
                  </div>
                  <span className={styles.macros}>
                    {kcal} kcal {basis} · P{p} G{g} L{l}
                  </span>
                  <span className={styles.author}>
                    Par {mine ? 'toi' : (recipe.authorName ?? 'Anonyme')}
                  </span>
                </div>
                <div className={styles.acts}>
                  <button
                    type="button"
                    className={styles.add}
                    onClick={() => setAdding(recipe)}
                  >
                    <span className="material-symbols-outlined" aria-hidden>
                      add
                    </span>
                    Ajouter au repas
                  </button>
                  <button
                    type="button"
                    className={styles.copy}
                    onClick={() => copyToMine(recipe)}
                    aria-label={`Copier ${recipe.name} dans mes recettes`}
                  >
                    Copier
                  </button>
                  {mine && (
                    <button
                      type="button"
                      className={styles.remove}
                      onClick={() => void handleUnpublish(recipe)}
                      aria-label={`Retirer ${recipe.name} des recettes publiques`}
                    >
                      <span className="material-symbols-outlined" aria-hidden>
                        public_off
                      </span>
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <QuantityModal
        open={adding !== null}
        food={adding?.name ?? null}
        tuple={adding?.tuple ?? null}
        initialSlot={currentMealSlot()}
        extraUnits={adding?.portions}
        baseUnit={adding?.unit}
        onClose={() => setAdding(null)}
        onConfirm={confirmAdd}
      />
    </section>
  );
}
