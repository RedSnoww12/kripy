interface CalorieGaugeProps {
  consumed: number
  target: number
}

export function CalorieGauge({ consumed, target }: CalorieGaugeProps) {
  const pct = Math.min((consumed / target) * 100, 100)
  const radius = 80
  const stroke = 10
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference
  const remaining = Math.max(target - consumed, 0)
  const overColor = consumed > target ? 'text-danger' : 'text-accent'

  return (
    <div className="relative flex items-center justify-center">
      <svg width="200" height="200" className="-rotate-90">
        <circle
          cx="100" cy="100" r={radius}
          fill="none" stroke="currentColor"
          strokeWidth={stroke}
          className="text-dark-700"
        />
        <circle
          cx="100" cy="100" r={radius}
          fill="none" stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${overColor} transition-all duration-700 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white tabular-nums">{consumed}</span>
        <span className="text-xs text-dark-400 mt-0.5">/ {target} kcal</span>
        <span className={`text-sm font-semibold mt-1 ${consumed > target ? 'text-danger' : 'text-success'}`}>
          {consumed > target ? `+${consumed - target}` : remaining} restantes
        </span>
      </div>
    </div>
  )
}
