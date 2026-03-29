import { useState } from 'react'
import { Plus, Dumbbell, X, Check } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { PHASE_LABELS, type DailyLog } from '../types'

export function History() {
  const { logs, meals, updateLogByDate, getLogByDate } = useAppStore()
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date))

  const [editingLog, setEditingLog] = useState<DailyLog | null>(null)
  const [showNewEntry, setShowNewEntry] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Historique</h2>
        <button
          onClick={() => setShowNewEntry(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent text-dark-900 text-sm font-semibold active:bg-accent/80 transition-colors"
        >
          <Plus size={16} />
          Ajouter
        </button>
      </div>

      {sorted.length === 0 && (
        <p className="text-dark-500 text-sm text-center py-8">Aucune donnée enregistrée.</p>
      )}

      {sorted.map((log) => {
        const dayMeals = meals.filter((m) => m.log_date === log.date)
        return (
          <button
            key={log.id}
            onClick={() => setEditingLog(log)}
            className="w-full bg-dark-800 rounded-2xl p-4 text-left active:bg-dark-700 transition-colors"
          >
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">
                  {new Date(log.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
                {log.workout_done && (
                  <div className="w-5 h-5 rounded-md bg-accent/20 flex items-center justify-center">
                    <Dumbbell size={12} className="text-accent" />
                  </div>
                )}
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-dark-700 text-dark-400">
                {PHASE_LABELS[log.current_phase]}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div>
                <p className="text-dark-500">Poids</p>
                <p className="text-white font-semibold">{log.morning_weight ? `${log.morning_weight} kg` : '--'}</p>
              </div>
              <div>
                <p className="text-dark-500">Calories</p>
                <p className="text-white font-semibold">{log.calories_consumed} kcal</p>
              </div>
              <div>
                <p className="text-dark-500">Pas</p>
                <p className="text-white font-semibold">{log.daily_steps.toLocaleString()}</p>
              </div>
            </div>
            {dayMeals.length > 0 && (
              <div className="mt-3 pt-3 border-t border-dark-700 space-y-1">
                {dayMeals.map((m) => (
                  <div key={m.id} className="flex justify-between text-xs">
                    <span className="text-dark-400 truncate mr-2">{m.description}</span>
                    <span className="text-dark-300 whitespace-nowrap">{m.calories} kcal</span>
                  </div>
                ))}
              </div>
            )}
          </button>
        )
      })}

      {/* New Entry Modal */}
      {showNewEntry && (
        <HistoryEntryModal
          onSave={(date, data) => {
            updateLogByDate(date, data)
            setShowNewEntry(false)
          }}
          onClose={() => setShowNewEntry(false)}
        />
      )}

      {/* Edit Entry Modal */}
      {editingLog && (
        <HistoryEntryModal
          existing={editingLog}
          onSave={(date, data) => {
            updateLogByDate(date, data)
            setEditingLog(null)
          }}
          onClose={() => setEditingLog(null)}
        />
      )}
    </div>
  )
}

interface HistoryEntryModalProps {
  existing?: DailyLog
  onSave: (date: string, data: Partial<DailyLog>) => void
  onClose: () => void
}

function HistoryEntryModal({ existing, onSave, onClose }: HistoryEntryModalProps) {
  const [date, setDate] = useState(existing?.date ?? '')
  const [weight, setWeight] = useState(existing?.morning_weight?.toString() ?? '')
  const [calories, setCalories] = useState(existing?.calories_consumed?.toString() ?? '0')
  const [steps, setSteps] = useState(existing?.daily_steps?.toString() ?? '0')
  const [workout, setWorkout] = useState(existing?.workout_done ?? false)

  const isEdit = !!existing

  const handleSave = () => {
    if (!date) return
    onSave(date, {
      morning_weight: weight ? parseFloat(weight) : null,
      calories_consumed: parseInt(calories) || 0,
      daily_steps: parseInt(steps) || 0,
      workout_done: workout,
    })
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-dark-800 rounded-t-3xl animate-slide-up max-w-lg mx-auto">
        <div className="w-10 h-1 bg-dark-600 rounded-full mx-auto mt-3" />
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white">
              {isEdit ? 'Modifier la journée' : 'Ajouter des données'}
            </h3>
            <button onClick={onClose} className="text-dark-500">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-3">
            {/* Date */}
            <div>
              <p className="text-xs text-dark-500 mb-1">Date</p>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={isEdit}
                max={new Date().toISOString().split('T')[0]}
                className="w-full bg-dark-700 rounded-xl px-4 py-3 text-white text-sm outline-none disabled:opacity-50 [color-scheme:dark]"
              />
            </div>

            {/* Weight & Calories row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-dark-500 mb-1">Poids (kg)</p>
                <input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="--"
                  className="w-full bg-dark-700 rounded-xl px-4 py-3 text-white text-sm outline-none tabular-nums placeholder:text-dark-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <div>
                <p className="text-xs text-dark-500 mb-1">Calories (kcal)</p>
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className="w-full bg-dark-700 rounded-xl px-4 py-3 text-white text-sm outline-none tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>

            {/* Steps */}
            <div>
              <p className="text-xs text-dark-500 mb-1">Pas</p>
              <input
                type="number"
                value={steps}
                onChange={(e) => setSteps(e.target.value)}
                className="w-full bg-dark-700 rounded-xl px-4 py-3 text-white text-sm outline-none tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            {/* Workout Toggle */}
            <button
              onClick={() => setWorkout(!workout)}
              className={`w-full rounded-xl p-3 flex items-center gap-3 transition-colors ${
                workout ? 'bg-accent/15 border border-accent/30' : 'bg-dark-700'
              }`}
            >
              <Dumbbell size={20} className={workout ? 'text-accent' : 'text-dark-500'} />
              <span className={`text-sm font-medium flex-1 text-left ${workout ? 'text-accent' : 'text-dark-400'}`}>
                Séance d'entraînement
              </span>
              <div className={`w-10 h-5.5 rounded-full p-0.5 transition-colors ${
                workout ? 'bg-accent' : 'bg-dark-600'
              }`}>
                <div className={`w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${
                  workout ? 'translate-x-4.5' : 'translate-x-0'
                }`} />
              </div>
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-5">
            <button
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-dark-700 text-dark-400 text-sm"
            >
              <X size={16} />
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={!date}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-dark-900 font-semibold text-sm disabled:opacity-40"
            >
              <Check size={16} />
              {isEdit ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
