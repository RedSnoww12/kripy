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
  /** true si ce résultat provient d'un repas déjà décrit et validé, sans nouvel appel IA. */
  fromMemory?: boolean;
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

/** Nouveaux objectifs proposés par l'IA pour un exercice, pour la prochaine occurrence de cette séance type. */
export interface AiSessionAdjustment {
  /** Doit correspondre exactement au nom d'exercice envoyé dans le contexte. */
  exercice: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  /** Poids de départ conseillé (kg). Lest ajouté pour un exercice au poids du corps, 0 = poids du corps strict. */
  poids: number;
  /** Explication courte de l'ajustement. */
  note: string;
}

export interface AiSessionAnalysisResult {
  resume: string;
  ajustements: AiSessionAdjustment[];
}

function toFiniteNumber(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function parseSessionAdjustJson(
  text: string,
): AiSessionAnalysisResult | null {
  const obj = extractJson(text);
  if (!obj) return null;
  const resume = typeof obj.resume === 'string' ? obj.resume.trim() : '';
  const ajustements = Array.isArray(obj.ajustements)
    ? obj.ajustements.flatMap((a): AiSessionAdjustment[] => {
        if (!a || typeof a !== 'object') return [];
        const rec = a as Record<string, unknown>;
        const sets = toFiniteNumber(rec.sets);
        const repsMin = toFiniteNumber(rec.repsMin);
        const repsMax = toFiniteNumber(rec.repsMax);
        const poids = toFiniteNumber(rec.poids);
        if (
          typeof rec.exercice !== 'string' ||
          sets === null ||
          repsMin === null ||
          repsMax === null ||
          poids === null
        ) {
          return [];
        }
        return [
          {
            exercice: rec.exercice,
            sets: Math.max(1, Math.round(sets)),
            repsMin: Math.max(1, Math.round(repsMin)),
            repsMax: Math.max(1, Math.round(repsMax)),
            poids: Math.max(0, poids),
            note: typeof rec.note === 'string' ? rec.note : '',
          },
        ];
      })
    : [];
  if (!resume && ajustements.length === 0) return null;
  return { resume, ajustements };
}

export interface AiStatsResult {
  /** Bilan chiffré : la tendance est-elle adaptée à l'objectif ? */
  bilan: string;
  /** 3-5 actions concrètes adaptées à l'objectif (sèche/masse/maintien). */
  recommandations: string[];
  /** Ajustement suggéré de la cible kcal quotidienne, null si rien à changer. */
  ajustementKcal: number | null;
}

const STATS_KCAL_ADJUST_MAX = 500;

export function parseStatsJson(text: string): AiStatsResult | null {
  const obj = extractJson(text);
  if (!obj) return null;
  const bilan = typeof obj.bilan === 'string' ? obj.bilan.trim() : '';
  const recommandations = Array.isArray(obj.recommandations)
    ? obj.recommandations
        .filter((r): r is string => typeof r === 'string' && r.trim() !== '')
        .slice(0, 6)
    : [];
  const rawAdjust = toFiniteNumber(obj.ajustementKcal);
  const ajustementKcal =
    rawAdjust === null || rawAdjust === 0
      ? null
      : Math.max(
          -STATS_KCAL_ADJUST_MAX,
          Math.min(STATS_KCAL_ADJUST_MAX, Math.round(rawAdjust)),
        );
  if (!bilan && recommandations.length === 0) return null;
  return { bilan, recommandations, ajustementKcal };
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
