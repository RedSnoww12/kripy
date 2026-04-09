interface MacroBreakdownProps {
  protein: { current: number; target: number }
  fat: { current: number; target: number }
  carbs: { current: number; target: number }
}

function MacroBar({ label, current, target, color }: {
  label: string
  current: number
  target: number
  color: string
}) {
  const pct = Math.min((current / target) * 100, 100)

  return (
    <div className="flex-1">
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-[11px] text-dark-400">{label}</span>
        <span className="text-xs font-semibold text-white tabular-nums">
          {current}<span className="text-dark-500 font-normal">/{target}g</span>
        </span>
      </div>
      <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function MacroBreakdown({ protein, fat, carbs }: MacroBreakdownProps) {
  return (
    <div className="bg-dark-800 rounded-2xl p-4">
      <p className="text-xs text-dark-500 mb-3 font-medium">Macronutriments</p>
      <div className="flex gap-4">
        <MacroBar label="Prot." current={protein.current} target={protein.target} color="bg-blue-400" />
        <MacroBar label="Lip." current={fat.current} target={fat.target} color="bg-amber-400" />
        <MacroBar label="Gluc." current={carbs.current} target={carbs.target} color="bg-emerald-400" />
      </div>
    </div>
  )
}
