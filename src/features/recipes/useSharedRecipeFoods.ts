import { useMemo } from 'react';
import { useSharedRecipesStore } from '@/store/useSharedRecipesStore';
import type { FoodsDict } from '@/types';
import { sharedRecipesToFoods } from './sharedRecipes';

/**
 * Recettes de la communauté sous forme de dictionnaire d'aliments, prêt à
 * être fusionné dans la recherche. Mémoïsé sur la liste du store pour éviter
 * de reconstruire l'objet à chaque frappe dans la barre de recherche.
 */
export function useSharedRecipeFoods(): FoodsDict {
  const recipes = useSharedRecipesStore((s) => s.recipes);
  return useMemo(() => sharedRecipesToFoods(recipes), [recipes]);
}
