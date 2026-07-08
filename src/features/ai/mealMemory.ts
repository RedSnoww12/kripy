import { loadJSON, saveJSON, STORAGE_KEYS } from '@/lib/storage';
import type { AiMealResult } from './types';

const MAX_ENTRIES = 200;

interface MealMemoryEntry {
  result: AiMealResult;
  count: number;
  lastUsedISO: string;
}

type MealMemory = Record<string, MealMemoryEntry>;

/**
 * Normalise une description de repas pour servir de clé de mémoire :
 * insensible à la casse, aux accents et aux espaces superflus. Deux
 * descriptions qui ne diffèrent que par la ponctuation ou la casse pointent
 * donc vers le même repas mémorisé.
 */
export function normalizeMealKey(description: string): string {
  return description
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function readMemory(): MealMemory {
  return loadJSON<MealMemory>(STORAGE_KEYS.aiMealMemory, {});
}

function pruneIfNeeded(memory: MealMemory): MealMemory {
  const keys = Object.keys(memory);
  if (keys.length <= MAX_ENTRIES) return memory;
  const sorted = keys.sort((a, b) =>
    memory[a].lastUsedISO.localeCompare(memory[b].lastUsedISO),
  );
  const toDrop = sorted.slice(0, keys.length - MAX_ENTRIES);
  const pruned = { ...memory };
  for (const k of toDrop) delete pruned[k];
  return pruned;
}

/**
 * Cherche un repas déjà décrit et validé avec ce texte exact (normalisé).
 * Renvoie null si ce repas n'a jamais été confirmé.
 */
export function recallMeal(description: string): AiMealResult | null {
  const key = normalizeMealKey(description);
  if (!key) return null;
  const entry = readMemory()[key];
  return entry ? { ...entry.result, fromMemory: true } : null;
}

/**
 * Mémorise (ou met à jour) les valeurs validées par l'utilisateur pour cette
 * description, afin de les réutiliser directement la prochaine fois plutôt
 * que de solliciter l'IA à nouveau.
 */
export function rememberMeal(description: string, result: AiMealResult): void {
  const key = normalizeMealKey(description);
  if (!key) return;
  const memory = readMemory();
  const previous = memory[key];
  const { fromMemory: _fromMemory, ...cleanResult } = result;
  const next: MealMemory = {
    ...memory,
    [key]: {
      result: cleanResult,
      count: (previous?.count ?? 0) + 1,
      lastUsedISO: new Date().toISOString(),
    },
  };
  saveJSON(STORAGE_KEYS.aiMealMemory, pruneIfNeeded(next));
}

/** Nombre de fois où ce repas a déjà été validé (0 si jamais vu). */
export function mealUseCount(description: string): number {
  const key = normalizeMealKey(description);
  if (!key) return 0;
  return readMemory()[key]?.count ?? 0;
}

export function forgetMeal(description: string): void {
  const key = normalizeMealKey(description);
  const memory = readMemory();
  if (!(key in memory)) return;
  const next = { ...memory };
  delete next[key];
  saveJSON(STORAGE_KEYS.aiMealMemory, next);
}
