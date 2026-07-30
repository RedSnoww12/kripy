import { create } from 'zustand';
import {
  fetchSharedRecipes,
  publishRecipe,
  unpublishRecipe,
  type PublishRecipeInput,
} from '@/features/recipes/sharedRecipes';
import { loadJSON, saveJSON, STORAGE_KEYS } from '@/lib/storage';
import type { SharedRecipe } from '@/types';

interface SharedRecipesState {
  recipes: SharedRecipe[];
  loading: boolean;
  /** Timestamp du dernier chargement réussi (ms epoch), 0 si jamais. */
  fetchedAt: number;
  refresh: () => Promise<void>;
  publish: (input: PublishRecipeInput) => Promise<boolean>;
  unpublish: (recipeId: string) => Promise<boolean>;
  rehydrate: () => void;
}

interface CachedPayload {
  recipes: SharedRecipe[];
  fetchedAt: number;
}

function readCache(): CachedPayload {
  const cached = loadJSON<CachedPayload | null>(
    STORAGE_KEYS.sharedRecipesCache,
    null,
  );
  if (!cached || !Array.isArray(cached.recipes)) {
    return { recipes: [], fetchedAt: 0 };
  }
  return {
    recipes: cached.recipes,
    fetchedAt: typeof cached.fetchedAt === 'number' ? cached.fetchedAt : 0,
  };
}

export const useSharedRecipesStore = create<SharedRecipesState>((set, get) => ({
  ...readCache(),
  loading: false,

  refresh: async () => {
    if (get().loading) return;
    set({ loading: true });
    const recipes = await fetchSharedRecipes();
    const fetchedAt = Date.now();
    // Une liste vide peut être un échec réseau : on conserve le cache
    // existant plutôt que de vider l'écran de l'utilisateur.
    if (recipes.length === 0 && get().recipes.length > 0) {
      set({ loading: false });
      return;
    }
    saveJSON(STORAGE_KEYS.sharedRecipesCache, { recipes, fetchedAt });
    set({ recipes, fetchedAt, loading: false });
  },

  publish: async (input) => {
    const id = await publishRecipe(input);
    if (!id) return false;
    const optimistic: SharedRecipe = {
      id,
      name: input.name,
      tuple: input.tuple,
      portions: input.portions,
      ...(input.unit ? { unit: input.unit } : {}),
      authorUid: input.authorUid,
      authorName: input.authorName,
      createdAt: Date.now(),
    };
    const recipes = [optimistic, ...get().recipes];
    saveJSON(STORAGE_KEYS.sharedRecipesCache, {
      recipes,
      fetchedAt: get().fetchedAt,
    });
    set({ recipes });
    return true;
  },

  unpublish: async (recipeId) => {
    const ok = await unpublishRecipe(recipeId);
    if (!ok) return false;
    const recipes = get().recipes.filter((r) => r.id !== recipeId);
    saveJSON(STORAGE_KEYS.sharedRecipesCache, {
      recipes,
      fetchedAt: get().fetchedAt,
    });
    set({ recipes });
    return true;
  },

  rehydrate: () => set(readCache()),
}));
