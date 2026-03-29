import type { AIEstimation, AIProvider, UserProfile } from '../types'
import * as openai from './openai'
import * as gemini from './gemini'
import * as anthropic from './anthropic'

function getApiKey(profile: UserProfile): string {
  switch (profile.ai_provider) {
    case 'openai': return profile.openai_api_key
    case 'gemini': return profile.gemini_api_key
    case 'anthropic': return profile.anthropic_api_key
  }
}

function getImpl(provider: AIProvider) {
  switch (provider) {
    case 'openai': return openai
    case 'gemini': return gemini
    case 'anthropic': return anthropic
  }
}

export function getAI(profile: UserProfile) {
  const impl = getImpl(profile.ai_provider)
  const apiKey = getApiKey(profile)

  function requireKey(): string {
    if (!apiKey) {
      throw new Error(`Clé API ${profile.ai_provider} manquante. Va dans Réglages pour l'ajouter.`)
    }
    return apiKey
  }

  return {
    analyzePhoto: (base64Image: string, context?: string): Promise<AIEstimation> =>
      impl.analyzePhoto(base64Image, requireKey(), context),
    analyzeAudio: (audioBlob: Blob): Promise<AIEstimation> =>
      impl.analyzeAudio(audioBlob, requireKey()),
    analyzeText: (text: string): Promise<AIEstimation> =>
      impl.analyzeText(text, requireKey()),
    transcribeAudio: (audioBlob: Blob): Promise<string> =>
      impl.transcribeAudio(audioBlob, requireKey()),
  }
}
