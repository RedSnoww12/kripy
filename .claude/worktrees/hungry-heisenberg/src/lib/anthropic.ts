import type { AIEstimation } from '../types'

const MODEL = 'claude-3-5-haiku-20241022'

const SYSTEM_PROMPT = `Tu es un nutritionniste expert. Analyse le repas décrit et retourne UNIQUEMENT un objet JSON valide (sans markdown, sans backticks) avec cette structure exacte:
{
  "calories": number,
  "protein_g": number,
  "fat_g": number,
  "carbs_g": number,
  "items": [{ "name": "string", "calories": number, "grams": number }],
  "description": "string courte décrivant le repas"
}
Estime les quantités si non précisées. Sois précis sur les macros.`

export async function analyzePhoto(base64Image: string, apiKey: string): Promise<AIEstimation> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyse ce repas et estime les macros.' },
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64Image } },
          ],
        },
      ],
    }),
  })

  const data = await res.json()
  const content = data.content[0].text
  return JSON.parse(content) as AIEstimation
}

export async function analyzeText(text: string, apiKey: string): Promise<AIEstimation> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Analyse ce repas : "${text}"` }],
    }),
  })

  const data = await res.json()
  const content = data.content[0].text
  return JSON.parse(content) as AIEstimation
}

export async function analyzeAudio(_audioBlob: Blob, _apiKey: string): Promise<AIEstimation> {
  throw new Error("L'analyse audio n'est pas supportée par Anthropic. Utilisez OpenAI ou Gemini.")
}
