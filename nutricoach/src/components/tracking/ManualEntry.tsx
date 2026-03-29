import { useState } from 'react'
import { Check, X } from 'lucide-react'
import type { AIEstimation } from '../../types'

interface ManualEntryProps {
  onConfirm: (data: AIEstimation) => void
  onCancel: () => void
}

export function ManualEntry({ onConfirm, onCancel }: ManualEntryProps) {
  const [desc, setDesc] = useState('')
  const [cal, setCal] = useState(0)
  const [prot, setProt] = useState(0)
  const [fat, setFat] = useState(0)
  const [carbs, setCarbs] = useState(0)

  const handleSubmit = () => {
    onConfirm({
      calories: cal,
      protein_g: prot,
      fat_g: fat,
      carbs_g: carbs,
      items: [],
      description: desc || 'Saisie manuelle',
    })
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60" onClick={onCancel} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-dark-800 rounded-t-3xl animate-slide-up max-w-lg mx-auto">
        <div className="w-10 h-1 bg-dark-600 rounded-full mx-auto mt-3" />
        <div className="p-5">
          <p className="text-sm text-dark-400 mb-3">Saisie manuelle</p>

          <input
            type="text"
            placeholder="Description du repas"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="w-full bg-dark-700 rounded-xl px-4 py-3 text-white text-sm mb-3 outline-none placeholder:text-dark-500"
          />

          <div className="grid grid-cols-4 gap-3 mb-5">
            {([
              ['Calories', cal, setCal, 'kcal'],
              ['Prot.', prot, setProt, 'g'],
              ['Lip.', fat, setFat, 'g'],
              ['Gluc.', carbs, setCarbs, 'g'],
            ] as const).map(([label, value, setter, unit]) => (
              <div key={label} className="bg-dark-700 rounded-xl p-3 text-center">
                <p className="text-[10px] text-dark-500 mb-1">{label}</p>
                <input
                  type="number"
                  value={value || ''}
                  onChange={(e) => (setter as (v: number) => void)(Number(e.target.value))}
                  className="w-full bg-transparent text-center text-lg font-bold text-white outline-none tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <p className="text-[10px] text-dark-500">{unit}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-dark-700 text-dark-400"
            >
              <X size={18} />
              <span className="text-sm">Annuler</span>
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-dark-900 font-semibold"
            >
              <Check size={18} />
              <span className="text-sm">Ajouter</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
