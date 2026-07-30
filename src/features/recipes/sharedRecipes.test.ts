import { describe, expect, it } from 'vitest';
import { Timestamp } from 'firebase/firestore';
import type { SharedRecipe } from '@/types';
import { parseSharedRecipe, sharedRecipesToFoods } from './sharedRecipes';

const valid = {
  name: 'Poulet curry keto',
  tuple: [180, 20, 4, 9, 1],
  portions: [{ label: 'part', grams: 250 }],
  authorUid: 'uid_1',
  authorName: 'Alex',
  createdAt: Timestamp.fromMillis(1_700_000_000_000),
};

describe('parseSharedRecipe', () => {
  it('parse un document valide', () => {
    const r = parseSharedRecipe('doc1', valid);
    expect(r).toEqual({
      id: 'doc1',
      name: 'Poulet curry keto',
      tuple: [180, 20, 4, 9, 1],
      portions: [{ label: 'part', grams: 250 }],
      authorUid: 'uid_1',
      authorName: 'Alex',
      createdAt: 1_700_000_000_000,
    });
  });

  it('accepte une recette à l’unité', () => {
    const r = parseSharedRecipe('doc2', {
      ...valid,
      unit: { label: 'burger' },
      portions: [],
    });
    expect(r?.unit).toEqual({ label: 'burger' });
    expect(r?.portions).toEqual([]);
  });

  it('rejette un document sans nom, sans tuple valide ou sans auteur', () => {
    expect(parseSharedRecipe('x', { ...valid, name: '   ' })).toBeNull();
    expect(parseSharedRecipe('x', { ...valid, tuple: [1, 2, 3] })).toBeNull();
    expect(
      parseSharedRecipe('x', { ...valid, tuple: [1, 2, 3, 4, 'x'] }),
    ).toBeNull();
    expect(parseSharedRecipe('x', { ...valid, authorUid: '' })).toBeNull();
  });

  it('nettoie les portions invalides sans jeter la recette', () => {
    const r = parseSharedRecipe('doc3', {
      ...valid,
      portions: [
        { label: 'part', grams: 250 },
        { label: 'vide', grams: 0 },
        { label: 'négatif', grams: -5 },
        { grams: 100 },
        'garbage',
        null,
      ],
    });
    expect(r?.portions).toEqual([{ label: 'part', grams: 250 }]);
  });

  it('normalise un auteur anonyme et une date manquante', () => {
    const r = parseSharedRecipe('doc4', {
      ...valid,
      authorName: '   ',
      createdAt: undefined,
    });
    expect(r?.authorName).toBeNull();
    expect(r?.createdAt).toBe(0);
  });

  it('ignore une unité mal formée', () => {
    const r = parseSharedRecipe('doc5', { ...valid, unit: { label: '  ' } });
    expect(r?.unit).toBeUndefined();
  });
});

describe('sharedRecipesToFoods', () => {
  function recipe(id: string, name: string, kcal: number): SharedRecipe {
    return {
      id,
      name,
      tuple: [kcal, 0, 0, 0, 0],
      portions: [],
      authorUid: 'uid',
      authorName: null,
      createdAt: 0,
    };
  }

  it('convertit en dictionnaire nom → tuple', () => {
    const foods = sharedRecipesToFoods([
      recipe('1', 'Curry', 180),
      recipe('2', 'Chili', 150),
    ]);
    expect(foods).toEqual({
      Curry: [180, 0, 0, 0, 0],
      Chili: [150, 0, 0, 0, 0],
    });
  });

  it('en cas de doublon de nom, la plus récente (première) gagne', () => {
    // La liste arrive triée du plus récent au plus ancien
    const foods = sharedRecipesToFoods([
      recipe('recent', 'Curry', 200),
      recipe('ancien', 'Curry', 100),
    ]);
    expect(foods.Curry).toEqual([200, 0, 0, 0, 0]);
  });

  it('renvoie un objet vide sans recette', () => {
    expect(sharedRecipesToFoods([])).toEqual({});
  });
});
