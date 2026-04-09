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

  return {
    analyzePhoto: (base64Image: string): Promise<AIEstimation> =>
      impl.analyzePhoto(base64Image, apiKey),
    analyzeAudio: (audioBlob: Blob): Promise<AIEstimation> =>
      impl.analyzeAudio(audioBlob, apiKey),
    analyzeText: (text: string): Promise<AIEstimation> =>
      impl.analyzeText(text, apiKey),
  }
}
