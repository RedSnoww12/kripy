import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  type Firestore,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type {
  FoodTuple,
  RecipeBaseUnit,
  RecipePortion,
  SharedRecipe,
} from '@/types';

export const SHARED_RECIPES_COLLECTION = 'sharedRecipes';

/** Plafond de lecture : au-delà, la recherche locale devient plus utile. */
const FETCH_LIMIT = 500;

export interface PublishRecipeInput {
  name: string;
  tuple: FoodTuple;
  portions: RecipePortion[];
  unit?: RecipeBaseUnit;
  authorUid: string;
  authorName: string | null;
}

function isFoodTuple(v: unknown): v is FoodTuple {
  return (
    Array.isArray(v) &&
    v.length === 5 &&
    v.every((n) => typeof n === 'number' && Number.isFinite(n))
  );
}

function sanitizePortions(v: unknown): RecipePortion[] {
  if (!Array.isArray(v)) return [];
  return v.flatMap((p): RecipePortion[] => {
    if (!p || typeof p !== 'object') return [];
    const rec = p as Record<string, unknown>;
    if (typeof rec.label !== 'string' || typeof rec.grams !== 'number') {
      return [];
    }
    if (!Number.isFinite(rec.grams) || rec.grams <= 0) return [];
    return [{ label: rec.label, grams: rec.grams }];
  });
}

function sanitizeUnit(v: unknown): RecipeBaseUnit | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const rec = v as Record<string, unknown>;
  if (typeof rec.label !== 'string' || !rec.label.trim()) return undefined;
  return { label: rec.label };
}

function toMillis(v: unknown): number {
  if (v instanceof Timestamp) return v.toMillis();
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  return 0;
}

/**
 * Convertit un document Firestore en SharedRecipe, ou null si la donnée est
 * inexploitable. Les documents viennent d'autres utilisateurs : on ne fait
 * jamais confiance à leur forme.
 */
export function parseSharedRecipe(
  id: string,
  data: Record<string, unknown>,
): SharedRecipe | null {
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  if (!name) return null;
  if (!isFoodTuple(data.tuple)) return null;
  if (typeof data.authorUid !== 'string' || !data.authorUid) return null;

  const unit = sanitizeUnit(data.unit);
  return {
    id,
    name,
    tuple: data.tuple,
    portions: sanitizePortions(data.portions),
    ...(unit ? { unit } : {}),
    authorUid: data.authorUid,
    authorName:
      typeof data.authorName === 'string' && data.authorName.trim()
        ? data.authorName
        : null,
    createdAt: toMillis(data.createdAt),
  };
}

/** Publie une recette dans la bibliothèque commune. Renvoie l'id créé. */
export async function publishRecipe(
  input: PublishRecipeInput,
  firestore: Firestore | null = db,
): Promise<string | null> {
  const database = firestore ?? db;
  if (!database) return null;
  try {
    const ref = await addDoc(collection(database, SHARED_RECIPES_COLLECTION), {
      name: input.name,
      tuple: input.tuple,
      portions: input.portions,
      ...(input.unit ? { unit: input.unit } : {}),
      authorUid: input.authorUid,
      authorName: input.authorName,
      createdAt: serverTimestamp(),
    });
    return ref.id;
  } catch (e) {
    console.warn('publishRecipe failed', e);
    return null;
  }
}

/**
 * Met à jour une recette déjà publiée (l'auteur a modifié sa version perso).
 * Les règles Firestore réservent l'écriture à l'auteur : l'appel échoue
 * proprement si quelqu'un d'autre tente la manœuvre.
 */
export async function updateSharedRecipe(
  recipeId: string,
  input: PublishRecipeInput,
  firestore: Firestore | null = db,
): Promise<boolean> {
  const database = firestore ?? db;
  if (!database) return false;
  try {
    await updateDoc(doc(database, SHARED_RECIPES_COLLECTION, recipeId), {
      name: input.name,
      tuple: input.tuple,
      portions: input.portions,
      // `unit` doit être effacé quand la recette repasse aux 100g, sinon le
      // document garderait une unité fantôme.
      unit: input.unit ?? null,
      authorUid: input.authorUid,
      authorName: input.authorName,
    });
    return true;
  } catch (e) {
    console.warn('updateSharedRecipe failed', e);
    return false;
  }
}

/** Récupère les recettes de la communauté, les plus récentes d'abord. */
export async function fetchSharedRecipes(
  firestore: Firestore | null = db,
): Promise<SharedRecipe[]> {
  const database = firestore ?? db;
  if (!database) return [];
  try {
    const snap = await getDocs(
      query(
        collection(database, SHARED_RECIPES_COLLECTION),
        orderBy('createdAt', 'desc'),
        limit(FETCH_LIMIT),
      ),
    );
    return snap.docs.flatMap((d) => {
      const parsed = parseSharedRecipe(
        d.id,
        d.data() as Record<string, unknown>,
      );
      return parsed ? [parsed] : [];
    });
  } catch (e) {
    console.warn('fetchSharedRecipes failed', e);
    return [];
  }
}

/**
 * Retire une recette publiée. Les règles Firestore n'autorisent la
 * suppression qu'à l'auteur du document ; l'appel échoue proprement sinon.
 */
export async function unpublishRecipe(
  recipeId: string,
  firestore: Firestore | null = db,
): Promise<boolean> {
  const database = firestore ?? db;
  if (!database) return false;
  try {
    await deleteDoc(doc(database, SHARED_RECIPES_COLLECTION, recipeId));
    return true;
  } catch (e) {
    console.warn('unpublishRecipe failed', e);
    return false;
  }
}

/**
 * Convertit les recettes communautaires en dictionnaire d'aliments
 * consommable par la recherche. En cas de doublon de nom, la plus récente
 * gagne (les documents arrivent déjà triés du plus récent au plus ancien).
 */
export function sharedRecipesToFoods(
  recipes: readonly SharedRecipe[],
): Record<string, FoodTuple> {
  const out: Record<string, FoodTuple> = {};
  for (let i = recipes.length - 1; i >= 0; i--) {
    out[recipes[i].name] = recipes[i].tuple;
  }
  return out;
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Retrouve la publication correspondant à une recette perso de l'utilisateur.
 * Le rapprochement se fait par nom : c'est la clé primaire des recettes
 * locales (`recipes` est un dictionnaire nom → tuple), donc le seul lien
 * stable entre la version perso et la version publiée.
 */
export function findPublishedRecipe(
  recipes: readonly SharedRecipe[],
  authorUid: string | null | undefined,
  name: string,
): SharedRecipe | null {
  if (!authorUid) return null;
  const target = normalize(name.trim());
  if (!target) return null;
  return (
    recipes.find(
      (r) => r.authorUid === authorUid && normalize(r.name) === target,
    ) ?? null
  );
}

/**
 * Recherche dans la bibliothèque publique, insensible aux accents et à la
 * casse. Tous les mots de la requête doivent apparaître dans le nom de la
 * recette ou dans le pseudo de l'auteur.
 */
export function searchSharedRecipes(
  recipes: readonly SharedRecipe[],
  queryText: string,
): SharedRecipe[] {
  const tokens = normalize(queryText.trim()).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [...recipes];
  return recipes.filter((r) => {
    const haystack = normalize(`${r.name} ${r.authorName ?? ''}`);
    return tokens.every((t) => haystack.includes(t));
  });
}
