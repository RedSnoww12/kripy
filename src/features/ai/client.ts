import { getActiveConfig } from './config';
import { geminiTransport } from './geminiClient';
import { groqTransport } from './groqClient';
import { applyMealMargin } from './mealMargin';
import { recallMeal } from './mealMemory';
import {
  AI_RECIPE_SYSTEM_PROMPT,
  AI_SYSTEM_PROMPT,
  buildRecipeUserMessage,
  buildUserMessage,
} from './prompts';
import {
  AI_COACH_SYSTEM_PROMPT,
  AI_SESSION_ADJUST_SYSTEM_PROMPT,
  buildCoachUserMessage,
  buildSessionAdjustUserMessage,
  type CoachContext,
} from './sportPrompts';
import {
  AI_STATS_SYSTEM_PROMPT,
  buildStatsUserMessage,
  type StatsContext,
} from './statsPrompts';
import {
  err,
  parseCoachJson,
  parseMealJson,
  parseRecipeJson,
  parseSessionAdjustJson,
  parseStatsJson,
  type AiCoachResult,
  type AiError,
  type AiMealResult,
  type AiPart,
  type AiProvider,
  type AiRecipeResult,
  type AiRequest,
  type AiSessionAnalysisResult,
  type AiStatsResult,
  type AiTransport,
} from './types';

const TRANSPORTS: Record<AiProvider, AiTransport> = {
  groq: groqTransport,
  gemini: geminiTransport,
};

// Réessais avec back-off court sur les seules erreurs transitoires (réseau, 5xx).
const RETRY_DELAYS = [400, 900];

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runWithRetry(
  transport: AiTransport,
  request: AiRequest,
): Promise<string | AiError> {
  let last: string | AiError = err('api');
  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    last = await transport(request);
    if (typeof last === 'string') return last;
    if (!last.retryable) return last;
    if (attempt < RETRY_DELAYS.length) await delay(RETRY_DELAYS[attempt]);
  }
  return last;
}

interface AnalyzeMealArgs {
  description: string;
  imagesB64: string[];
  /** Consignes libres transmises à l'IA (ex : « sauce à part »). */
  instructions?: string;
  /** Marge de sécurité en % appliquée au résultat (repas au restaurant…). */
  marginPct?: number;
}

export async function analyzeMeal(
  args: AnalyzeMealArgs,
): Promise<AiMealResult | AiError> {
  const { description, imagesB64 } = args;
  const instructions = args.instructions?.trim() ?? '';
  const marginPct = args.marginPct ?? 0;

  // Repas déjà décrit et validé avec ce texte exact : on réutilise les
  // valeurs confirmées par l'utilisateur plutôt que de ré-estimer, plus
  // rapide et plus cohérent d'une fois sur l'autre. Uniquement pour les
  // descriptions texte pures : une photo, des instructions ou une marge
  // changent potentiellement le résultat attendu.
  if (
    imagesB64.length === 0 &&
    description &&
    !instructions &&
    marginPct <= 0
  ) {
    const remembered = recallMeal(description);
    if (remembered) return remembered;
  }

  const { provider, apiKey } = getActiveConfig();

  if (!apiKey) return { ...err('nokey'), provider };
  if (!description && imagesB64.length === 0)
    return { ...err('empty'), provider };

  const parts: AiPart[] = imagesB64.map((image) => ({ image }));
  parts.push({
    text: buildUserMessage(description, {
      instructions,
      photoCount: imagesB64.length,
    }),
  });

  const text = await runWithRetry(TRANSPORTS[provider], {
    apiKey,
    system: AI_SYSTEM_PROMPT,
    parts,
    hasImage: imagesB64.length > 0,
  });
  if (typeof text !== 'string') return { ...text, provider };

  const result = parseMealJson(text);
  if (!result) return { ...err('parse'), provider };
  return applyMealMargin(result, marginPct);
}

interface AnalyzeRecipeArgs {
  description: string;
}

/**
 * Analyse une liste d'ingrédients bruts et renvoie les valeurs nutritionnelles
 * POUR 100g de préparation finale + le poids total estimé.
 */
export async function analyzeRecipe(
  args: AnalyzeRecipeArgs,
): Promise<AiRecipeResult | AiError> {
  const description = args.description.trim();
  const { provider, apiKey } = getActiveConfig();

  if (!apiKey) return { ...err('nokey'), provider };
  if (!description) return { ...err('empty'), provider };

  const text = await runWithRetry(TRANSPORTS[provider], {
    apiKey,
    system: AI_RECIPE_SYSTEM_PROMPT,
    parts: [{ text: buildRecipeUserMessage(description) }],
    hasImage: false,
  });
  if (typeof text !== 'string') return { ...text, provider };

  const result = parseRecipeJson(text);
  return result ?? { ...err('parse'), provider };
}

/**
 * Analyse coach : envoie le résumé de progression (profil + séances) et
 * renvoie un bilan structuré avec conseils et ajustements chiffrés.
 */
export async function analyzeTraining(
  context: CoachContext,
): Promise<AiCoachResult | AiError> {
  const { provider, apiKey } = getActiveConfig();

  if (!apiKey) return { ...err('nokey'), provider };

  const text = await runWithRetry(TRANSPORTS[provider], {
    apiKey,
    system: AI_COACH_SYSTEM_PROMPT,
    parts: [{ text: buildCoachUserMessage(context) }],
    hasImage: false,
  });
  if (typeof text !== 'string') return { ...text, provider };

  const result = parseCoachJson(text);
  return result ?? { ...err('parse'), provider };
}

/**
 * Analyse des statistiques (poids, calories, macros) : renvoie un bilan et
 * des recommandations adaptées à l'objectif en cours (sèche, prise de masse,
 * maintien…).
 */
export async function analyzeStats(
  context: StatsContext,
): Promise<AiStatsResult | AiError> {
  const { provider, apiKey } = getActiveConfig();

  if (!apiKey) return { ...err('nokey'), provider };

  const text = await runWithRetry(TRANSPORTS[provider], {
    apiKey,
    system: AI_STATS_SYSTEM_PROMPT,
    parts: [{ text: buildStatsUserMessage(context) }],
    hasImage: false,
  });
  if (typeof text !== 'string') return { ...text, provider };

  const result = parseStatsJson(text);
  return result ?? { ...err('parse'), provider };
}

/**
 * Analyse une séance qui vient d'être terminée et propose, exercice par
 * exercice, le poids/séries/reps à viser la prochaine fois que cette même
 * séance type sera refaite.
 */
export async function analyzeSessionAdjustments(
  context: CoachContext,
): Promise<AiSessionAnalysisResult | AiError> {
  const { provider, apiKey } = getActiveConfig();

  if (!apiKey) return { ...err('nokey'), provider };

  const text = await runWithRetry(TRANSPORTS[provider], {
    apiKey,
    system: AI_SESSION_ADJUST_SYSTEM_PROMPT,
    parts: [{ text: buildSessionAdjustUserMessage(context) }],
    hasImage: false,
  });
  if (typeof text !== 'string') return { ...text, provider };

  const result = parseSessionAdjustJson(text);
  return result ?? { ...err('parse'), provider };
}
