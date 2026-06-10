import { err, transientErr, type AiError, type AiRequest } from './types';

// Gemini 2.5 Flash : modèle nativement multimodal (texte + image) de Google,
// rapide et doté d'un solide palier gratuit. Un seul modèle gère la photo ET le
// texte, contrairement à Groq qui impose de jongler entre deux modèles.
const MODEL = 'gemini-2.5-flash';
const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

interface GeminiPart {
  text?: string;
  inline_data?: { mime_type: string; data: string };
}

interface GeminiResponse {
  candidates?: {
    content?: { parts?: { text?: string }[] };
    finishReason?: string;
  }[];
  promptFeedback?: { blockReason?: string };
  error?: { message?: string };
}

/**
 * Sépare un data URL (`data:image/jpeg;base64,XXXX`) en mime_type + base64 brut,
 * format attendu par l'API Gemini. Renvoie null si le format est inattendu.
 */
function dataUrlToInline(dataUrl: string): GeminiPart | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { inline_data: { mime_type: match[1], data: match[2] } };
}

export async function geminiTransport(
  req: AiRequest,
): Promise<string | AiError> {
  const { apiKey, system, parts } = req;

  const geminiParts: GeminiPart[] = [];
  for (const part of parts) {
    if ('text' in part) {
      geminiParts.push({ text: part.text });
    } else {
      const inline = dataUrlToInline(part.image);
      if (inline) geminiParts.push(inline);
    }
  }

  const body = {
    system_instruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: geminiParts }],
    generationConfig: {
      // Température basse = sorties déterministes, idéal pour un calcul rigoureux.
      temperature: 0.1,
      topP: 0.9,
      maxOutputTokens: 2048,
      // Mode JSON natif : Gemini garantit une réponse JSON valide, ce qui
      // supprime quasiment les erreurs de parsing.
      responseMimeType: 'application/json',
    },
  };

  let response: Response;
  try {
    response = await fetch(`${BASE}/${MODEL}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Clé envoyée par en-tête plutôt qu'en paramètre d'URL : elle reste
        // hors des logs et de l'historique réseau.
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(body),
    });
  } catch {
    return transientErr('network');
  }

  if (!response.ok) {
    let detail = '';
    try {
      const j = (await response.json()) as GeminiResponse;
      detail = j.error?.message ?? '';
    } catch {
      /* ignore */
    }
    if (response.status === 400 && /api key not valid/i.test(detail)) {
      return err('badkey');
    }
    if (response.status === 401 || response.status === 403)
      return err('badkey');
    if (response.status === 429) return err('quota');
    if (response.status >= 500) {
      return transientErr(
        'api',
        'Serveurs Gemini temporairement indisponibles. Réessaie.',
      );
    }
    return err(
      'api',
      `Erreur ${response.status}${detail ? ` — ${detail.slice(0, 150)}` : ''}`,
    );
  }

  let data: GeminiResponse;
  try {
    data = (await response.json()) as GeminiResponse;
  } catch {
    return err('api', 'Réponse invalide.');
  }

  if (data.promptFeedback?.blockReason) {
    return err(
      'api',
      `Requête bloquée par Gemini (${data.promptFeedback.blockReason}).`,
    );
  }

  const text = data.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? '')
    .join('')
    .trim();
  if (!text) return err('parse');
  return text;
}
