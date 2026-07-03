/**
 * Types et utilitaires partagés par tous les fournisseurs d'IA (Groq, Gemini).
 * Ce module est volontairement pur (aucun accès réseau ni localStorage) afin de
 * rester testable et sans dépendance circulaire avec `config.ts`.
 */

export type AiProvider = 'gemini' | 'groq';

export type AiErrorReason =
  | 'nokey'
  | 'badkey'
  | 'quota'
  | 'network'
  | 'api'
  | 'parse'
  | 'empty';

export interface AiError {
  reason: AiErrorReason;
  detail?: string;
  /** Fournisseur actif au moment de l'erreur, pour un message ciblé. */
  provider?: AiProvider;
  /** Vrai si l'erreur est transitoire (réseau, 5xx) et mérite un nouvel essai. */
  retryable?: boolean;
}

export interface AiMealResult {
  nom: string;
  kcal: number;
  prot: number;
  gluc: number;
  lip: number;
  fib: number;
  details?: string;
}

export interface AiRecipeResult {
  nom: string;
  /** Poids total estimé de la préparation finale (cuite), en grammes. */
  poidsTotal: number;
  /** Valeurs POUR 100g de préparation finale. */
  kcal: number;
  prot: number;
  gluc: number;
  lip: number;
  fib: number;
  details?: string;
}

/** Fragment de message envoyé au modèle : texte libre ou image (data URL). */
export type AiPart = { text: string } | { image: string };

/** Requête normalisée, indépendante du fournisseur. */
export interface AiRequest {
  apiKey: string;
  system: string;
  parts: AiPart[];
  hasImage: boolean;
}

/**
 * Transport spécifique à un fournisseur : envoie la requête et renvoie le texte
 * brut de la réponse, ou une AiError typée. Chaque fournisseur (Groq, Gemini)
 * implémente cette signature.
 */
export type AiTransport = (req: AiRequest) => Promise<string | AiError>;

export function err(reason: AiErrorReason, detail?: string): AiError {
  return { reason, detail };
}

/** Erreur transitoire (réseau, indisponibilité serveur) : sera réessayée. */
export function transientErr(reason: AiErrorReason, detail?: string): AiError {
  return { reason, detail, retryable: true };
}

export function extractJson(text: string): Record<string, unknown> | null {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    const json = match ? match[0] : text;
    const obj = JSON.parse(json) as unknown;
    if (!obj || typeof obj !== 'object') return null;
    return obj as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Convertit la réponse brute du modèle en AiMealResult, ou null si l'objet ne
 * contient aucune valeur nutritionnelle exploitable.
 */
export function parseMealJson(text: string): AiMealResult | null {
  const obj = extractJson(text);
  if (!obj) return null;
  const kcal = Number(obj.kcal) || 0;
  const prot = Number(obj.prot) || 0;
  const gluc = Number(obj.gluc) || 0;
  const lip = Number(obj.lip) || 0;
  if (!kcal && !prot && !gluc && !lip) return null;
  return {
    nom: typeof obj.nom === 'string' ? obj.nom : 'Repas',
    kcal,
    prot,
    gluc,
    lip,
    fib: Number(obj.fib) || 0,
    details: typeof obj.details === 'string' ? obj.details : undefined,
  };
}

export interface AiCoachAdjustment {
  exercice: string;
  action: string;
}

export interface AiCoachResult {
  analyse: string;
  conseils: string[];
  ajustements: AiCoachAdjustment[];
}

export function parseCoachJson(text: string): AiCoachResult | null {
  const obj = extractJson(text);
  if (!obj) return null;
  const analyse = typeof obj.analyse === 'string' ? obj.analyse.trim() : '';
  const conseils = Array.isArray(obj.conseils)
    ? obj.conseils.filter((c): c is string => typeof c === 'string')
    : [];
  const ajustements = Array.isArray(obj.ajustements)
    ? obj.ajustements.flatMap((a): AiCoachAdjustment[] => {
        if (!a || typeof a !== 'object') return [];
        const rec = a as Record<string, unknown>;
        if (typeof rec.exercice !== 'string' || typeof rec.action !== 'string')
          return [];
        return [{ exercice: rec.exercice, action: rec.action }];
      })
    : [];
  if (!analyse && conseils.length === 0 && ajustements.length === 0)
    return null;
  return { analyse, conseils, ajustements };
}

export function parseRecipeJson(text: string): AiRecipeResult | null {
  const obj = extractJson(text);
  if (!obj) return null;
  const kcal = Number(obj.kcal) || 0;
  const prot = Number(obj.prot) || 0;
  const gluc = Number(obj.gluc) || 0;
  const lip = Number(obj.lip) || 0;
  if (!kcal && !prot && !gluc && !lip) return null;
  return {
    nom: typeof obj.nom === 'string' ? obj.nom : 'Recette',
    poidsTotal: Math.max(0, Math.round(Number(obj.poidsTotal) || 0)),
    kcal,
    prot,
    gluc,
    lip,
    fib: Number(obj.fib) || 0,
    details: typeof obj.details === 'string' ? obj.details : undefined,
  };
}

interface ProviderInfo {
  label: string;
  keyHint: string;
  console: string;
}

export const PROVIDER_INFO: Record<AiProvider, ProviderInfo> = {
  gemini: {
    label: 'Gemini',
    keyHint: 'Elle commence par « AIza ».',
    console: 'aistudio.google.com/apikey',
  },
  groq: {
    label: 'Groq',
    keyHint: 'Elle commence par « gsk_ ».',
    console: 'console.groq.com',
  },
};

export function describeAiError(e: AiError): { title: string; msg: string } {
  const info = PROVIDER_INFO[e.provider ?? 'gemini'];
  switch (e.reason) {
    case 'nokey':
      return {
        title: '🔑 Clé API manquante',
        msg: `Ajoute ta clé API ${info.label} dans Réglages > IA. Elle est gratuite sur ${info.console}.`,
      };
    case 'badkey':
      return {
        title: '🚫 Clé API invalide',
        msg: `La clé ${info.label} est incorrecte. ${info.keyHint}`,
      };
    case 'quota':
      return {
        title: '⏳ Quota dépassé',
        msg: 'Limite de requêtes atteinte. Réessaie dans 1-2 minutes.',
      };
    case 'network':
      return {
        title: '📡 Erreur réseau',
        msg: `Impossible de contacter ${info.label}. Vérifie ta connexion internet.`,
      };
    case 'parse':
      return {
        title: '🍲 Analyse impossible',
        msg: "L'IA n'a pas pu identifier le repas. Ajoute une description plus détaillée ou une meilleure photo.",
      };
    case 'empty':
      return {
        title: '📝 Rien à analyser',
        msg: 'Prends une photo du repas et/ou décris-le en texte.',
      };
    case 'api':
    default:
      return {
        title: '⚙️ Erreur API',
        msg: e.detail ?? "L'API a retourné une erreur inattendue.",
      };
  }
}
