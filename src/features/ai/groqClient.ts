import {
  AI_RECIPE_SYSTEM_PROMPT,
  AI_SYSTEM_PROMPT,
  buildRecipeUserMessage,
  buildUserMessage,
} from './prompts';

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

interface AnalyzeArgs {
  apiKey: string;
  description: string;
  imageB64: string | null;
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

interface AnalyzeRecipeArgs {
  apiKey: string;
  description: string;
}

const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

// Stratégie : on utilise toujours le modèle le plus capable compatible avec
// l'entrée.
// - MODEL_TEXT : modèle de raisonnement le plus performant de Groq, idéal pour
//   les calculs nutritionnels (texte seul : recettes, repas sans photo).
// - MODEL_VISION : seul modèle multimodal disponible, indispensable dès qu'une
//   photo est envoyée. (Llama 4 Maverick a été déprécié par Groq en mars 2026 ;
//   gpt-oss-120b ne gère pas les images, d'où ce découplage.)
// Un repli automatique vers MODEL_VISION couvre le cas où MODEL_TEXT ne serait
// pas accessible sur le compte (erreur 404 « model does not exist »).
const MODEL_TEXT = 'openai/gpt-oss-120b';
const MODEL_VISION = 'meta-llama/llama-4-scout-17b-16e-instruct';

function err(reason: AiErrorReason, detail?: string): AiError {
  return { reason, detail };
}

interface GroqContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

type GroqMessage =
  | { role: 'system' | 'user'; content: string }
  | { role: 'user'; content: GroqContentPart[] };

/** Résultat interne d'un appel à un modèle précis. */
type SingleResult =
  | { ok: true; text: string }
  | { ok: false; error: AiError; modelMissing: boolean };

/**
 * Envoie une requête de complétion à Groq avec un modèle donné. Renvoie le
 * texte brut, ou une erreur typée. `modelMissing` signale un modèle absent /
 * inaccessible (404), ce qui permet à l'appelant de tenter un autre modèle.
 */
async function requestModel(
  apiKey: string,
  messages: GroqMessage[],
  model: string,
): Promise<SingleResult> {
  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        // Température basse = sorties déterministes et reproductibles, idéal pour
        // un calcul nutritionnel rigoureux.
        temperature: 0.1,
        top_p: 0.9,
        // Marge augmentée : laisse le modèle décomposer chaque composant et
        // détailler son calcul sans tronquer la réponse JSON.
        max_tokens: 2048,
      }),
    });
  } catch {
    return { ok: false, error: err('network'), modelMissing: false };
  }

  if (!response.ok) {
    let detail = '';
    try {
      const j = (await response.json()) as {
        error?: { message?: string };
      };
      detail = j.error?.message ?? '';
    } catch {
      /* ignore */
    }
    if (response.status === 401)
      return { ok: false, error: err('badkey'), modelMissing: false };
    if (response.status === 429)
      return { ok: false, error: err('quota'), modelMissing: false };
    if (response.status === 404) {
      return {
        ok: false,
        error: err(
          'api',
          `Modèle indisponible${detail ? ` — ${detail.slice(0, 150)}` : ''}`,
        ),
        modelMissing: true,
      };
    }
    if (response.status >= 500) {
      return {
        ok: false,
        error: err(
          'api',
          'Serveurs Groq temporairement indisponibles. Réessaie.',
        ),
        modelMissing: false,
      };
    }
    return {
      ok: false,
      error: err(
        'api',
        `Erreur ${response.status}${detail ? ` — ${detail.slice(0, 150)}` : ''}`,
      ),
      modelMissing: false,
    };
  }

  let data: { choices?: { message?: { content?: string } }[] };
  try {
    data = (await response.json()) as typeof data;
  } catch {
    return {
      ok: false,
      error: err('api', 'Réponse invalide.'),
      modelMissing: false,
    };
  }

  const text = data.choices?.[0]?.message?.content;
  if (!text) return { ok: false, error: err('parse'), modelMissing: false };
  return { ok: true, text };
}

