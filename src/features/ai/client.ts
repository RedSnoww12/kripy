import { getActiveConfig } from './config';
import { geminiTransport } from './geminiClient';
import { groqTransport } from './groqClient';
import {
  AI_RECIPE_SYSTEM_PROMPT,
  AI_SYSTEM_PROMPT,
  buildRecipeUserMessage,
  buildUserMessage,
} from './prompts';
import {
  err,
  parseMealJson,
  parseRecipeJson,
  type AiError,
  type AiMealResult,
  type AiPart,
  type AiProvider,
  type AiRecipeResult,
  type AiRequest,
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
  imageB64: string | null;
}

export async function analyzeMeal(
  args: AnalyzeMealArgs,
): Promise<AiMealResult | AiError> {
  const { description, imageB64 } = args;
  const { provider, apiKey } = getActiveConfig();

  if (!apiKey) return { ...err('nokey'), provider };
  if (!description && !imageB64) return { ...err('empty'), provider };

  const parts: AiPart[] = [];
  if (imageB64) parts.push({ image: imageB64 });
  parts.push({ text: buildUserMessage(description) });

  const text = await runWithRetry(TRANSPORTS[provider], {
    apiKey,
    system: AI_SYSTEM_PROMPT,
    parts,
    hasImage: Boolean(imageB64),
  });
  if (typeof text !== 'string') return { ...text, provider };

  const result = parseMealJson(text);
  return result ?? { ...err('parse'), provider };
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
