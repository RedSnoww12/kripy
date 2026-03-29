import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Phase, DailyLog, Meal, UserProfile } from '../types'

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return generateId()
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
    openai_api_key: '',
  }
}

function emptyLog(date: string, profile: UserProfile): DailyLog {
  return {
    id: generateId(),
    user_id: 'local',
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

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      profile: defaultProfile(),
      logs: [],
      meals: [],
      activeTab: 'dashboard',

      setActiveTab: (tab) => set({ activeTab: tab }),

      setProfile: (p) =>
        set((s) => ({ profile: { ...s.profile, ...p } })),

      getTodayLog: () => {
        const today = todayStr()
        const existing = get().logs.find((l) => l.date === today)
        if (existing) return existing
        const log = emptyLog(today, get().profile)
        set((s) => ({ logs: [...s.logs, log] }))
        return log
      },

      updateTodayLog: (data) =>
        set((s) => {
          const today = todayStr()
          const exists = s.logs.some((l) => l.date === today)
          if (!exists) {
            const log = { ...emptyLog(today, s.profile), ...data }
            return { logs: [...s.logs, log] }
          }
          return {
            logs: s.logs.map((l) =>
              l.date === today ? { ...l, ...data } : l
            ),
          }
        }),

      updateLogByDate: (date, data) =>
        set((s) => {
          const exists = s.logs.some((l) => l.date === date)
          if (!exists) {
            const log = { ...emptyLog(date, s.profile), ...data }
            return { logs: [...s.logs, log] }
          }
          return {
            logs: s.logs.map((l) =>
              l.date === date ? { ...l, ...data } : l
            ),
          }
        }),

      getLogByDate: (date) => {
        return get().logs.find((l) => l.date === date)
      },

      addMeal: (meal) =>
        set((s) => {
          const newMeal: Meal = {
            ...meal,
            id: generateId(),
            user_id: 'local',
            created_at: new Date().toISOString(),
          }

          // Update today's totals
          const today = todayStr()
          const todayMeals = [...s.meals.filter((m) => m.log_date === today), newMeal]
          const totalCal = todayMeals.reduce((a, m) => a + m.calories, 0)
          const totalP = todayMeals.reduce((a, m) => a + m.protein_g, 0)
          const totalF = todayMeals.reduce((a, m) => a + m.fat_g, 0)
          const totalC = todayMeals.reduce((a, m) => a + m.carbs_g, 0)

          const exists = s.logs.some((l) => l.date === today)
          const updatedLogs = exists
            ? s.logs.map((l) =>
                l.date === today
                  ? { ...l, calories_consumed: totalCal, protein_g: totalP, fat_g: totalF, carbs_g: totalC }
                  : l
              )
            : [
                ...s.logs,
                { ...emptyLog(today, s.profile), calories_consumed: totalCal, protein_g: totalP, fat_g: totalF, carbs_g: totalC },
              ]

          return { meals: [...s.meals, newMeal], logs: updatedLogs }
        }),

      getRecentLogs: (days = 7) => {
        const logs = get().logs
        return logs
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
