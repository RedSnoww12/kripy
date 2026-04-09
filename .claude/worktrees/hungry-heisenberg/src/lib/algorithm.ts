import type { Phase, Trend, AlgorithmResult, DailyLog } from '../types'

export function computeMovingAverage(weights: (number | null)[], window = 5): number | null {
  const valid = weights.filter((w): w is number => w !== null)
  if (valid.length === 0) return null
  const slice = valid.slice(-window)
  return slice.reduce((a, b) => a + b, 0) / slice.length
}

export function detectTrend(logs: DailyLog[], window = 5): Trend {
  const weights = logs.map((l) => l.morning_weight).filter((w): w is number => w !== null)
  if (weights.length < 3) return 'stagne'

  const recent = weights.slice(-window)
  if (recent.length < 2) return 'stagne'

  const first = recent.slice(0, Math.ceil(recent.length / 2))
  const second = recent.slice(Math.ceil(recent.length / 2))

  const avgFirst = first.reduce((a, b) => a + b, 0) / first.length
  const avgSecond = second.reduce((a, b) => a + b, 0) / second.length
  const diff = avgSecond - avgFirst

  const threshold = 0.15
  if (diff < -threshold) return 'baisse'
  if (diff > threshold) return 'hausse'

  // Check stagnation: >=3 days with minimal variation
  const last3 = recent.slice(-3)
  const max3 = Math.max(...last3)
  const min3 = Math.min(...last3)
  if (max3 - min3 < 0.3) return 'stagne'

  return 'stagne'
}

export function getRecommendation(phase: Phase, trend: Trend): AlgorithmResult {
  const matrix: Record<Phase, Record<Trend, AlgorithmResult>> = {
    pre_prep: {
      baisse: { action: 'maintain', amount: 0, message: 'Ne rien changer. Le poids baisse.', color: 'green', trend: 'baisse' },
      stagne: { action: 'increase', amount: 200, message: 'Stagnation 72h+ : +200 kcal (+50g glucides)', color: 'blue', trend: 'stagne' },
      hausse: { action: 'maintain', amount: 0, message: 'Hausse en cours, surveiller.', color: 'orange', trend: 'hausse' },
    },
    deficit: {
      baisse: { action: 'maintain', amount: 0, message: 'Ne rien changer. La descente est en cours.', color: 'green', trend: 'baisse' },
      stagne: { action: 'decrease', amount: 200, message: 'Stagnation 72h+ : -200 kcal (-50g glucides)', color: 'blue', trend: 'stagne' },
      hausse: { action: 'maintain', amount: 0, message: 'Hausse inattendue, analyser.', color: 'orange', trend: 'hausse' },
    },
    remontee: {
      baisse: { action: 'maintain', amount: 0, message: 'Ne rien changer. Le poids baisse encore.', color: 'green', trend: 'baisse' },
      stagne: { action: 'increase', amount: 200, message: 'Stagnation 72h+ : +200 kcal (+50g glucides)', color: 'blue', trend: 'stagne' },
      hausse: { action: 'maintain', amount: 0, message: 'Remontée en cours, normal.', color: 'green', trend: 'hausse' },
    },
    reverse_diet: {
      baisse: { action: 'increase', amount: 200, message: 'Baisse détectée : +200 kcal (+50g glucides)', color: 'blue', trend: 'baisse' },
      stagne: { action: 'maintain', amount: 0, message: 'Stabilisation, maintenir le cap.', color: 'green', trend: 'stagne' },
      hausse: { action: 'maintain', amount: 0, message: 'Hausse en reverse, surveiller.', color: 'orange', trend: 'hausse' },
    },
    prise_masse: {
      baisse: { action: 'increase', amount: 200, message: 'Baisse détectée : +200 kcal (+50g glucides)', color: 'blue', trend: 'baisse' },
      stagne: { action: 'maintain', amount: 0, message: 'Stagnation, maintenir les calories.', color: 'green', trend: 'stagne' },
      hausse: { action: 'maintain', amount: 0, message: 'Prise en cours, maintenir.', color: 'green', trend: 'hausse' },
    },
  }

  return matrix[phase][trend]
}

export function analyzeCoaching(logs: DailyLog[], phase: Phase): AlgorithmResult {
  const trend = detectTrend(logs)
  return getRecommendation(phase, trend)
}
