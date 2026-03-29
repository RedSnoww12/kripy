export type Phase = 'pre_prep' | 'deficit' | 'remontee' | 'reverse_diet' | 'prise_masse'

export const PHASE_LABELS: Record<Phase, string> = {
  pre_prep: 'Pré-Prep',
  deficit: 'Descente',
  remontee: 'Remontée',
  reverse_diet: 'Reverse Diet',
  prise_masse: 'Prise de Masse',
}

export interface DailyLog {
  id: string
  user_id: string
  date: string
  morning_weight: number | null
  calories_consumed: number
  daily_steps: number
  current_phase: Phase
  calorie_target: number
  protein_g: number
  fat_g: number
  carbs_g: number
  workout_done: boolean
  created_at: string
}

export interface Meal {
  id: string
  user_id: string
  log_date: string
  description: string
  calories: number
  protein_g: number
  fat_g: number
  carbs_g: number
  source: 'photo' | 'audio' | 'manual'
  ai_raw_response: Record<string, unknown> | null
  created_at: string
}

export interface AIEstimation {
  calories: number
  protein_g: number
  fat_g: number
  carbs_g: number
  items: { name: string; calories: number; grams: number }[]
  description: string
}

export type Trend = 'baisse' | 'stagne' | 'hausse'
export type AlgoAction = 'maintain' | 'increase' | 'decrease'
export type StatusColor = 'green' | 'orange' | 'blue'

export interface AlgorithmResult {
  action: AlgoAction
  amount: number
  message: string
  color: StatusColor
  trend: Trend
}

export type AIProvider = 'openai' | 'gemini' | 'anthropic'

export const AI_PROVIDER_LABELS: Record<AIProvider, string> = {
  openai: 'OpenAI (GPT-4o)',
  gemini: 'Google Gemini',
  anthropic: 'Anthropic (Claude)',
}

export interface UserProfile {
  calorie_target: number
  protein_pct: number
  fat_pct: number
  carbs_pct: number
  protein_g: number
  fat_g: number
  carbs_g: number
  current_phase: Phase
  ai_provider: AIProvider
  openai_api_key: string
  gemini_api_key: string
  anthropic_api_key: string
}
