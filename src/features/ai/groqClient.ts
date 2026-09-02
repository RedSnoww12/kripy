import { err, transientErr, type AiError, type AiRequest } from './types';

const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Description d'un modèle Groq candidat : son identifiant et les paramètres
 * de génération qui lui sont propres (les modèles de raisonnement n'acceptent
 * pas tous les mêmes options, un paramètre inconnu provoque un 400).
 */
interface GroqModelSpec {
  id: string;
  params?: Record<string, unknown>;
}

// Historique : Llama 3.3 70B (texte) et Llama 4 Scout (vision) ont été
// dépréciés par Groq en juin 2026 et ne sont plus servis depuis août 2026
// (erreur « model_decommissioned »). Les remplaçants recommandés par Groq
// sont GPT-OSS 120B pour le texte et Qwen 3.x 27B pour le multimodal.
//
// Chaque liste est ordonnée par préférence : si un modèle est retiré du
// catalogue (déprécié ou inconnu), on passe automatiquement au suivant au
// lieu de laisser l'utilisateur bloqué avec « modèle plus disponible ».

/**
 * Modèles capables de lire une image, du préféré au dernier recours.
 * Qwen 3.x 27B est le seul multimodal encore servi par Groq (Llama 4 Scout et
 * Maverick sont décommissionnés). Le mode « thinking » reste actif (défaut) :
 * la réflexion est renvoyée dans un champ séparé, pas dans la réponse.
 */
export const VISION_MODELS: readonly GroqModelSpec[] = [
  { id: 'qwen/qwen3.8-27b' },
  { id: 'qwen/qwen3.6-27b' },
];

/**
 * Modèles texte, du préféré au dernier recours. GPT-OSS 120B est le modèle de
 * production le plus solide de Groq en raisonnement numérique, ce qui compte
 * pour un calcul nutritionnel composant par composant. Effort de raisonnement
 * « medium » : suffisant pour décomposer un plat sans exploser la latence.
 */
export const TEXT_MODELS: readonly GroqModelSpec[] = [
  { id: 'openai/gpt-oss-120b', params: { reasoning_effort: 'medium' } },
  { id: 'qwen/qwen3.8-27b' },
  { id: 'qwen/qwen3.6-27b' },
  { id: 'openai/gpt-oss-20b', params: { reasoning_effort: 'medium' } },
];

/** Nombre maximal d'images acceptées par requête par les modèles Qwen. */
export const MAX_IMAGES_PER_REQUEST = 3;

/**
 * Sélectionne la liste de modèles adaptée : vision si une image est présente
 * (seuls ces modèles savent la lire), sinon les meilleurs modèles texte.
 */
export function pickModels(hasImage: boolean): readonly GroqModelSpec[] {
  return hasImage ? VISION_MODELS : TEXT_MODELS;
}

interface GroqContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

type GroqMessage =
  | { role: 'system' | 'user'; content: string }
  | { role: 'user'; content: GroqContentPart[] };

interface GroqErrorBody {
  error?: { message?: string; code?: string; type?: string };
}

/**
 * Vrai si l'erreur signifie que le modèle demandé n'existe plus (déprécié,
 * retiré du catalogue ou identifiant inconnu) : dans ce cas on doit essayer le
 * modèle suivant plutôt que d'afficher l'erreur à l'utilisateur.
 */
export function isModelUnavailable(
  status: number,
  body: GroqErrorBody | null,
): boolean {
  const code = body?.error?.code ?? '';
  if (code === 'model_decommissioned' || code === 'model_not_found')
    return true;
  const message = body?.error?.message ?? '';
  if (/decommissioned|does not exist|no longer supported/i.test(message))
    return true;
  return status === 404 && /model/i.test(message);
}

