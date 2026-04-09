import type { AIEstimation } from '../types'

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
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyse ce repas et estime les macros.' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
          ],
        },
      ],
      max_tokens: 500,
    }),
  })

  const data = await res.json()
  const content = data.choices[0].message.content
  return JSON.parse(content) as AIEstimation
}

export async function transcribeAudio(audioBlob: Blob, apiKey: string): Promise<string> {
  const formData = new FormData()
  formData.append('file', audioBlob, 'audio.webm')
  formData.append('model', 'whisper-1')
  formData.append('language', 'fr')

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  })

  const data = await res.json()
  return data.text
}

export async function analyzeText(text: string, apiKey: string): Promise<AIEstimation> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Analyse ce repas : "${text}"` },
      ],
      max_tokens: 500,
    }),
  })

  const data = await res.json()
  const content = data.choices[0].message.content
  return JSON.parse(content) as AIEstimation
}

export async function analyzeAudio(audioBlob: Blob, apiKey: string): Promise<AIEstimation> {
  const text = await transcribeAudio(audioBlob, apiKey)
  return analyzeText(text, apiKey)
}
