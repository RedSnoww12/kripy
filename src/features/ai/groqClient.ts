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
const MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

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

/**
 * Envoie une requête de complétion à Groq et renvoie le texte brut de la
 * réponse, ou une AiError typée. Centralise la gestion des erreurs HTTP.
 */
async function requestGroq(
  apiKey: string,
  messages: GroqMessage[],
): Promise<string | AiError> {
  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.1,
        max_tokens: 1024,
      }),
    });
  } catch {
    return err('network');
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
    if (response.status === 401) return err('badkey');
    if (response.status === 429) return err('quota');
    if (response.status >= 500) {
      return err(
        'api',
        'Serveurs Groq temporairement indisponibles. Réessaie.',
      );
    }
    return err(
      'api',
      `Erreur ${response.status}${detail ? ` — ${detail.slice(0, 150)}` : ''}`,
    );
  }

  let data: { choices?: { message?: { content?: string } }[] };
  try {
    data = (await response.json()) as typeof data;
  } catch {
    return err('api', 'Réponse invalide.');
  }

  const text = data.choices?.[0]?.message?.content;
  if (!text) return err('parse');
  return text;
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

  const text = await requestGroq(apiKey, [
    { role: 'system', content: AI_SYSTEM_PROMPT },
    { role: 'user', content },
  ]);
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

  const text = await requestGroq(apiKey, [
    { role: 'system', content: AI_RECIPE_SYSTEM_PROMPT },
    { role: 'user', content: buildRecipeUserMessage(description) },
  ]);
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