function buildContent(parts: AiRequest['parts']): GroqContentPart[] {
  const images = parts.filter((p) => 'image' in p);
  const dropped = Math.max(0, images.length - MAX_IMAGES_PER_REQUEST);
  let imagesKept = 0;

  const content: GroqContentPart[] = [];
  for (const part of parts) {
    if ('text' in part) {
      content.push({ type: 'text', text: part.text });
    } else if (imagesKept < MAX_IMAGES_PER_REQUEST) {
      imagesKept++;
      content.push({ type: 'image_url', image_url: { url: part.image } });
    }
  }
  if (dropped > 0) {
    content.push({
      type: 'text',
      text: `NB : seules les ${MAX_IMAGES_PER_REQUEST} premières photos ont pu être transmises (${dropped} ignorée${dropped > 1 ? 's' : ''}). Estime le reste du repas à partir de la description.`,
    });
  }
  return content;
}

type AttemptResult =
  | { kind: 'ok'; text: string }
  | { kind: 'error'; error: AiError }
  | { kind: 'model_unavailable' };

async function attempt(
  model: GroqModelSpec,
  apiKey: string,
  messages: GroqMessage[],
): Promise<AttemptResult> {
  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model.id,
        messages,
        // Température basse = sorties déterministes et reproductibles, idéal
        // pour un calcul nutritionnel rigoureux.
        temperature: 0.1,
        top_p: 0.9,
        // Les modèles de raisonnement consomment des tokens « de réflexion »
        // avant la réponse : la marge doit couvrir les deux sans tronquer le
        // JSON final.
        max_completion_tokens: 4096,
        // Mode JSON natif : Groq garantit un objet JSON syntaxiquement valide
        // dans `content` (le prompt système mentionne « JSON », condition
        // exigée par l'API pour activer ce mode).
        response_format: { type: 'json_object' },
        ...model.params,
      }),
    });
  } catch {
    return { kind: 'error', error: transientErr('network') };
  }

  if (!response.ok) {
    let body: GroqErrorBody | null = null;
    try {
      body = (await response.json()) as GroqErrorBody;
    } catch {
      /* ignore */
    }
    const detail = body?.error?.message ?? '';
    if (response.status === 401) return { kind: 'error', error: err('badkey') };
    if (response.status === 429) return { kind: 'error', error: err('quota') };
    if (response.status >= 500) {
      return {
        kind: 'error',
        error: transientErr(
          'api',
          'Serveurs Groq temporairement indisponibles. Réessaie.',
        ),
      };
    }
    if (isModelUnavailable(response.status, body))
      return { kind: 'model_unavailable' };
    return {
      kind: 'error',
      error: err(
        'api',
        `Erreur ${response.status}${detail ? ` — ${detail.slice(0, 150)}` : ''}`,
      ),
    };
  }

  let data: { choices?: { message?: { content?: string } }[] };
  try {
    data = (await response.json()) as typeof data;
  } catch {
    return { kind: 'error', error: err('api', 'Réponse invalide.') };
  }

  const text = data.choices?.[0]?.message?.content;
  if (!text) return { kind: 'error', error: err('parse') };
  return { kind: 'ok', text };
}

/**
 * Transport Groq (API compatible OpenAI). Convertit la requête normalisée en
 * messages Groq, envoie la complétion et renvoie le texte brut ou une AiError.
 *
 * Les modèles sont essayés dans l'ordre de préférence : un modèle
 * décommissionné ou inconnu déclenche l'essai du suivant. Ainsi l'application
 * continue de fonctionner quand Groq retire un modèle du catalogue.
 */
export async function groqTransport(req: AiRequest): Promise<string | AiError> {
  const { apiKey, system, parts, hasImage } = req;

  const messages: GroqMessage[] = [
    { role: 'system', content: system },
    { role: 'user', content: buildContent(parts) },
  ];

  const candidates = pickModels(hasImage);
  for (const model of candidates) {
    const result = await attempt(model, apiKey, messages);
    if (result.kind === 'ok') return result.text;
    if (result.kind === 'error') return result.error;
    // Modèle retiré : on passe au suivant.
  }

  return err(
    'api',
    `Aucun modèle Groq ${hasImage ? 'vision' : 'texte'} disponible (${candidates
      .map((m) => m.id)
      .join(
        ', ',
      )}). Mets l'application à jour ou passe à Gemini dans Réglages > IA.`,
  );
}
