import type { AIEstimation } from '../types'

const MODEL = 'gemini-1.5-flash'

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

async function generateContent(apiKey: string, parts: unknown[]): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ parts }],
        generationConfig: { response_mime_type: 'application/json' },
      }),
    }
  )
  const data = await res.json()
  return data.candidates[0].content.parts[0].text
}

export async function analyzePhoto(base64Image: string, apiKey: string, context?: string): Promise<AIEstimation> {
  const userText = context
    ? `Analyse ce repas. Informations supplémentaires : "${context}". Utilise ces informations pour affiner ton estimation.`
    : 'Analyse ce repas et estime les macros.'
  const text = await generateContent(apiKey, [
    { text: userText },
    { inline_data: { mime_type: 'image/jpeg', data: base64Image } },
  ])
  return JSON.parse(text) as AIEstimation
}

export async function transcribeAudio(audioBlob: Blob, apiKey: string): Promise<string> {
  const buffer = await audioBlob.arrayBuffer()
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [
          { text: 'Transcris exactement ce que dit cette personne, sans reformuler.' },
          { inline_data: { mime_type: 'audio/webm', data: base64 } },
        ]}],
      }),
    }
  )
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

export async function analyzeText(text: string, apiKey: string): Promise<AIEstimation> {
  const result = await generateContent(apiKey, [
    { text: `Analyse ce repas : "${text}"` },
  ])
  return JSON.parse(result) as AIEstimation
}

export async function analyzeAudio(audioBlob: Blob, apiKey: string): Promise<AIEstimation> {
  const buffer = await audioBlob.arrayBuffer()
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
  const text = await generateContent(apiKey, [
    { text: 'Transcris et analyse ce repas audio, estime les macros.' },
    { inline_data: { mime_type: 'audio/webm', data: base64 } },
  ])
  return JSON.parse(text) as AIEstimation
}
