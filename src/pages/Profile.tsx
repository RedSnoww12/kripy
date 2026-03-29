import { useAppStore } from '../stores/appStore'
import { PHASE_LABELS, type Phase } from '../types'

export function Profile() {
  const { profile, setProfile } = useAppStore()

  const total = profile.protein_pct + profile.fat_pct + profile.carbs_pct
  const isValid = total === 100

  const handlePctChange = (macro: 'protein_pct' | 'fat_pct' | 'carbs_pct', value: number) => {
    setProfile({ [macro]: value })
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white">Profil</h2>

      {/* Phase */}
      <div className="bg-dark-800 rounded-2xl p-4">
        <Field label="Phase actuelle">
          <select
            value={profile.current_phase}
            onChange={(e) => setProfile({ current_phase: e.target.value as Phase })}
            className="w-full bg-dark-700 rounded-xl px-4 py-3 text-white text-sm outline-none"
          >
            {Object.entries(PHASE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </Field>
      </div>

      {/* Calories */}
      <div className="bg-dark-800 rounded-2xl p-4">
        <Field label="Objectif calorique (kcal)">
          <input
            type="number"
            value={profile.calorie_target}
            onChange={(e) => setProfile({ calorie_target: Number(e.target.value) })}
            className="w-full bg-dark-700 rounded-xl px-4 py-3 text-white text-sm outline-none tabular-nums text-center text-xl font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </Field>
      </div>

      {/* Macro Percentages */}
      <div className="bg-dark-800 rounded-2xl p-4 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-xs text-dark-500 font-medium">Répartition des macros</p>
          <span className={`text-xs font-semibold tabular-nums ${isValid ? 'text-success' : 'text-danger'}`}>
            {total}%
          </span>
        </div>

        <MacroSlider
          label="Protéines"
          pct={profile.protein_pct}
          grams={profile.protein_g}
          color="bg-blue-400"
          onChange={(v) => handlePctChange('protein_pct', v)}
        />

        <MacroSlider
          label="Lipides"
          pct={profile.fat_pct}
          grams={profile.fat_g}
          color="bg-amber-400"
          onChange={(v) => handlePctChange('fat_pct', v)}
        />

        <MacroSlider
          label="Glucides"
          pct={profile.carbs_pct}
          grams={profile.carbs_g}
          color="bg-emerald-400"
          onChange={(v) => handlePctChange('carbs_pct', v)}
        />

        {!isValid && (
          <p className="text-danger text-[10px]">
            Le total doit faire 100%. Actuellement : {total}%
          </p>
        )}

        {/* Visual bar */}
        <div className="flex h-3 rounded-full overflow-hidden">
          <div className="bg-blue-400 transition-all" style={{ width: `${profile.protein_pct}%` }} />
          <div className="bg-amber-400 transition-all" style={{ width: `${profile.fat_pct}%` }} />
          <div className="bg-emerald-400 transition-all" style={{ width: `${profile.carbs_pct}%` }} />
        </div>
      </div>

      {/* Computed grams summary */}
      <div className="bg-dark-800 rounded-2xl p-4">
        <p className="text-xs text-dark-500 font-medium mb-3">Objectifs journaliers calculés</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-lg font-bold text-white tabular-nums">{profile.protein_g}g</p>
            <p className="text-[10px] text-blue-400">Protéines</p>
          </div>
          <div>
            <p className="text-lg font-bold text-white tabular-nums">{profile.fat_g}g</p>
            <p className="text-[10px] text-amber-400">Lipides</p>
          </div>
          <div>
            <p className="text-lg font-bold text-white tabular-nums">{profile.carbs_g}g</p>
            <p className="text-[10px] text-emerald-400">Glucides</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-dark-500 mb-1.5">{label}</p>
      {children}
    </div>
  )
}

function MacroSlider({ label, pct, grams, color, onChange }: {
  label: string
  pct: number
  grams: number
  color: string
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-sm text-white font-medium">{label}</span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-bold text-white tabular-nums">{pct}%</span>
          <span className="text-[10px] text-dark-500 tabular-nums">({grams}g)</span>
        </div>
      </div>
      <div className="relative">
        <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
        </div>
        <input
          type="range"
          min={5}
          max={70}
          value={pct}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  )
}
