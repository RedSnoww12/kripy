import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DailyLog, Meal, UserProfile } from '../types'
import { supabase } from '../lib/supabase'

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try { return crypto.randomUUID() } catch { /* fallback below */ }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function defaultProfile(): UserProfile {
  return {
    calorie_target: 2200,
    protein_g: 160,
    fat_g: 70,
    carbs_g: 230,
    current_phase: 'deficit',
    ai_provider: 'openai',
    openai_api_key: '',
    gemini_api_key: '',
    anthropic_api_key: '',
  }
}

function emptyLog(date: string, userId: string, profile: UserProfile): DailyLog {
  return {
    id: generateId(),
    user_id: userId,
    date,
    morning_weight: null,
    calories_consumed: 0,
    daily_steps: 0,
    current_phase: profile.current_phase,
    calorie_target: profile.calorie_target,
    protein_g: 0,
    fat_g: 0,
    carbs_g: 0,
    workout_done: false,
    created_at: new Date().toISOString(),
  }
}

interface AppState {
  profile: UserProfile
  logs: DailyLog[]
  meals: Meal[]
  activeTab: string
  userId: string

  setUserId: (id: string) => void
  loadFromSupabase: () => Promise<void>
  setActiveTab: (tab: string) => void
  setProfile: (p: Partial<UserProfile>) => void
  getTodayLog: () => DailyLog
  updateTodayLog: (data: Partial<DailyLog>) => void
  updateLogByDate: (date: string, data: Partial<DailyLog>) => void
  getLogByDate: (date: string) => DailyLog | undefined
  addMeal: (meal: Omit<Meal, 'id' | 'user_id' | 'created_at'>) => void
  getRecentLogs: (days?: number) => DailyLog[]
  getTodayMeals: () => Meal[]
}

// --- Supabase sync helpers (fire-and-forget, non-blocking) ---

async function upsertLogToDb(log: DailyLog) {
  const { id, created_at, ...rest } = log
  await supabase.from('daily_logs').upsert(
    { id, ...rest, created_at },
    { onConflict: 'user_id,date' }
  )
}

async function insertMealToDb(meal: Meal) {
  await supabase.from('meals').insert(meal)
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      profile: defaultProfile(),
      logs: [],
      meals: [],
      activeTab: 'dashboard',
      userId: '',

      setUserId: (id) => set({ userId: id }),

      loadFromSupabase: async () => {
        const uid = get().userId
        if (!uid) return

        const [logsRes, mealsRes] = await Promise.all([
          supabase.from('daily_logs').select('*').eq('user_id', uid).order('date', { ascending: true }),
          supabase.from('meals').select('*').eq('user_id', uid).order('created_at', { ascending: true }),
        ])

        const logs = (logsRes.data ?? []) as DailyLog[]
        const meals = (mealsRes.data ?? []) as Meal[]

        if (logs.length > 0 || meals.length > 0) {
          set({ logs, meals })
        }
      },

      setActiveTab: (tab) => set({ activeTab: tab }),

      setProfile: (p) =>
        set((s) => ({ profile: { ...s.profile, ...p } })),

      getTodayLog: () => {
        const today = todayStr()
        const existing = get().logs.find((l) => l.date === today)
        if (existing) return existing
        const log = emptyLog(today, get().userId, get().profile)
        set((s) => ({ logs: [...s.logs, log] }))
        upsertLogToDb(log)
        return log
      },

      updateTodayLog: (data) => {
        const today = todayStr()
        set((s) => {
          const exists = s.logs.some((l) => l.date === today)
          if (!exists) {
            const log = { ...emptyLog(today, s.userId, s.profile), ...data }
            upsertLogToDb(log)
            return { logs: [...s.logs, log] }
          }
          const updated = s.logs.map((l) =>
            l.date === today ? { ...l, ...data } : l
          )
          const updatedLog = updated.find((l) => l.date === today)
          if (updatedLog) upsertLogToDb(updatedLog)
          return { logs: updated }
        })
      },

      updateLogByDate: (date, data) => {
        set((s) => {
          const exists = s.logs.some((l) => l.date === date)
          if (!exists) {
            const log = { ...emptyLog(date, s.userId, s.profile), ...data }
            upsertLogToDb(log)
            return { logs: [...s.logs, log] }
          }
          const updated = s.logs.map((l) =>
            l.date === date ? { ...l, ...data } : l
          )
          const updatedLog = updated.find((l) => l.date === date)
          if (updatedLog) upsertLogToDb(updatedLog)
          return { logs: updated }
        })
      },

      getLogByDate: (date) => {
        return get().logs.find((l) => l.date === date)
      },

      addMeal: (meal) => {
        set((s) => {
          const newMeal: Meal = {
            ...meal,
            id: generateId(),
            user_id: s.userId,
            created_at: new Date().toISOString(),
          }

          insertMealToDb(newMeal)

          const mealDate = meal.log_date
          const dateMeals = [...s.meals.filter((m) => m.log_date === mealDate), newMeal]
          const totalCal = dateMeals.reduce((a, m) => a + m.calories, 0)
          const totalP = dateMeals.reduce((a, m) => a + m.protein_g, 0)
          const totalF = dateMeals.reduce((a, m) => a + m.fat_g, 0)
          const totalC = dateMeals.reduce((a, m) => a + m.carbs_g, 0)

          const exists = s.logs.some((l) => l.date === mealDate)
          const updatedLogs = exists
            ? s.logs.map((l) =>
                l.date === mealDate
                  ? { ...l, calories_consumed: totalCal, protein_g: totalP, fat_g: totalF, carbs_g: totalC }
                  : l
              )
            : [
                ...s.logs,
                { ...emptyLog(mealDate, s.userId, s.profile), calories_consumed: totalCal, protein_g: totalP, fat_g: totalF, carbs_g: totalC },
              ]

          const updatedLog = updatedLogs.find((l) => l.date === mealDate)
          if (updatedLog) upsertLogToDb(updatedLog)

          return { meals: [...s.meals, newMeal], logs: updatedLogs }
        })
      },

      getRecentLogs: (days = 7) => {
        const logs = get().logs
        return [...logs]
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(-days)
      },

      getTodayMeals: () => {
        const today = todayStr()
        return get().meals.filter((m) => m.log_date === today)
      },
    }),
    { name: 'nutricoach-storage' }
  )
)
