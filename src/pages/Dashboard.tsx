import { useState } from 'react'
import { Footprints, Dumbbell } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { analyzeCoaching, computeMovingAverage } from '../lib/algorithm'
import { getAI } from '../lib/ai'
import { CalorieGauge } from '../components/dashboard/CalorieGauge'
import { WeightCard } from '../components/dashboard/WeightCard'
import { AlgorithmStatus } from '../components/dashboard/AlgorithmStatus'
import { MacroBreakdown } from '../components/dashboard/MacroBreakdown'
import { WeightChart } from '../components/charts/WeightChart'
import { FAB } from '../components/layout/FAB'
import { CameraCapture } from '../components/tracking/CameraCapture'
import { AudioCapture } from '../components/tracking/AudioCapture'
import { MealBottomSheet } from '../components/tracking/MealBottomSheet'
import { ManualEntry } from '../components/tracking/ManualEntry'
import { PhotoContextSheet } from '../components/tracking/PhotoContextSheet'
import type { AIEstimation } from '../types'

export function Dashboard() {
  const { profile, getTodayLog, updateTodayLog, addMeal, getRecentLogs } = useAppStore()
  const todayLog = getTodayLog()
  const recentLogs = getRecentLogs(7)

  const [mode, setMode] = useState<'idle' | 'camera' | 'audio' | 'manual'>('idle')
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [estimation, setEstimation] = useState<AIEstimation | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [editingWeight, setEditingWeight] = useState(false)
  const [editingSteps, setEditingSteps] = useState(false)

  const algoResult = analyzeCoaching(recentLogs, profile.current_phase)
  const weights = recentLogs.map((l) => l.morning_weight)
  const avgWeight = computeMovingAverage(weights)

  const handlePhotoCapture = (base64: string) => {
    setCapturedPhoto(base64)
    setMode('idle')
  }

  const handlePhotoAnalyze = async (context?: string) => {
    if (!capturedPhoto) return
    setCapturedPhoto(null)
    setSheetOpen(true)
    setAiLoading(true)
    setAiError(null)
    try {
      const est = await getAI(profile).analyzePhoto(capturedPhoto, context)
      setEstimation(est)
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'Erreur IA')
    } finally {
      setAiLoading(false)
    }
  }

  const handleAudioCapture = async (blob: Blob) => {
    setMode('idle')
    setSheetOpen(true)
    setAiLoading(true)
    setAiError(null)
    try {
      const est = await getAI(profile).analyzeAudio(blob)
      setEstimation(est)
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'Erreur IA')
    } finally {
      setAiLoading(false)
    }
  }

  const handleConfirmMeal = (data: AIEstimation) => {
    addMeal({
      log_date: todayLog.date,
      description: data.description,
      calories: data.calories,
      protein_g: data.protein_g,
      fat_g: data.fat_g,
      carbs_g: data.carbs_g,
      source: 'manual',
      ai_raw_response: null,
    })
    setSheetOpen(false)
    setEstimation(null)
    setMode('idle')
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">NutriCoach</h1>
          <p className="text-xs text-dark-500">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      {/* Calorie Gauge */}
      <div className="flex justify-center">
        <CalorieGauge consumed={todayLog.calories_consumed} target={profile.calorie_target} />
      </div>

      {/* Weight Card */}
      <WeightCard
        weight={todayLog.morning_weight}
        trend={algoResult.trend}
        average={avgWeight}
        onEdit={() => setEditingWeight(true)}
      />

      {/* Steps */}
      <button
        onClick={() => setEditingSteps(true)}
        className="w-full bg-dark-800 rounded-2xl p-4 flex items-center gap-4 active:bg-dark-700 transition-colors text-left"
      >
        <div className="w-12 h-12 rounded-xl bg-dark-700 flex items-center justify-center">
          <Footprints size={22} className="text-accent" />
        </div>
        <div>
          <p className="text-xs text-dark-500 mb-0.5">Pas du jour</p>
          <p className="text-xl font-bold text-white tabular-nums">
            {todayLog.daily_steps.toLocaleString('fr-FR')}
          </p>
        </div>
      </button>

      {/* Workout Toggle */}
      <button
        onClick={() => updateTodayLog({ workout_done: !todayLog.workout_done })}
        className={`w-full rounded-2xl p-4 flex items-center gap-4 transition-colors text-left ${
          todayLog.workout_done
            ? 'bg-accent/15 border border-accent/30'
            : 'bg-dark-800 active:bg-dark-700'
        }`}
      >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          todayLog.workout_done ? 'bg-accent/20' : 'bg-dark-700'
        }`}>
          <Dumbbell size={22} className={todayLog.workout_done ? 'text-accent' : 'text-dark-500'} />
        </div>
        <div className="flex-1">
          <p className="text-xs text-dark-500 mb-0.5">Séance du jour</p>
          <p className={`text-sm font-semibold ${todayLog.workout_done ? 'text-accent' : 'text-dark-400'}`}>
            {todayLog.workout_done ? 'Séance effectuée' : 'Pas de séance'}
          </p>
        </div>
        <div className={`w-11 h-6 rounded-full p-0.5 transition-colors ${
          todayLog.workout_done ? 'bg-accent' : 'bg-dark-600'
        }`}>
          <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
            todayLog.workout_done ? 'translate-x-5' : 'translate-x-0'
          }`} />
        </div>
      </button>

      {/* Algorithm Status */}
      <AlgorithmStatus result={algoResult} phase={profile.current_phase} />

      {/* Macros */}
      <MacroBreakdown
        protein={{ current: todayLog.protein_g, target: profile.protein_g }}
        fat={{ current: todayLog.fat_g, target: profile.fat_g }}
        carbs={{ current: todayLog.carbs_g, target: profile.carbs_g }}
      />

      {/* Mini Chart */}
      <WeightChart logs={recentLogs} />

      {/* FAB */}
      <FAB
        onPhoto={() => setMode('camera')}
        onAudio={() => setMode('audio')}
        onManual={() => setMode('manual')}
      />

      {/* Camera */}
      {mode === 'camera' && <CameraCapture onCapture={handlePhotoCapture} />}

      {/* Photo context — description step after camera */}
      {capturedPhoto && (
        <PhotoContextSheet
          base64Image={capturedPhoto}
          onAnalyze={handlePhotoAnalyze}
          onCancel={() => setCapturedPhoto(null)}
          onTranscribe={(blob) => getAI(profile).transcribeAudio(blob)}
        />
      )}

      {/* Audio */}
      {mode === 'audio' && (
        <AudioCapture
          onCapture={handleAudioCapture}
          onCancel={() => setMode('idle')}
        />
      )}

      {/* Manual Entry */}
      {mode === 'manual' && (
        <ManualEntry
          onConfirm={handleConfirmMeal}
          onCancel={() => setMode('idle')}
        />
      )}

      {/* Bottom Sheet */}
      {sheetOpen && (
        <MealBottomSheet
          estimation={estimation}
          loading={aiLoading}
          error={aiError}
          onConfirm={handleConfirmMeal}
          onCancel={() => { setSheetOpen(false); setEstimation(null); setAiError(null) }}
        />
      )}

      {/* Weight Edit Modal */}
      {editingWeight && (
        <WeightModal
          current={todayLog.morning_weight}
          onSave={(w) => { updateTodayLog({ morning_weight: w }); setEditingWeight(false) }}
          onClose={() => setEditingWeight(false)}
        />
      )}

      {/* Steps Edit Modal */}
      {editingSteps && (
        <StepsModal
          current={todayLog.daily_steps}
          onSave={(s) => { updateTodayLog({ daily_steps: s }); setEditingSteps(false) }}
          onClose={() => setEditingSteps(false)}
        />
      )}
    </div>
  )
}

