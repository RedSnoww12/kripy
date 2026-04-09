import { useAppStore } from '../stores/appStore'
import { PHASE_LABELS, type Phase } from '../types'

export function Profile() {
  const { profile, setProfile } = useAppStore()

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-white">Profil</h2>

      <div className="bg-dark-800 rounded-2xl p-4 space-y-4">
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

        <Field label="Objectif calorique (kcal)">
          <NumberInput value={profile.calorie_target} onChange={(v) => setProfile({ calorie_target: v })} />
        </Field>

        <Field label="Protéines (g)">
          <NumberInput value={profile.protein_g} onChange={(v) => setProfile({ protein_g: v })} />
        </Field>

        <Field label="Lipides (g)">
          <NumberInput value={profile.fat_g} onChange={(v) => setProfile({ fat_g: v })} />
        </Field>

        <Field label="Glucides (g)">
          <NumberInput value={profile.carbs_g} onChange={(v) => setProfile({ carbs_g: v })} />
        </Field>
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

function NumberInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full bg-dark-700 rounded-xl px-4 py-3 text-white text-sm outline-none tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
    />
  )
}
