import { loadJSON, removeKey, saveJSON, STORAGE_KEYS } from '@/lib/storage';
import type { AiProvider } from './types';

/**
 * Fournisseur par défaut pour une nouvelle installation. Gemini offre un
 * généreux palier gratuit et un modèle nativement multimodal (texte + image),
 * d'où son choix comme valeur par défaut.
 */
export const DEFAULT_PROVIDER: AiProvider = 'gemini';

function readKey(provider: AiProvider): string {
  const key = provider === 'groq' ? STORAGE_KEYS.aiKey : STORAGE_KEYS.geminiKey;
  return loadJSON<string>(key, '').trim();
}

/**
 * Fournisseur actuellement sélectionné. Si l'utilisateur n'a jamais fait de
 * choix explicite, on déduit un défaut sensé : Groq si une clé Groq héritée
 * existe déjà (migration transparente des anciennes versions), sinon Gemini.
 */
export function getProvider(): AiProvider {
  const stored = loadJSON<string | null>(STORAGE_KEYS.aiProvider, null);
  if (stored === 'groq' || stored === 'gemini') return stored;
  return readKey('groq') ? 'groq' : DEFAULT_PROVIDER;
}

export function setProvider(provider: AiProvider): void {
  saveJSON(STORAGE_KEYS.aiProvider, provider);
}

export function getApiKey(provider: AiProvider): string {
  return readKey(provider);
}

export function setApiKey(provider: AiProvider, value: string): void {
  const key = provider === 'groq' ? STORAGE_KEYS.aiKey : STORAGE_KEYS.geminiKey;
  const trimmed = value.trim();
  if (trimmed) saveJSON(key, trimmed);
  else removeKey(key);
}

/**
 * Résout le couple { fournisseur, clé } à utiliser pour une requête. Si la clé
 * du fournisseur sélectionné est absente mais que l'autre fournisseur est
 * configuré, on bascule automatiquement dessus — l'analyse « marche » tant
 * qu'au moins une clé valide existe.
 */
export function getActiveConfig(): { provider: AiProvider; apiKey: string } {
  const selected = getProvider();
  const selectedKey = readKey(selected);
  if (selectedKey) return { provider: selected, apiKey: selectedKey };

  const other: AiProvider = selected === 'gemini' ? 'groq' : 'gemini';
  const otherKey = readKey(other);
  if (otherKey) return { provider: other, apiKey: otherKey };

  return { provider: selected, apiKey: '' };
}