function WeightModal({ current, onSave, onClose }: { current: number | null; onSave: (w: number) => void; onClose: () => void }) {
  const [val, setVal] = useState(current?.toString() ?? '')
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose} />
      <div className="fixed top-1/3 left-4 right-4 z-50 bg-dark-800 rounded-2xl p-5 max-w-lg mx-auto">
        <p className="text-sm text-dark-400 mb-3">Poids matinal (kg)</p>
        <input
          type="number"
          step="0.1"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          autoFocus
          className="w-full bg-dark-700 rounded-xl px-4 py-3 text-2xl font-bold text-white text-center outline-none tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-dark-700 text-dark-400 text-sm">Annuler</button>
          <button onClick={() => val && onSave(parseFloat(val))} className="flex-1 py-3 rounded-xl bg-accent text-dark-900 font-semibold text-sm">Enregistrer</button>
        </div>
      </div>
    </>
  )
}

function StepsModal({ current, onSave, onClose }: { current: number; onSave: (s: number) => void; onClose: () => void }) {
  const [val, setVal] = useState(current.toString())
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose} />
      <div className="fixed top-1/3 left-4 right-4 z-50 bg-dark-800 rounded-2xl p-5 max-w-lg mx-auto">
        <p className="text-sm text-dark-400 mb-3">Pas quotidiens</p>
        <input
          type="number"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          autoFocus
          className="w-full bg-dark-700 rounded-xl px-4 py-3 text-2xl font-bold text-white text-center outline-none tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-dark-700 text-dark-400 text-sm">Annuler</button>
          <button onClick={() => val && onSave(parseInt(val))} className="flex-1 py-3 rounded-xl bg-accent text-dark-900 font-semibold text-sm">Enregistrer</button>
        </div>
      </div>
    </>
  )
}
