import { useAppStore } from '../stores/appStore'
import { PHASE_LABELS, type Phase } from '../types'

const PRESETS = [
  { label: '40/30/30', p: 30, f: 30, c: 40, desc: 'Classique fitness' },
  { label: '50/25/25', p: 25, f: 25, c: 50, desc: 'Performance' },
  { label: '40/35/25', p: 35, f: 25, c: 40, desc: 'Haute protéine' },
  { label: '30/20/50', p: 20, f: 20, c: 60, desc: 'Endurance' },
]

export function Profile() {
  const { profile, setProfile } = useAppStore()

  const total = profile.protein_pct + profile.fat_pct + profile.carbs_pct
  const isValid = total === 100

  const adjust = (macro: 'protein_pct' | 'fat_pct' | 'carbs_pct', delta: number) => {
    const newVal = Math.max(5, Math.min(70, profile[macro] + delta))
    setProfile({ [macro]: newVal })
  }

  const applyPreset = (p: number, f: number, c: number) => {
    setProfile({ protein_pct: p, fat_pct: f, carbs_pct: c })
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => setProfile({ calorie_target: profile.calorie_target - 100 })}
              className="w-12 h-12 rounded-xl bg-dark-700 text-white text-xl font-bold active:bg-dark-600 transition-colors"
            >-</button>
            <input
              type="number"
              value={profile.calorie_target}
              onChange={(e) => setProfile({ calorie_target: Number(e.target.value) })}
              className="flex-1 bg-dark-700 rounded-xl py-3 text-white text-center text-xl font-bold outline-none tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              onClick={() => setProfile({ calorie_target: profile.calorie_target + 100 })}
              className="w-12 h-12 rounded-xl bg-dark-700 text-white text-xl font-bold active:bg-dark-600 transition-colors"
            >+</button>
          </div>
        </Field>
      </div>

      {/* Presets */}
      <div className="bg-dark-800 rounded-2xl p-4">
        <p className="text-xs text-dark-500 font-medium mb-3">Presets rapides</p>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((pr) => {
            const active = profile.protein_pct === pr.p && profile.fat_pct === pr.f && profile.carbs_pct === pr.c
            return (
              <button
                key={pr.label}
                onClick={() => applyPreset(pr.p, pr.f, pr.c)}
                className={`rounded-xl p-3 text-left transition-colors ${
                  active ? 'bg-accent/15 border border-accent/30' : 'bg-dark-700 active:bg-dark-600'
                }`}
              >
                <p className={`text-sm font-semibold ${active ? 'text-accent' : 'text-white'}`}>
                  G{pr.c} / P{pr.p} / L{pr.f}
                </p>
                <p className="text-[10px] text-dark-500">{pr.desc}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Macro adjustment */}
      <div className="bg-dark-800 rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-dark-500 font-medium">Répartition manuelle</p>
          <span className={`text-xs font-semibold tabular-nums ${isValid ? 'text-success' : 'text-danger'}`}>
            Total : {total}%
          </span>
        </div>

        <MacroRow
          label="Protéines"
          pct={profile.protein_pct}
          grams={profile.protein_g}
          color="text-blue-400"
          barColor="bg-blue-400"
          onMinus={() => adjust('protein_pct', -5)}
          onPlus={() => adjust('protein_pct', 5)}
        />
        <MacroRow
          label="Lipides"
          pct={profile.fat_pct}
          grams={profile.fat_g}
          color="text-amber-400"
          barColor="bg-amber-400"
          onMinus={() => adjust('fat_pct', -5)}
          onPlus={() => adjust('fat_pct', 5)}
        />
        <MacroRow
          label="Glucides"
          pct={profile.carbs_pct}
          grams={profile.carbs_g}
          color="text-emerald-400"
          barColor="bg-emerald-400"
          onMinus={() => adjust('carbs_pct', -5)}
          onPlus={() => adjust('carbs_pct', 5)}
        />

        {!isValid && (
          <p className="text-danger text-[10px]">
            Le total doit faire 100%. Ajuste les macros.
          </p>
        )}

        {/* Visual bar */}
        <div className="flex h-3 rounded-full overflow-hidden">
          <div className="bg-blue-400 transition-all" style={{ width: `${profile.protein_pct}%` }} />
          <div className="bg-amber-400 transition-all" style={{ width: `${profile.fat_pct}%` }} />
          <div className="bg-emerald-400 transition-all" style={{ width: `${profile.carbs_pct}%` }} />
        </div>
      </div>

      {/* Computed grams */}
      <div className="bg-dark-800 rounded-2xl p-4">
        <p className="text-xs text-dark-500 font-medium mb-3">Objectifs journaliers</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xl font-bold text-white tabular-nums">{profile.protein_g}g</p>
            <p className="text-[10px] text-blue-400">Protéines</p>
          </div>
          <div>
            <p className="text-xl font-bold text-white tabular-nums">{profile.fat_g}g</p>
            <p className="text-[10px] text-amber-400">Lipides</p>
          </div>
          <div>
            <p className="text-xl font-bold text-white tabular-nums">{profile.carbs_g}g</p>
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

function MacroRow({ label, pct, grams, color, barColor, onMinus, onPlus }: {
  label: string
  pct: number
  grams: number
  color: string
  barColor: string
  onMinus: () => void
  onPlus: () => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className={`text-sm font-medium ${color}`}>{label}</span>
        <span className="text-xs text-dark-400 tabular-nums">{grams}g</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onMinus}
          className="w-10 h-10 rounded-xl bg-dark-700 text-white text-lg font-bold active:bg-dark-600 transition-colors shrink-0"
        >-</button>
        <div className="flex-1 relative">
          <div className="h-8 bg-dark-700 rounded-xl overflow-hidden flex items-center justify-center">
            <div className={`absolute left-0 top-0 bottom-0 ${barColor} opacity-20 transition-all`} style={{ width: `${pct}%` }} />
            <span className="text-sm font-bold text-white tabular-nums relative">{pct}%</span>
          </div>
        </div>
        <button
          onClick={onPlus}
          className="w-10 h-10 rounded-xl bg-dark-700 text-white text-lg font-bold active:bg-dark-600 transition-colors shrink-0"
        >+</button>
      </div>
    </div>
  )
}