/**
 * Tente les modèles dans l'ordre fourni et renvoie la première réponse réussie.
 * Si un modèle est absent/inaccessible (404), bascule automatiquement sur le
 * suivant (typiquement le modèle vision) pour ne jamais exposer un 404 à
 * l'utilisateur. Centralise la gestion des erreurs HTTP.
 */
async function requestGroq(
  apiKey: string,
  messages: GroqMessage[],
  models: string[],
): Promise<string | AiError> {
  let lastError: AiError = err('api');
  for (const model of models) {
    const res = await requestModel(apiKey, messages, model);
    if (res.ok) return res.text;
    lastError = res.error;
    // On ne réessaie avec le modèle suivant que si CE modèle est indisponible.
    if (!res.modelMissing) break;
  }
  return lastError;
}

function extractJson(text: string): Record<string, unknown> | null {
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

export async function analyzeMeal(
  args: AnalyzeArgs,
): Promise<AiMealResult | AiError> {
  const { apiKey, description, imageB64 } = args;

  if (!apiKey) return err('nokey');
  if (!description && !imageB64) return err('empty');

  const content: GroqContentPart[] = [];
  if (imageB64) {
    content.push({ type: 'image_url', image_url: { url: imageB64 } });
  }
  content.push({ type: 'text', text: buildUserMessage(description) });

  // Avec photo : modèle vision obligatoire. Sans photo (texte seul) : on
  // privilégie le modèle de raisonnement, avec repli sur la vision.
  const models = imageB64 ? [MODEL_VISION] : [MODEL_TEXT, MODEL_VISION];

  const text = await requestGroq(
    apiKey,
    [
      { role: 'system', content: AI_SYSTEM_PROMPT },
      { role: 'user', content },
    ],
    models,
  );
  if (typeof text !== 'string') return text;

  const obj = extractJson(text);
  if (!obj) return err('parse');
  const kcal = Number(obj.kcal) || 0;
  const prot = Number(obj.prot) || 0;
  const gluc = Number(obj.gluc) || 0;
  const lip = Number(obj.lip) || 0;
  if (!kcal && !prot && !gluc && !lip) return err('parse');
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

/**
 * Analyse une liste d'ingrédients bruts et renvoie les valeurs nutritionnelles
 * POUR 100g de préparation finale + le poids total estimé.
 */
export async function analyzeRecipe(
  args: AnalyzeRecipeArgs,
): Promise<AiRecipeResult | AiError> {
  const { apiKey, description } = args;

  if (!apiKey) return err('nokey');
  if (!description.trim()) return err('empty');

  // Recette = texte seul : on privilégie le modèle de raisonnement, avec repli
  // automatique sur le modèle vision s'il n'est pas accessible.
  const text = await requestGroq(
    apiKey,
    [
      { role: 'system', content: AI_RECIPE_SYSTEM_PROMPT },
      { role: 'user', content: buildRecipeUserMessage(description) },
    ],
    [MODEL_TEXT, MODEL_VISION],
  );
  if (typeof text !== 'string') return text;

  const obj = extractJson(text);
  if (!obj) return err('parse');
  const kcal = Number(obj.kcal) || 0;
  const prot = Number(obj.prot) || 0;
  const gluc = Number(obj.gluc) || 0;
  const lip = Number(obj.lip) || 0;
  if (!kcal && !prot && !gluc && !lip) return err('parse');
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

export function describeAiError(e: AiError): { title: string; msg: string } {
  switch (e.reason) {
    case 'nokey':
      return {
        title: '🔑 Clé API manquante',
        msg: 'Ajoute ta clé API Groq dans Réglages > IA. Crée un compte gratuit sur console.groq.com.',
      };
    case 'badkey':
      return {
        title: '🚫 Clé API invalide',
        msg: 'La clé Groq est incorrecte. Elle commence par gsk_.',
      };
    case 'quota':
      return {
        title: '⏳ Quota dépassé',
        msg: 'Limite de requêtes atteinte. Réessaie dans 1-2 minutes.',
      };
    case 'network':
      return {
        title: '📡 Erreur réseau',
        msg: 'Impossible de contacter Groq. Vérifie ta connexion internet.',
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
