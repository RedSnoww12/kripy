import { useState } from 'react'
import { Check, X, Loader2 } from 'lucide-react'
import type { AIEstimation } from '../../types'

interface MealBottomSheetProps {
  estimation: AIEstimation | null
  loading: boolean
  error: string | null
  onConfirm: (data: AIEstimation) => void
  onCancel: () => void
}

export function MealBottomSheet({ estimation, loading, error, onConfirm, onCancel }: MealBottomSheetProps) {
  const [edited, setEdited] = useState<AIEstimation | null>(null)
  const data = edited ?? estimation

  const handleChange = (field: keyof AIEstimation, value: number) => {
    if (!data) return
    setEdited({ ...data, [field]: value })
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60" onClick={onCancel} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-dark-800 rounded-t-3xl animate-slide-up max-w-lg mx-auto">
        <div className="w-10 h-1 bg-dark-600 rounded-full mx-auto mt-3" />

        <div className="p-5">
          {loading && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 size={32} className="text-accent animate-spin" />
              <p className="text-sm text-dark-400">Analyse IA en cours...</p>
            </div>
          )}

          {error && (
            <div className="py-6 text-center">
              <p className="text-danger text-sm mb-3">{error}</p>
              <button onClick={onCancel} className="text-dark-400 text-sm">Fermer</button>
            </div>
          )}

          {!loading && !error && data && (
            <>
              <p className="text-sm text-dark-400 mb-1">Estimation IA</p>
              <p className="text-white font-semibold mb-4">{data.description}</p>

              {data.items.length > 0 && (
                <div className="mb-4 space-y-1">
                  {data.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs text-dark-400">
                      <span>{item.name} ({item.grams}g)</span>
                      <span>{item.calories} kcal</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-4 gap-3 mb-5">
                {([
                  ['Calories', 'calories', 'kcal'],
                  ['Prot.', 'protein_g', 'g'],
                  ['Lip.', 'fat_g', 'g'],
                  ['Gluc.', 'carbs_g', 'g'],
                ] as const).map(([label, field, unit]) => (
                  <div key={field} className="bg-dark-700 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-dark-500 mb-1">{label}</p>
                    <input
                      type="number"
                      value={data[field]}
                      onChange={(e) => handleChange(field, Number(e.target.value))}
                      className="w-full bg-transparent text-center text-lg font-bold text-white outline-none tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <p className="text-[10px] text-dark-500">{unit}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-dark-700 text-dark-400 active:bg-dark-600 transition-colors"
                >
                  <X size={18} />
                  <span className="text-sm font-medium">Annuler</span>
                </button>
                <button
                  onClick={() => data && onConfirm(data)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-dark-900 font-semibold active:bg-accent/80 transition-colors"
                >
                  <Check size={18} />
                  <span className="text-sm">Ajouter</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
