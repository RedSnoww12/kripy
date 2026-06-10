import { err, transientErr, type AiError, type AiRequest } from './types';

const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

// On choisit le modèle selon la situation (voir pickModel) :
//
// VISION_MODEL — Llama 4 Scout : modèle multimodal de Groq, stable et
// disponible, capable de lire une image. C'est le seul des deux qui sait
// analyser une photo, on l'utilise donc dès qu'une image est fournie.
const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';
// TEXT_MODEL — Llama 3.3 70B : le meilleur modèle de raisonnement texte de
// Groq (70 milliards de paramètres). Plus précis que Scout sur le calcul
// numérique pur, on le préfère donc quand l'analyse ne repose que sur du texte
// (description écrite, recette d'ingrédients).
const TEXT_MODEL = 'llama-3.3-70b-versatile';

/**
 * Sélectionne le modèle le plus adapté : un modèle vision si une image est
 * présente (seul capable de la lire), sinon le meilleur modèle texte pour un
 * calcul nutritionnel précis.
 */
function pickModel(hasImage: boolean): string {
  return hasImage ? VISION_MODEL : TEXT_MODEL;
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
 * Transport Groq (API compatible OpenAI). Convertit la requête normalisée en
 * messages Groq, envoie la complétion et renvoie le texte brut ou une AiError.
 */
export async function groqTransport(req: AiRequest): Promise<string | AiError> {
  const { apiKey, system, parts, hasImage } = req;

  const content: GroqContentPart[] = parts.map((part) =>
    'text' in part
      ? { type: 'text', text: part.text }
      : { type: 'image_url', image_url: { url: part.image } },
  );

  const messages: GroqMessage[] = [
    { role: 'system', content: system },
    { role: 'user', content },
  ];

  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: pickModel(hasImage),
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
    return transientErr('network');
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
      return transientErr(
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
