/** API publique de la feature IA : analyse de repas/recettes + types associés. */
export { analyzeMeal, analyzeRecipe } from './client';
export {
  DEFAULT_PROVIDER,
  getActiveConfig,
  getApiKey,
  getProvider,
  setApiKey,
  setProvider,
} from './config';
export {
  describeAiError,
  PROVIDER_INFO,
  type AiError,
  type AiErrorReason,
  type AiMealResult,
  type AiProvider,
  type AiRecipeResult,
} from './types';
